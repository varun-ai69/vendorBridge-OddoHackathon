const { pool } = require('../db/db');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const catchAsync = require('../utils/catchAsync');

// Helper to reliably get vendor ID linked to internal user ID
const getVendorId = async (userId, orgId) => {
  const res = await pool.query('SELECT vendor_id FROM users WHERE id = $1 AND org_id = $2', [userId, orgId]);
  return res.rows[0]?.vendor_id;
};

/**
 * 6.1 Vendor: Submit Quotation
 */
exports.submitQuotation = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const userId = req.user.id;
  const { rfqId } = req.params;
  const vendorId = await getVendorId(userId, orgId);

  if (!vendorId) return next(new AppError('Unlinked vendor account', 400, 'BAD_REQUEST'));

  // 1. Validate RFQ and vendor permission
  const checkRfq = await pool.query(
    'SELECT status FROM rfq_vendors WHERE rfq_id = $1 AND vendor_id = $2',
    [rfqId, vendorId]
  );

  if (checkRfq.rows.length === 0) {
    return next(new AppError('You are not invited to quote this RFQ', 403, 'FORBIDDEN'));
  }

  // 2. Prevent duplicate quotes
  const existingQuote = await pool.query('SELECT id FROM quotations WHERE rfq_id = $1 AND vendor_id = $2 AND org_id = $3', [rfqId, vendorId, orgId]);
  if (existingQuote.rows.length > 0) return next(new AppError('You have already submitted a quotation for this RFQ', 409, 'CONFLICT'));

  const { items, total_amount, currency, delivery_timeline_days, delivery_terms, payment_terms, validity_days, notes, attachment_urls = [] } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Generate Quotation Number
    const year = new Date().getFullYear();
    const docNumRes = await client.query('SELECT next_document_number($1, $2, $3::smallint)', [orgId, 'quotation', year]);
    const quotationNumber = docNumRes.rows[0].next_document_number;

    // Calculate subtotals strictly based on input payload simplifying assumptions.
    let calcSubtotal = 0;
    let calcTax = 0;

    for (const i of items) {
       calcSubtotal += parseFloat(i.subtotal || 0);
       calcTax += parseFloat(i.tax_amount || 0);
    }

    // Master Insert
    const quoteRes = await client.query(
      `INSERT INTO quotations (
         org_id, quotation_number, rfq_id, vendor_id, currency, subtotal, tax_total, total_amount,
         delivery_timeline_days, delivery_terms, payment_terms, validity_days, notes, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'submitted') RETURNING id`,
      [orgId, quotationNumber, rfqId, vendorId, currency, calcSubtotal, calcTax, total_amount, delivery_timeline_days, delivery_terms, payment_terms, validity_days, notes]
    );

    const quoteId = quoteRes.rows[0].id;

    // Items Insert
    for (const item of items) {
      await client.query(
        `INSERT INTO quotation_items (
           quotation_id, rfq_item_id, product_name, quantity, unit, unit_price, subtotal, tax_percent, tax_amount, total
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [quoteId, item.rfq_item_id || null, item.product_name, item.quantity, item.unit, item.unit_price, item.subtotal, item.tax_percent || 0, item.tax_amount || 0, (item.subtotal + (item.tax_amount || 0))]
      );
    }

    // Attachments Insert
    for (const url of attachment_urls) {
      await client.query(`INSERT INTO quotation_attachments (quotation_id, file_url) VALUES ($1, $2)`, [quoteId, url]);
    }

    // Update Vendor's RFQ Status to 'quoted'
    await client.query(`UPDATE rfq_vendors SET status = 'quoted' WHERE rfq_id = $1 AND vendor_id = $2`, [rfqId, vendorId]);

    const { generatePDF } = require('../utils/pdfGenerator');
    const pdfUrl = await generatePDF('Quotation', quotationNumber, {
      'RFQ ID': rfqId,
      'Vendor ID': vendorId,
      'Total Amount': `${currency} ${total_amount}`,
      'Delivery Timeline': `${delivery_timeline_days} Days`,
      'Delivery Terms': delivery_terms,
      'Payment Terms': payment_terms
    });

    await client.query(`UPDATE quotations SET pdf_url = $1 WHERE id = $2`, [pdfUrl, quoteId]);
    await client.query('COMMIT');

    sendSuccess(res, 201, 'Quotation submitted and PDF generated natively', {
      quotation_id: quoteId,
      quotation_number: quotationNumber,
      pdf_url: pdfUrl
    });

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

/**
 * 6.2 Vendor: Update/Edit Quotation (before PO)
 */
exports.updateQuotation = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const userId = req.user.id;
  const { rfqId, quotationId } = req.params;
  const vendorId = await getVendorId(userId, orgId);

  // Check valid quota and state
  const curQuote = await pool.query('SELECT status FROM quotations WHERE id = $1 AND vendor_id = $2 AND org_id = $3', [quotationId, vendorId, orgId]);
  if (curQuote.rows.length === 0) return next(new AppError('Quotation not found', 404, 'NOT_FOUND'));

  if (['shortlisted', 'accepted'].includes(curQuote.rows[0].status)) {
    return next(new AppError('Quotation can no longer be edited', 400, 'BAD_REQUEST'));
  }

  const { total_amount, delivery_timeline_days, notes } = req.body;
  let query = 'UPDATE quotations SET ';
  const values = [];
  let count = 1;

  if (total_amount !== undefined) { query += `total_amount = $${count}, `; values.push(total_amount); count++; }
  if (delivery_timeline_days !== undefined) { query += `delivery_timeline_days = $${count}, `; values.push(delivery_timeline_days); count++; }
  if (notes !== undefined) { query += `notes = $${count}, `; values.push(notes); count++; }

  if (values.length === 0) return sendSuccess(res, 200, 'Nothing to update in master file');

  query = query.slice(0, -2);
  query += ` WHERE id = $${count} RETURNING id`;
  values.push(quotationId);

  await pool.query(query, values);
  sendSuccess(res, 200, 'Quotation updated successfully');
});

/**
 * 6.3 Vendor: Get My Quotations
 */
exports.listVendorQuotations = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const userId = req.user.id;
  const { status, page = 1, limit = 10 } = req.query;
  const vendorId = await getVendorId(userId, orgId);

  const offset = (page - 1) * limit;
  const values = [vendorId, orgId];
  let whereClauses = ['vendor_id = $1', 'org_id = $2'];
  let count = 3;

  if (status) {
    whereClauses.push(`status = $${count}`);
    values.push(status);
    count++;
  }

  const whereString = whereClauses.join(' AND ');

  const countQuery = `SELECT COUNT(*) FROM quotations WHERE ${whereString}`;
  const countDbRes = await pool.query(countQuery, values);
  const total = parseInt(countDbRes.rows[0].count, 10);

  const dataQuery = `
    SELECT id, quotation_number, rfq_id, status, total_amount, currency, submitted_at, pdf_url
    FROM quotations WHERE ${whereString}
    ORDER BY submitted_at DESC
    LIMIT $${count} OFFSET $${count + 1}
  `;
  const result = await pool.query(dataQuery, [...values, limit, offset]);

  sendSuccess(res, 200, 'Quotations fetched', { quotations: result.rows, total, page: Number(page), limit: Number(limit) });
});

/**
 * 6.4 Vendor: Get Single Quotation
 */
exports.getVendorQuotation = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const userId = req.user.id;
  const { quotationId } = req.params;
  const vendorId = await getVendorId(userId, orgId);

  const qRes = await pool.query('SELECT * FROM quotations WHERE id = $1 AND vendor_id = $2 AND org_id = $3', [quotationId, vendorId, orgId]);
  if (qRes.rows.length === 0) return next(new AppError('Quotation not found', 404, 'NOT_FOUND'));
  const quotation = qRes.rows[0];

  const itemsRes = await pool.query('SELECT * FROM quotation_items WHERE quotation_id = $1', [quotationId]);
  quotation.items = itemsRes.rows;

  sendSuccess(res, 200, 'Quotation fetched successfully', { quotation });
});


// ============================================
// INTERNAL VIEWS (Procurement Officer & Manager)
// ============================================

/**
 * 6.5 Procurement Officer: List Quotations for an RFQ
 */
exports.listRfqsQuotations = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const { rfqId } = req.params;

  // Validate RFQ
  const rfqCheck = await pool.query('SELECT rfq_number FROM rfqs WHERE id = $1 AND org_id = $2', [rfqId, orgId]);
  if (rfqCheck.rows.length === 0) return next(new AppError('RFQ not found', 404, 'NOT_FOUND'));

  const rfqNumber = rfqCheck.rows[0].rfq_number;

  const result = await pool.query(`
    SELECT 
      q.id AS quotation_id, q.quotation_number, q.vendor_id, v.company_name AS vendor_name, 
      v.cached_rating AS vendor_rating, q.total_amount, q.delivery_timeline_days, 
      q.submitted_at, q.status, q.pdf_url
    FROM quotations q
    JOIN vendors v ON q.vendor_id = v.id
    WHERE q.rfq_id = $1 AND q.org_id = $2
    ORDER BY q.total_amount ASC
  `, [rfqId, orgId]);

  sendSuccess(res, 200, 'Quotations for RFQ fetched', {
    rfq_id: rfqId,
    rfq_number: rfqNumber,
    quotations: result.rows
  });
});

/**
 * 6.6 Procurement Officer: Compare Quotations (Side-by-Side)
 */
exports.compareQuotations = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const { rfqId } = req.params;

  const rfqCheck = await pool.query('SELECT rfq_number FROM rfqs WHERE id = $1 AND org_id = $2', [rfqId, orgId]);
  if (rfqCheck.rows.length === 0) return next(new AppError('RFQ not found', 404, 'NOT_FOUND'));
  const rfqNumber = rfqCheck.rows[0].rfq_number;

  // 1. Get all items requested in the RFQ
  const rfqItemsRes = await pool.query('SELECT id, product_name, quantity, unit FROM rfq_items WHERE rfq_id = $1', [rfqId]);
  const itemsComparison = [];

  // Gather summary heuristics
  let lowestTotal = Infinity;
  let lowestTotalVendorId = null;
  let fastestDelDays = Infinity;
  let fastestDelVendorId = null;

  // Evaluate full quotations for total level stats
  const allQuotesRes = await pool.query('SELECT id, vendor_id, total_amount, delivery_timeline_days FROM quotations WHERE rfq_id = $1', [rfqId]);
  for (const q of allQuotesRes.rows) {
    if (parseFloat(q.total_amount) < lowestTotal) {
      lowestTotal = parseFloat(q.total_amount);
      lowestTotalVendorId = q.vendor_id;
    }
    if (q.delivery_timeline_days && parseInt(q.delivery_timeline_days, 10) < fastestDelDays) {
      fastestDelDays = parseInt(q.delivery_timeline_days, 10);
      fastestDelVendorId = q.vendor_id;
    }
  }

  // Evaluate item by item
  for (const rfqItem of rfqItemsRes.rows) {
    // get all quotes for this exact item
    const itemQuotesRes = await pool.query(`
      SELECT 
        qi.unit_price, qi.subtotal, qi.tax_amount AS tax, qi.total,
        v.id AS vendor_id, v.company_name AS vendor_name, q.delivery_timeline_days AS delivery_days
      FROM quotation_items qi
      JOIN quotations q ON qi.quotation_id = q.id
      JOIN vendors v ON q.vendor_id = v.id
      WHERE qi.rfq_item_id = $1
      ORDER BY qi.unit_price ASC
    `, [rfqItem.id]);

    const vendors = itemQuotesRes.rows.map((v, index) => ({
      ...v,
      is_lowest_price: index === 0 // since ordered by ASC, 0 is strictly lowest
    }));

    itemsComparison.push({
      product_name: rfqItem.product_name,
      quantity: rfqItem.quantity,
      unit: rfqItem.unit,
      vendors
    });
  }

  sendSuccess(res, 200, 'Comparison matrix built successfully', {
    rfq_id: rfqId,
    rfq_number: rfqNumber,
    items_comparison: itemsComparison,
    summary: {
      lowest_price_vendor_id: lowestTotalVendorId,
      fastest_delivery_vendor_id: fastestDelVendorId
    }
  });
});

/**
 * 6.7 Procurement Officer: Select / Shortlist Vendor Quotation
 */
exports.selectQuotation = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const userId = req.user.id;
  const { rfqId, quotationId } = req.params;
  const { selection_reason } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Make sure quote exists and belongs to RFQ
    const qCheck = await pool.query('SELECT status FROM quotations WHERE id = $1 AND rfq_id = $2 AND org_id = $3', [quotationId, rfqId, orgId]);
    if (qCheck.rows.length === 0) throw new AppError('Quotation not found.', 404, 'NOT_FOUND');

    // 1. Update quote status
    await client.query(
      `UPDATE quotations SET status = 'shortlisted', selection_reason = $1 WHERE id = $2`,
      [selection_reason, quotationId]
    );

    // 2. Generate Approval Request automatically assigned to Managers 
    // Contract definition: "status: pending" defaults, Priority defaults 'medium'.
    const appRes = await client.query(
      `INSERT INTO approval_requests (org_id, rfq_id, quotation_id, requested_by, remarks) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [orgId, rfqId, quotationId, userId, "System drafted approval request regarding shortlisted quotation."]
    );

    await client.query('COMMIT');

    sendSuccess(res, 200, 'Quotation shortlisted. Approval request sent to manager.', {
      approval_request_id: appRes.rows[0].id
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});
