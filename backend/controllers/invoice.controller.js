const { pool } = require('../db/db');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const catchAsync = require('../utils/catchAsync');

// Utility to natively pull Vendor ID
const getVendorId = async (userId, orgId) => {
  const res = await pool.query('SELECT vendor_id FROM users WHERE id = $1 AND org_id = $2', [userId, orgId]);
  return res.rows[0]?.vendor_id;
};

/**
 * 9.1 Vendor: Generate Invoice for a PO
 */
exports.generateInvoice = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const userId = req.user.id;
  const { poId } = req.params;

  const vendorId = await getVendorId(userId, orgId);
  if (!vendorId) return next(new AppError('Unlinked vendor account', 400, 'BAD_REQUEST'));

  // 1. Verify PO exists and belongs to this vendor
  const checkPo = await pool.query('SELECT status, currency FROM purchase_orders WHERE id = $1 AND vendor_id = $2 AND org_id = $3', [poId, vendorId, orgId]);
  if (checkPo.rows.length === 0) return next(new AppError('PO not found or unauthorized', 404, 'NOT_FOUND'));
  // E.g., we can prevent invoicing against 'cancelled' POs.
  if (checkPo.rows[0].status === 'cancelled') return next(new AppError('Cannot invoice against a cancelled PO', 400, 'BAD_REQUEST'));

  const poCurrency = checkPo.rows[0].currency;

  const { 
    invoice_date, invoice_number_vendor, items, subtotal, tax_total, grand_total,
    bank_name, bank_account, bank_ifsc, due_date, notes
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Generate Official Internal Invoice Number
    const year = new Date().getFullYear();
    const docNumRes = await client.query('SELECT next_document_number($1, $2, $3::smallint)', [orgId, 'invoice', year]);
    const genInvoiceNumber = docNumRes.rows[0].next_document_number;

    // Insert Master Invoice
    const invRes = await client.query(`
      INSERT INTO invoices (
        org_id, invoice_number, invoice_number_vendor, po_id, vendor_id, currency,
        subtotal, tax_total, grand_total, bank_name, bank_account, bank_ifsc,
        due_date, invoice_date, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending') RETURNING id
    `, [
      orgId, genInvoiceNumber, invoice_number_vendor, poId, vendorId, poCurrency,
      subtotal, tax_total || 0, grand_total, bank_name, bank_account, bank_ifsc,
      due_date, invoice_date, notes
    ]);

    const invoiceId = invRes.rows[0].id;

    // Insert Invoice Items
    for (const item of items) {
      await client.query(`
        INSERT INTO invoice_items (invoice_id, po_item_id, product_name, quantity, unit, unit_price, subtotal, tax_percent, tax_amount, total)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [invoiceId, item.po_item_id || null, item.product_name, item.quantity, item.unit, item.unit_price, item.subtotal, item.tax_percent || 0, item.tax_amount || 0, item.total]);
    }

    const { generatePDF } = require('../utils/pdfGenerator');
    const pdfUrl = await generatePDF('Invoice', genInvoiceNumber, {
      'Vendor Invoice Ref': invoice_number_vendor,
      'PO ID': poId,
      'Date': invoice_date,
      'Total Amount': `${poCurrency} ${grand_total}`,
      'Bank Data': `${bank_name} - ${bank_account}`
    });

    await client.query(`UPDATE invoices SET pdf_url = $1 WHERE id = $2`, [pdfUrl, invoiceId]);
    await client.query('COMMIT');
    
    sendSuccess(res, 201, 'Invoice generated natively and written to storage', {
      invoice_id: invoiceId,
      invoice_number: genInvoiceNumber,
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
 * 9.2 List All Invoices
 */
exports.listInvoices = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const { status, vendor_id, date_from, date_to, page = 1, limit = 10 } = req.query;

  const offset = (page - 1) * limit;
  const values = [orgId];
  let whereClauses = ['i.org_id = $1'];
  let count = 2;

  if (status) { whereClauses.push(`i.status = $${count}`); values.push(status); count++; }
  if (vendor_id) { whereClauses.push(`i.vendor_id = $${count}`); values.push(vendor_id); count++; }
  if (date_from) { whereClauses.push(`i.invoice_date >= $${count}`); values.push(date_from); count++; }
  if (date_to) { whereClauses.push(`i.invoice_date <= $${count}`); values.push(date_to); count++; }

  const whereString = whereClauses.join(' AND ');

  const countQuery = `SELECT COUNT(*) FROM invoices i WHERE ${whereString}`;
  const totalRes = await pool.query(countQuery, values);
  const total = parseInt(totalRes.rows[0].count, 10);

  const dataQuery = `
    SELECT 
      i.id AS invoice_id, i.invoice_number, i.invoice_number_vendor, i.grand_total, i.currency, 
      i.status, i.due_date, i.invoice_date, v.company_name AS vendor_name
    FROM invoices i
    JOIN vendors v ON i.vendor_id = v.id
    WHERE ${whereString}
    ORDER BY i.created_at DESC
    LIMIT $${count} OFFSET $${count + 1}
  `;
  const result = await pool.query(dataQuery, [...values, limit, offset]);

  sendSuccess(res, 200, 'Invoices fetched', { invoices: result.rows, total, page: Number(page), limit: Number(limit) });
});

/**
 * 9.3 Get Single Invoice (Also supports 9.8 Vendor specific via role guard context)
 */
exports.getInvoice = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const role = req.user.role;
  const { invoiceId } = req.params;

  let vendorScopeQuery = '';
  const values = [invoiceId, orgId];

  // If vendor, they can ONLY see their own invoice
  if (role === 'vendor') {
    const vId = await getVendorId(req.user.id, orgId);
    if (!vId) return next(new AppError('Unlinked vendor', 400, 'BAD_REQUEST'));
    vendorScopeQuery = ` AND i.vendor_id = $3`;
    values.push(vId);
  }

  const query = `
    SELECT 
      i.id AS invoice_id, i.invoice_number, i.invoice_number_vendor, po.po_number,
      v.id AS vendor_id, v.company_name, v.gst_number,
      i.subtotal, i.tax_total, i.grand_total, i.currency, i.status,
      i.bank_name, i.bank_account, i.bank_ifsc,
      i.invoice_date, i.due_date, i.payment_reference, i.payment_date, i.notes,
      i.created_at
    FROM invoices i
    JOIN purchase_orders po ON i.po_id = po.id
    JOIN vendors v ON i.vendor_id = v.id
    WHERE i.id = $1 AND i.org_id = $2 ${vendorScopeQuery}
  `;
  
  const result = await pool.query(query, values);
  if (result.rows.length === 0) return next(new AppError('Invoice not found', 404, 'NOT_FOUND'));

  const inv = result.rows[0];

  const items = await pool.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [invoiceId]);
  inv.items = items.rows;
  inv.pdf_url = `https://cdn/generated/${inv.invoice_number}.pdf`;

  sendSuccess(res, 200, 'Invoice fetched successfully', inv);
});

/**
 * 9.4 Download Invoice PDF
 */
exports.downloadInvoicePdf = catchAsync(async (req, res, next) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.send(Buffer.from('%PDF-1.4 Mock Binary PDF File Content...'));
});

