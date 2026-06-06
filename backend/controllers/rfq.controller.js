const { pool } = require('../db/db');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const catchAsync = require('../utils/catchAsync');

/**
 * INTERNAL VIEWS (Admin, Procurement Officer, Manager)
 */

exports.createRfq = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const userId = req.user.id;
  
  const { title, description, items, deadline, delivery_location, vendor_ids = [], attachment_urls = [], notes } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Generate RFQ Number safely using pg function
    const year = new Date().getFullYear();
    const docNumRes = await client.query('SELECT next_document_number($1, $2, $3::smallint)', [orgId, 'rfq', year]);
    const rfqNumber = docNumRes.rows[0].next_document_number;

    // 2. Filter invalid/inactive vendors out silently or throw error (we'll just use the ones valid)
    let validVendorIds = [];
    if (vendor_ids.length > 0) {
      const vRes = await client.query(
        'SELECT id FROM vendors WHERE id = ANY($1) AND org_id = $2 AND is_approved = true AND is_active = true',
        [vendor_ids, orgId]
      );
      validVendorIds = vRes.rows.map(v => v.id);
    }

    const initialStatus = validVendorIds.length > 0 ? 'sent' : 'draft';

    // 3. Create RFQ Master Record
    const rfqRes = await client.query(
      `INSERT INTO rfqs (org_id, rfq_number, title, description, deadline, delivery_location, status, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [orgId, rfqNumber, title, description, deadline, delivery_location, initialStatus, notes, userId]
    );
    const rfqId = rfqRes.rows[0].id;

    // 4. Insert Items
    for (const item of items) {
      await client.query(
        `INSERT INTO rfq_items (rfq_id, product_name, description, quantity, unit, specifications)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [rfqId, item.product_name, item.description, item.quantity, item.unit, item.specifications]
      );
    }

    // 5. Insert Attachments
    for (const url of attachment_urls) {
      await client.query(
        `INSERT INTO rfq_attachments (rfq_id, file_url, uploaded_by) VALUES ($1, $2, $3)`,
        [rfqId, url, userId]
      );
    }

    // 6. Link Vendors (Junction Table)
    for (const vId of validVendorIds) {
      await client.query(
        `INSERT INTO rfq_vendors (rfq_id, vendor_id, status) VALUES ($1, $2, 'pending')`,
        [rfqId, vId]
      );
    }

    await client.query('COMMIT');
    
    sendSuccess(res, 201, `RFQ saved tracking ID: ${rfqNumber}. Sent to ${validVendorIds.length} approved vendors.`, {
      rfq_id: rfqId,
      rfq_number: rfqNumber,
      status: initialStatus
    });

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

exports.listRfqs = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const { status, search, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const values = [orgId];
  let whereClauses = ['org_id = $1'];
  let count = 2;

  if (status) {
    whereClauses.push(`status = $${count}`);
    values.push(status);
    count++;
  }

  if (search) {
    whereClauses.push(`(title ILIKE $${count} OR rfq_number ILIKE $${count})`);
    values.push(`%${search}%`);
    count++;
  }

  const whereString = whereClauses.join(' AND ');

  const countRes = await pool.query(`SELECT COUNT(*) FROM rfq_summary WHERE ${whereString}`, values);
  const total = parseInt(countRes.rows[0].count, 10);

  const query = `
    SELECT * FROM rfq_summary
    WHERE ${whereString}
    ORDER BY created_at DESC
    LIMIT $${count} OFFSET $${count + 1}
  `;
  const result = await pool.query(query, [...values, limit, offset]);

  sendSuccess(res, 200, 'RFQs fetched', {
    rfqs: result.rows,
    total,
    page: Number(page),
    limit: Number(limit)
  });
});

