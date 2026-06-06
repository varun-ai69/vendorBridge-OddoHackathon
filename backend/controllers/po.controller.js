const { pool } = require('../db/db');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const catchAsync = require('../utils/catchAsync');

// Helper to get vendor ID dynamically
const getVendorId = async (userId, orgId) => {
  const res = await pool.query('SELECT vendor_id FROM users WHERE id = $1 AND org_id = $2', [userId, orgId]);
  return res.rows[0]?.vendor_id;
};

/**
 * 8.1 Generate PO (after approval)
 */
exports.generatePo = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const userId = req.user.id;
  const { rfq_id, quotation_id, approval_id, delivery_address, expected_delivery_date, payment_terms, special_instructions } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Validate Approval State
    const appCheck = await client.query('SELECT status FROM approval_requests WHERE id = $1 AND org_id = $2 AND rfq_id = $3 AND quotation_id = $4', [approval_id, orgId, rfq_id, quotation_id]);
    if (appCheck.rows.length === 0) throw new AppError('Valid approval request not found', 404, 'NOT_FOUND');
    if (appCheck.rows[0].status !== 'approved') throw new AppError('Cannot generate PO without an approved request status.', 400, 'BAD_REQUEST');

    // 2. Prevent Duplicate POs for same quotation
    const dupCheck = await client.query('SELECT id FROM purchase_orders WHERE quotation_id = $1', [quotation_id]);
    if (dupCheck.rows.length > 0) throw new AppError('A PO has already been generated for this quotation.', 409, 'CONFLICT');

    // 3. Fetch Quotation Meta (for totals & vendor link)
    const quoteData = await client.query('SELECT vendor_id, currency, subtotal, tax_total, total_amount FROM quotations WHERE id = $1', [quotation_id]);
    const qMeta = quoteData.rows[0];

    // 4. Generate Document Number
    const year = new Date().getFullYear();
    const docNumRes = await client.query('SELECT next_document_number($1, $2, $3::smallint)', [orgId, 'po', year]);
    const poNumber = docNumRes.rows[0].next_document_number;

    // 5. Insert PO
    const poRes = await client.query(`
      INSERT INTO purchase_orders (
        org_id, po_number, rfq_id, quotation_id, approval_id, vendor_id,
        delivery_address, expected_delivery_date, payment_terms, special_instructions,
        subtotal, tax_total, grand_total, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'generated', $14) RETURNING id
    `, [
      orgId, poNumber, rfq_id, quotation_id, approval_id, qMeta.vendor_id, 
      delivery_address, expected_delivery_date, payment_terms, special_instructions,
      qMeta.subtotal, qMeta.tax_total, qMeta.total_amount, userId
    ]);

    const poId = poRes.rows[0].id;

    // 6. Copy Quoted Items onto PO
    const itemsRef = await client.query('SELECT * FROM quotation_items WHERE quotation_id = $1', [quotation_id]);
    for (const item of itemsRef.rows) {
      await client.query(`
        INSERT INTO po_items (po_id, product_name, quantity, unit, unit_price, subtotal, tax_percent, tax_amount, total)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [poId, item.product_name, item.quantity, item.unit, item.unit_price, item.subtotal, item.tax_percent, item.tax_amount, item.total]);
    }

    const { generatePDF } = require('../utils/pdfGenerator');
    const pdfUrl = await generatePDF('Purchase Order', poNumber, {
      'Quotation ID': quotation_id,
      'Approval ID': approval_id,
      'Total Amount': `${qMeta.currency} ${qMeta.total_amount}`,
      'Delivery Address': delivery_address,
      'Expected Delivery': expected_delivery_date
    });

    await client.query(`UPDATE purchase_orders SET pdf_url = $1 WHERE id = $2`, [pdfUrl, poId]);
    await client.query('COMMIT');
    
    sendSuccess(res, 201, 'Purchase Order generated physically', {
      po_id: poId,
      po_number: poNumber,
      pdf_url: pdfUrl
    });

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

/**
 * 8.2 List All POs (Internal)
 */
exports.listPos = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const { status, vendor_id, date_from, date_to, page = 1, limit = 10 } = req.query;

  const offset = (page - 1) * limit;
  const values = [orgId];
  let whereClauses = ['po.org_id = $1'];
  let count = 2;

  if (status) { whereClauses.push(`po.status = $${count}`); values.push(status); count++; }
  if (vendor_id) { whereClauses.push(`po.vendor_id = $${count}`); values.push(vendor_id); count++; }
  if (date_from) { whereClauses.push(`po.created_at >= $${count}`); values.push(date_from); count++; }
  if (date_to) { whereClauses.push(`po.created_at <= $${count}`); values.push(date_to); count++; }

  const whereString = whereClauses.join(' AND ');

  const countQuery = `SELECT COUNT(*) FROM purchase_orders po WHERE ${whereString}`;
  const totalRes = await pool.query(countQuery, values);
  const total = parseInt(totalRes.rows[0].count, 10);

  const dataQuery = `
    SELECT po.id AS po_id, po.po_number, po.grand_total, po.status, po.expected_delivery_date, po.created_at, v.company_name AS vendor_name
    FROM purchase_orders po
    JOIN vendors v ON po.vendor_id = v.id
    WHERE ${whereString}
    ORDER BY po.created_at DESC
    LIMIT $${count} OFFSET $${count + 1}
  `;
  const result = await pool.query(dataQuery, [...values, limit, offset]);

  sendSuccess(res, 200, 'POs fetched', { pos: result.rows, total, page: Number(page), limit: Number(limit) });
});


/**
 * 8.3 Get Single PO
 */
exports.getPo = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const role = req.user.role;
  const { poId } = req.params;

  let vendorScopeQuery = '';
  const values = [poId, orgId];

  // If vendor, they can ONLY see their own PO
  if (role === 'vendor') {
    const vId = await getVendorId(req.user.id, orgId);
    if (!vId) return next(new AppError('Unlinked vendor', 400, 'BAD_REQUEST'));
    vendorScopeQuery = ` AND po.vendor_id = $3`;
    values.push(vId);
  }

  const query = `
    SELECT 
      po.id AS po_id, po.po_number, r.rfq_number,
      v.id AS vendor_id, v.company_name, v.gst_number,
      po.subtotal, po.tax_total, po.grand_total, po.status,
      po.delivery_address, po.expected_delivery_date, po.payment_terms,
      po.created_at
    FROM purchase_orders po
    JOIN rfqs r ON po.rfq_id = r.id
    JOIN vendors v ON po.vendor_id = v.id
    WHERE po.id = $1 AND po.org_id = $2 ${vendorScopeQuery}
  `;
  
  const result = await pool.query(query, values);
  if (result.rows.length === 0) return next(new AppError('Purchase Order not found', 404, 'NOT_FOUND'));

  const po = result.rows[0];

  const items = await pool.query('SELECT * FROM po_items WHERE po_id = $1', [poId]);
  
  const formattedResponse = {
    po_id: po.po_id,
    po_number: po.po_number,
    rfq_number: po.rfq_number,
    vendor: {
      id: po.vendor_id,
      company_name: po.company_name,
      gst_number: po.gst_number
    },
    items: items.rows,
    subtotal: po.subtotal,
    tax_total: po.tax_total,
    grand_total: po.grand_total,
    status: po.status,
    delivery_address: po.delivery_address,
    expected_delivery_date: po.expected_delivery_date,
    payment_terms: po.payment_terms,
    pdf_url: `https://cdn/generated/${po.po_number}.pdf`,
    created_at: po.created_at
  };

  sendSuccess(res, 200, 'PO fetched successfully', formattedResponse);
});