/**
 * 9.5 Send Invoice via Email
 */
exports.sendInvoiceEmail = catchAsync(async (req, res, next) => {
  const { recipient_email, message } = req.body;
  console.log(`[MOCK EMAIL TO ${recipient_email}] Subject: Invoice Attached. Message: ${message}`);
  sendSuccess(res, 200, 'Email sent successfully via mock bridge');
});

/**
 * 9.6 Update Invoice Payment Status
 */
exports.updateInvoiceStatus = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const { invoiceId } = req.params;
  const { status, payment_date, payment_reference, remarks } = req.body;

  const result = await pool.query(`
    UPDATE invoices 
    SET status = $1, payment_date = $2, payment_reference = $3, notes = COALESCE(notes, '') || '\nAdmin: ' || COALESCE($4, '') 
    WHERE id = $5 AND org_id = $6 RETURNING id
  `, [status, payment_date || null, payment_reference || null, remarks || '', invoiceId, orgId]);

  if (result.rows.length === 0) return next(new AppError('Invoice not found', 404, 'NOT_FOUND'));

  sendSuccess(res, 200, 'Invoice Payment Status updated successfully');
});

/**
 * 9.7 Vendor: List My Invoices
 */
exports.listVendorInvoices = catchAsync(async (req, res, next) => {
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

  const countRes = await pool.query(`SELECT COUNT(*) FROM invoices WHERE ${dbString}`, values);
  const total = parseInt(countRes.rows[0].count, 10);

  const query = `
    SELECT id AS invoice_id, invoice_number, invoice_number_vendor, grand_total, status, due_date, invoice_date, created_at
    FROM invoices
    WHERE ${dbString}
    ORDER BY created_at DESC
    LIMIT $${count} OFFSET $${count + 1}
  `;
  const dataRes = await pool.query(query, [...values, limit, offset]);

  sendSuccess(res, 200, 'Vendor Invoices fetched', {
    invoices: dataRes.rows, total, page: Number(page), limit: Number(limit)
  });
});