exports.getRfq = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const { rfqId } = req.params;

  const rfqRes = await pool.query('SELECT * FROM rfqs WHERE id = $1 AND org_id = $2', [rfqId, orgId]);
  if (rfqRes.rows.length === 0) return next(new AppError('RFQ not found', 404, 'NOT_FOUND'));

  const rfq = rfqRes.rows[0];

  const itemsRes = await pool.query('SELECT * FROM rfq_items WHERE rfq_id = $1', [rfqId]);
  const attachmentsRes = await pool.query('SELECT * FROM rfq_attachments WHERE rfq_id = $1', [rfqId]);
  const vendorsRes = await pool.query(`
    SELECT rv.status, rv.sent_at, v.company_name, v.email 
    FROM rfq_vendors rv 
    JOIN vendors v ON rv.vendor_id = v.id 
    WHERE rv.rfq_id = $1
  `, [rfqId]);

  rfq.items = itemsRes.rows;
  rfq.attachments = attachmentsRes.rows;
  rfq.vendors = vendorsRes.rows;

  sendSuccess(res, 200, 'RFQ fetched successfully', { rfq });
});

exports.updateRfq = catchAsync(async (req, res, next) => {
  // Only allowed in 'draft'. Assuming full replacement pattern for simplicity based on contract, or selective fields.
  const orgId = req.user.org_id;
  const { rfqId } = req.params;
  const { title, description, deadline, delivery_location, notes } = req.body;

  const rfqCheck = await pool.query('SELECT status FROM rfqs WHERE id = $1 AND org_id = $2', [rfqId, orgId]);
  if (rfqCheck.rows.length === 0) return next(new AppError('RFQ not found', 404, 'NOT_FOUND'));
  if (rfqCheck.rows[0].status !== 'draft') return next(new AppError('Only draft RFQs can be directly modified', 400, 'BAD_REQUEST'));

  let query = 'UPDATE rfqs SET ';
  const values = [];
  let count = 1;

  if (title !== undefined) { query += `title = $${count}, `; values.push(title); count++; }
  if (description !== undefined) { query += `description = $${count}, `; values.push(description); count++; }
  if (deadline !== undefined) { query += `deadline = $${count}, `; values.push(deadline); count++; }
  if (delivery_location !== undefined) { query += `delivery_location = $${count}, `; values.push(delivery_location); count++; }
  if (notes !== undefined) { query += `notes = $${count}, `; values.push(notes); count++; }

  if (values.length === 0) return sendSuccess(res, 200, 'Nothing to update');

  query = query.slice(0, -2);
  query += ` WHERE id = $${count} AND org_id = $${count + 1} RETURNING id`;
  values.push(rfqId, orgId);

  await pool.query(query, values);

  sendSuccess(res, 200, 'RFQ updated successfully');
});

exports.cancelRfq = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const { rfqId } = req.params;
  const { reason } = req.body;

  const result = await pool.query(
    `UPDATE rfqs SET status = 'cancelled', cancel_reason = $1 WHERE id = $2 AND org_id = $3 RETURNING id`,
    [reason, rfqId, orgId]
  );

  if (result.rows.length === 0) return next(new AppError('RFQ not found', 404, 'NOT_FOUND'));

  sendSuccess(res, 200, 'RFQ cancelled successfully');
});

exports.addVendorsToRfq = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const { rfqId } = req.params;
  const { vendor_ids } = req.body;

  // Validate RFQ exists and is not closed/cancelled
  const rfqCheck = await pool.query('SELECT status FROM rfqs WHERE id = $1 AND org_id = $2', [rfqId, orgId]);
  if (rfqCheck.rows.length === 0) return next(new AppError('RFQ not found', 404, 'NOT_FOUND'));
  if (['closed', 'awarded', 'cancelled'].includes(rfqCheck.rows[0].status)) {
    return next(new AppError('Cannot invite vendors to a closed, awarded, or cancelled RFQ', 400, 'BAD_REQUEST'));
  }

  // Filter valid vendors
  const vRes = await pool.query(
    'SELECT id FROM vendors WHERE id = ANY($1) AND org_id = $2 AND is_approved = true AND is_active = true',
    [vendor_ids, orgId]
  );
  const validVendorIds = vRes.rows.map(v => v.id);

  let addedCount = 0;
  for (const vId of validVendorIds) {
    try {
      await pool.query(`INSERT INTO rfq_vendors (rfq_id, vendor_id, status) VALUES ($1, $2, 'pending')`, [rfqId, vId]);
      addedCount++;
    } catch(err) {
      // Ignore unique constraint violations if vendor was already attached
      if (err.code !== '23505') throw err;
    }
  }

  // Update status if it was draft and we successfully added vendors
  if (rfqCheck.rows[0].status === 'draft' && addedCount > 0) {
    await pool.query(`UPDATE rfqs SET status = 'sent' WHERE id = $1`, [rfqId]);
  }

  sendSuccess(res, 200, `Invited ${addedCount} new vendors to RFQ`);
});