/**
 * 8.4 Download PO PDF
 */
exports.downloadPoPdf = catchAsync(async (req, res, next) => {
  // Mocking binary PDF return
  res.setHeader('Content-Type', 'application/pdf');
  res.send(Buffer.from('%PDF-1.4 Mock Binary PDF File Content...'));
});

/**
 * 8.5 Send PO via Email
 */
exports.sendPoEmail = catchAsync(async (req, res, next) => {
  const { recipient_email, message } = req.body;
  
  console.log(`[MOCK EMAIL TO ${recipient_email}] Subject: Purchase Order. Message: ${message}`);
  sendSuccess(res, 200, 'Email sent successfully via mock bridge');
});

/**
 * 8.6 Update PO Status
 */
exports.updatePoStatus = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const role = req.user.role;
  const { poId } = req.params;
  const { status, remarks } = req.body;

  let vCheck = '';
  const values = [status, poId, orgId];

  // Status access control check
  if (role === 'vendor') {
    if (!['acknowledged', 'in_transit', 'delivered'].includes(status)) {
      return next(new AppError('Vendors can only set status to acknowledged, in_transit, or delivered.', 403, 'FORBIDDEN'));
    }
    const vId = await getVendorId(req.user.id, orgId);
    vCheck = ` AND vendor_id = $4`;
    values.push(vId);
  } else if (role === 'procurement_officer') {
    if (status !== 'cancelled') {
        return next(new AppError('Procurement officers can only update status to cancelled here.', 403, 'FORBIDDEN'));
    }
  }

  const result = await pool.query(`UPDATE purchase_orders SET status = $1 WHERE id = $2 AND org_id = $3 ${vCheck} RETURNING id`, values);

  if (result.rows.length === 0) return next(new AppError('PO not found or unauthorized to act on this PO', 404, 'NOT_FOUND'));

  // E.g., Log remarks logic 
  console.log(`Status changed to ${status}. Remarks: ${remarks}`);

  sendSuccess(res, 200, 'PO Status updated successfully');
});

/**
 * 8.7 Vendor: List My POs
 */
exports.listVendorPos = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const { status, page = 1, limit = 10 } = req.query;

  const vendorId = await getVendorId(req.user.id, orgId);
  if (!vendorId) return next(new AppError('Unlinked vendor', 400, 'BAD_REQUEST'));

  const offset = (page - 1) * limit;
  const values = [vendorId, orgId];
  let whereClauses = ['vendor_id = $1', 'org_id = $2'];
  let count = 3;

  if (status) {
    whereClauses.push(`status = $${count}`);
    values.push(status);
    count++;
  }

  const dbString = whereClauses.join(' AND ');

  const countRes = await pool.query(`SELECT COUNT(*) FROM purchase_orders WHERE ${dbString}`, values);
  const total = parseInt(countRes.rows[0].count, 10);

  const query = `
    SELECT id AS po_id, po_number, grand_total, status, expected_delivery_date, created_at
    FROM purchase_orders
    WHERE ${dbString}
    ORDER BY created_at DESC
    LIMIT $${count} OFFSET $${count + 1}
  `;
  const dataRes = await pool.query(query, [...values, limit, offset]);

  sendSuccess(res, 200, 'Vendor POs fetched', {
    pos: dataRes.rows, total, page: Number(page), limit: Number(limit)
  });
});
