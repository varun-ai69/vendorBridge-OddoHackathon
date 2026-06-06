const { pool } = require('../db/db');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const catchAsync = require('../utils/catchAsync');
const bcrypt = require('bcrypt');

exports.inviteUser = catchAsync(async (req, res, next) => {
  const { name, email, role, phone, department, generated_password } = req.body;
  const orgId = req.user.org_id;

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    return next(new AppError('Email is already in use.', 409, 'CONFLICT'));
  }

  const hashedPassword = await bcrypt.hash(generated_password, 12);

  const insertRes = await pool.query(
    `INSERT INTO users (org_id, name, email, role, phone, department, password_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [orgId, name, email, role, phone, department, hashedPassword]
  );

  // Mocking email logic
  console.log(`[MOCK EMAIL] To: ${email} | Subject: You've been invited! | Password: ${generated_password}`);

  sendSuccess(res, 201, 'User invited. Credentials sent to email.', { user_id: insertRes.rows[0].id });
});

exports.listUsers = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const { role, is_active, search, page = 1, limit = 10 } = req.query;

  const offset = (page - 1) * limit;
  const values = [orgId];
  let whereClauses = ['org_id = $1'];
  let count = 2;

  if (role) {
    whereClauses.push(`role = $${count}`);
    values.push(role);
    count++;
  }

  if (is_active !== undefined) {
    whereClauses.push(`is_active = $${count}`);
    // String "false" parsing to boolean
    const activeBool = is_active === 'true' || is_active === true;
    values.push(activeBool);
    count++;
  }

  if (search) {
    whereClauses.push(`(name ILIKE $${count} OR email ILIKE $${count})`);
    values.push(`%${search}%`);
    count++;
  }

  const whereString = whereClauses.join(' AND ');

  const countQuery = `SELECT COUNT(*) FROM users WHERE ${whereString}`;
  const totalRes = await pool.query(countQuery, values);
  const total = parseInt(totalRes.rows[0].count, 10);

  const dataQuery = `
    SELECT id, name, email, role, phone, department, is_active, created_at 
    FROM users 
    WHERE ${whereString} 
    ORDER BY created_at DESC 
    LIMIT $${count} OFFSET $${count + 1}
  `;
  const dataRes = await pool.query(dataQuery, [...values, limit, offset]);

  sendSuccess(res, 200, 'Users fetched', {
    users: dataRes.rows,
    total,
    page: Number(page),
    limit: Number(limit)
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const orgId = req.user.org_id;

  const result = await pool.query(
    'SELECT id, name, email, role, phone, department, is_active, created_at, avatar_url FROM users WHERE id = $1 AND org_id = $2',
    [userId, orgId]
  );

  if (result.rows.length === 0) {
    return next(new AppError('User not found in your organization.', 404, 'NOT_FOUND'));
  }

  sendSuccess(res, 200, 'User fetched successfully', { user: result.rows[0] });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const orgId = req.user.org_id;
  const { name, phone, department, role, is_active } = req.body;

  let query = 'UPDATE users SET ';
  const values = [];
  let count = 1;

  if (name !== undefined) { query += `name = $${count}, `; values.push(name); count++; }
  if (phone !== undefined) { query += `phone = $${count}, `; values.push(phone); count++; }
  if (department !== undefined) { query += `department = $${count}, `; values.push(department); count++; }
  if (role !== undefined) { query += `role = $${count}, `; values.push(role); count++; }
  if (is_active !== undefined) { query += `is_active = $${count}, `; values.push(is_active); count++; }

  if (values.length === 0) {
    return sendSuccess(res, 200, 'Nothing to update');
  }

  query = query.slice(0, -2);
  query += ` WHERE id = $${count} AND org_id = $${count + 1} RETURNING id, name, role, is_active`;
  values.push(userId, orgId);

  const result = await pool.query(query, values);
  if (result.rows.length === 0) {
    return next(new AppError('User not found.', 404, 'NOT_FOUND'));
  }

  sendSuccess(res, 200, 'User updated successfully', { user: result.rows[0] });
});

exports.updateStatus = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const orgId = req.user.org_id;
  const { is_active } = req.body;

  const result = await pool.query(
    'UPDATE users SET is_active = $1 WHERE id = $2 AND org_id = $3 RETURNING id',
    [is_active, userId, orgId]
  );

  if (result.rows.length === 0) {
    return next(new AppError('User not found.', 404, 'NOT_FOUND'));
  }

  sendSuccess(res, 200, is_active ? 'User activated' : 'User deactivated');
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const orgId = req.user.org_id;
  const { new_password } = req.body;

  const hashedPassword = await bcrypt.hash(new_password, 12);
  const result = await pool.query(
    'UPDATE users SET password_hash = $1 WHERE id = $2 AND org_id = $3 RETURNING id',
    [hashedPassword, userId, orgId]
  );

  if (result.rows.length === 0) {
    return next(new AppError('User not found.', 404, 'NOT_FOUND'));
  }

  sendSuccess(res, 200, 'Password reset successfully');
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const orgId = req.user.org_id;

  const result = await pool.query(
    'DELETE FROM users WHERE id = $1 AND org_id = $2 RETURNING id',
    [userId, orgId]
  );

  if (result.rows.length === 0) {
    return next(new AppError('User not found.', 404, 'NOT_FOUND'));
  }

  sendSuccess(res, 200, 'User deleted successfully');
});
