const { pool } = require('../db/db');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const catchAsync = require('../utils/catchAsync');
const bcrypt = require('bcrypt');

/**
 * 4.1 Create / Invite Vendor (Admin)
 */
exports.createVendor = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const {
    company_name, contact_person, email, phone, address,
    gst_number, pan_number, category = [], bank_name,
    bank_account, bank_ifsc, generated_password, notes
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Email check across users
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      throw new AppError('Email is already in use.', 409, 'CONFLICT');
    }

    // 1. Insert Vendor
    const vendorRes = await client.query(
      `INSERT INTO vendors (
        org_id, company_name, contact_person, email, phone, address,
        gst_number, pan_number, category, bank_name, bank_account, bank_ifsc, notes, is_approved
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true) RETURNING id`,
      [orgId, company_name, contact_person, email, phone, address, gst_number, pan_number, 
       category, bank_name, bank_account, bank_ifsc, notes]
    );

    const vendorId = vendorRes.rows[0].id;

    // 2. Create Vendor User 
    const hashedPassword = await bcrypt.hash(generated_password, 12);
    await client.query(
      `INSERT INTO users (org_id, name, email, password_hash, role, phone, vendor_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [orgId, contact_person, email, hashedPassword, 'vendor', phone, vendorId]
    );

    await client.query('COMMIT');

    console.log(`[MOCK EMAIL] To: ${email} | Welcome to Vendor Portal | Password: ${generated_password}`);

    sendSuccess(res, 201, 'Vendor created. Login credentials sent to vendor email.', { vendor_id: vendorId });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

/**
 * 4.2 List All Vendors (Admin | Procurement Officer)
 */
exports.listVendors = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const { category, is_active, is_approved, search, page = 1, limit = 10 } = req.query;

  const offset = (page - 1) * limit;
  const values = [orgId];
  let whereClauses = ['org_id = $1'];
  let count = 2;

  if (category) {
    whereClauses.push(`$${count} = ANY(category)`);
    values.push(category);
    count++;
  }

  if (is_active !== undefined) {
    whereClauses.push(`is_active = $${count}`);
    values.push(is_active === 'true' || is_active === true);
    count++;
  }

  if (is_approved !== undefined) {
    whereClauses.push(`is_approved = $${count}`);
    values.push(is_approved === 'true' || is_approved === true);
    count++;
  }

  if (search) {
    whereClauses.push(`(company_name ILIKE $${count} OR email ILIKE $${count} OR gst_number ILIKE $${count})`);
    values.push(`%${search}%`);
    count++;
  }

  const whereString = whereClauses.join(' AND ');

  const countRes = await pool.query(`SELECT COUNT(*) FROM vendors WHERE ${whereString}`, values);
  const total = parseInt(countRes.rows[0].count, 10);

  const dataQuery = `
    SELECT 
      id, company_name, contact_person, email, phone, gst_number, category, 
      is_active, is_approved, cached_rating AS rating, created_at
    FROM vendors 
    WHERE ${whereString} 
    ORDER BY created_at DESC 
    LIMIT $${count} OFFSET $${count + 1}
  `;
  const dataRes = await pool.query(dataQuery, [...values, limit, offset]);

  sendSuccess(res, 200, 'Vendors fetched', {
    vendors: dataRes.rows,
    total,
    page: Number(page),
    limit: Number(limit)
  });
});

/**
 * 4.3 Get Single Vendor (Admin | Procurement Officer)
 */
exports.getVendor = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const { vendorId } = req.params;

  const result = await pool.query(`
    SELECT 
      id, company_name, contact_person, email, phone, address, gst_number, pan_number, 
      category, bank_name, bank_account, bank_ifsc, is_active, is_approved, approval_remarks, notes,
      cached_rating AS rating, cached_total_orders AS total_orders, cached_on_time_delivery_rate AS on_time_delivery_rate, 
      created_at
    FROM vendors 
    WHERE id = $1 AND org_id = $2
  `, [vendorId, orgId]);

  if (result.rows.length === 0) {
    return next(new AppError('Vendor not found.', 404, 'NOT_FOUND'));
  }

  sendSuccess(res, 200, 'Vendor details fetched', result.rows[0]);
});

/**
 * 4.4 Update Vendor (Admin)
 */
exports.updateVendor = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const { vendorId } = req.params;
  const {
    company_name, contact_person, phone, address,
    gst_number, pan_number, category, bank_name,
    bank_account, bank_ifsc, notes
  } = req.body;

  let query = 'UPDATE vendors SET ';
  const values = [];
  let count = 1;

  if (company_name !== undefined) { query += `company_name = $${count}, `; values.push(company_name); count++; }
  if (contact_person !== undefined) { query += `contact_person = $${count}, `; values.push(contact_person); count++; }
  if (phone !== undefined) { query += `phone = $${count}, `; values.push(phone); count++; }
  if (address !== undefined) { query += `address = $${count}, `; values.push(address); count++; }
  if (gst_number !== undefined) { query += `gst_number = $${count}, `; values.push(gst_number); count++; }
  if (pan_number !== undefined) { query += `pan_number = $${count}, `; values.push(pan_number); count++; }
  if (category !== undefined) { query += `category = $${count}, `; values.push(category); count++; }
  if (bank_name !== undefined) { query += `bank_name = $${count}, `; values.push(bank_name); count++; }
  if (bank_account !== undefined) { query += `bank_account = $${count}, `; values.push(bank_account); count++; }
  if (bank_ifsc !== undefined) { query += `bank_ifsc = $${count}, `; values.push(bank_ifsc); count++; }
  if (notes !== undefined) { query += `notes = $${count}, `; values.push(notes); count++; }

  if (values.length === 0) return sendSuccess(res, 200, 'Nothing to update');

  query = query.slice(0, -2);
  query += ` WHERE id = $${count} AND org_id = $${count + 1} RETURNING id`;
  values.push(vendorId, orgId);

  const dbRes = await pool.query(query, values);
  if (dbRes.rows.length === 0) return next(new AppError('Vendor not found', 404, 'NOT_FOUND'));

  sendSuccess(res, 200, 'Vendor updated successfully');
});

/**
 * 4.5 Approve / Reject / Status Vendor (Admin)
 */
exports.updateVendorStatus = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const { vendorId } = req.params;
  const { is_approved, is_active, remarks } = req.body;

  let query = 'UPDATE vendors SET ';
  const values = [];
  let count = 1;

  if (is_approved !== undefined) { query += `is_approved = $${count}, `; values.push(is_approved); count++; }
  if (is_active !== undefined) { query += `is_active = $${count}, `; values.push(is_active); count++; }
  if (remarks !== undefined) { query += `approval_remarks = $${count}, `; values.push(remarks); count++; }

  if (values.length === 0) return sendSuccess(res, 200, 'Nothing to update');

  query = query.slice(0, -2);
  query += ` WHERE id = $${count} AND org_id = $${count + 1} RETURNING id`;
  values.push(vendorId, orgId);

  const dbRes = await pool.query(query, values);
  if (dbRes.rows.length === 0) return next(new AppError('Vendor not found', 404, 'NOT_FOUND'));

  sendSuccess(res, 200, 'Vendor status updated successfully');
});

/**
 * 4.6 Delete Vendor (Admin)
 */
exports.deleteVendor = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const { vendorId } = req.params;

  // DB has ON DELETE CASCADE from vendors to users.
  const dbRes = await pool.query('DELETE FROM vendors WHERE id = $1 AND org_id = $2 RETURNING id', [vendorId, orgId]);
  if (dbRes.rows.length === 0) return next(new AppError('Vendor not found', 404, 'NOT_FOUND'));

  sendSuccess(res, 200, 'Vendor deleted successfully');
});

/**
 * 4.7 Vendor Profile (Vendor)
 */
exports.getVendorProfile = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const userId = req.user.id;

  // Fetch the user to get vendor_id
  const userRes = await pool.query('SELECT vendor_id FROM users WHERE id = $1 AND org_id = $2', [userId, orgId]);
  const vendorId = userRes.rows[0]?.vendor_id;

  if (!vendorId) return next(new AppError('Unlinked vendor account.', 400, 'BAD_REQUEST'));

  const result = await pool.query(`
    SELECT * FROM vendors WHERE id = $1 AND org_id = $2
  `, [vendorId, orgId]);

  sendSuccess(res, 200, 'Profile fetched', result.rows[0]);
});

/**
 * 4.8 Update Vendor Profile (Vendor)
 */
exports.updateVendorProfile = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const userId = req.user.id;
  const { contact_person, phone, address, bank_name, bank_account, bank_ifsc } = req.body;

  const userRes = await pool.query('SELECT vendor_id FROM users WHERE id = $1 AND org_id = $2', [userId, orgId]);
  const vendorId = userRes.rows[0]?.vendor_id;

  if (!vendorId) return next(new AppError('Unlinked vendor account.', 400, 'BAD_REQUEST'));

  let query = 'UPDATE vendors SET ';
  const values = [];
  let count = 1;

  if (contact_person !== undefined) { query += `contact_person = $${count}, `; values.push(contact_person); count++; }
  if (phone !== undefined) { query += `phone = $${count}, `; values.push(phone); count++; }
  if (address !== undefined) { query += `address = $${count}, `; values.push(address); count++; }
  if (bank_name !== undefined) { query += `bank_name = $${count}, `; values.push(bank_name); count++; }
  if (bank_account !== undefined) { query += `bank_account = $${count}, `; values.push(bank_account); count++; }
  if (bank_ifsc !== undefined) { query += `bank_ifsc = $${count}, `; values.push(bank_ifsc); count++; }

  if (values.length === 0) return sendSuccess(res, 200, 'Nothing to update');

  query = query.slice(0, -2);
  query += ` WHERE id = $${count} AND org_id = $${count + 1} RETURNING id`;
  values.push(vendorId, orgId);

  await pool.query(query, values);
  sendSuccess(res, 200, 'Profile updated successfully');
});