/**
 * EXTERNAL VIEWS (Vendor Portal side)
 */

exports.listVendorRfqs = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const userId = req.user.id;
  const { status, page = 1, limit = 10 } = req.query;

  const vendorRes = await pool.query('SELECT vendor_id FROM users WHERE id = $1 AND org_id = $2', [userId, orgId]);
  const vendorId = vendorRes.rows[0]?.vendor_id;

  if (!vendorId) return next(new AppError('Unlinked vendor account', 400, 'BAD_REQUEST'));

  const offset = (page - 1) * limit;
  const values = [vendorId];
  let whereClauses = ['rv.vendor_id = $1', "r.status NOT IN ('draft')"];
  let count = 2;

  if (status) {
    whereClauses.push(`rv.status = $${count}`);
    values.push(status);
    count++;
  }

  const whereString = whereClauses.join(' AND ');

  const countQuery = `
    SELECT COUNT(*) 
    FROM rfq_vendors rv
    JOIN rfqs r ON rv.rfq_id = r.id
    WHERE ${whereString}
  `;
  const countDbRes = await pool.query(countQuery, values);
  const total = parseInt(countDbRes.rows[0].count, 10);

  const query = `
    SELECT r.id, r.rfq_number, r.title, r.deadline, rv.status AS vendor_status, rv.sent_at 
    FROM rfq_vendors rv
    JOIN rfqs r ON rv.rfq_id = r.id
    WHERE ${whereString}
    ORDER BY r.created_at DESC
    LIMIT $${count} OFFSET $${count + 1}
  `;
  const dataRes = await pool.query(query, [...values, limit, offset]);

  sendSuccess(res, 200, 'RFQs fetched', {
    rfqs: dataRes.rows,
    total,
    page: Number(page),
    limit: Number(limit)
  });
});

exports.getVendorRfq = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const userId = req.user.id;
  const { rfqId } = req.params;

  const vendorRes = await pool.query('SELECT vendor_id FROM users WHERE id = $1 AND org_id = $2', [userId, orgId]);
  const vendorId = vendorRes.rows[0]?.vendor_id;

  if (!vendorId) return next(new AppError('Unlinked vendor account', 400, 'BAD_REQUEST'));

  // Vendor can only fetch RFQ if they are linked in rfq_vendors
  const linkCheck = await pool.query('SELECT status, sent_at FROM rfq_vendors WHERE rfq_id = $1 AND vendor_id = $2', [rfqId, vendorId]);
  if (linkCheck.rows.length === 0) {
    return next(new AppError('You do not have access to this RFQ', 403, 'FORBIDDEN'));
  }

  const rfqRes = await pool.query('SELECT id, rfq_number, title, description, deadline, delivery_location, status FROM rfqs WHERE id = $1', [rfqId]);
  const rfq = rfqRes.rows[0];
  
  rfq.vendor_status = linkCheck.rows[0].status;
  rfq.invited_at = linkCheck.rows[0].sent_at;

  const itemsRes = await pool.query('SELECT id, product_name, description, quantity, unit, specifications FROM rfq_items WHERE rfq_id = $1', [rfqId]);
  rfq.items = itemsRes.rows;

  const attachmentsRes = await pool.query('SELECT file_url, file_name FROM rfq_attachments WHERE rfq_id = $1', [rfqId]);
  rfq.attachments = attachmentsRes.rows;

  sendSuccess(res, 200, 'RFQ fetched successfully', { rfq });
});
