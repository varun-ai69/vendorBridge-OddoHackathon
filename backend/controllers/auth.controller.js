const { pool } = require('../db/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const catchAsync = require('../utils/catchAsync');

// Helper to generate access & refresh tokens
const generateTokens = async (userId, orgId, role, name, email) => {
  const payload = { id: userId, name, email, role, org_id: orgId };
  
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
  const refreshToken = crypto.randomBytes(40).toString('hex');
  const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, hashedRefreshToken, expiresAt]
  );

  return { token, refreshToken };
};

exports.registerOrg = catchAsync(async (req, res, next) => {
  const { org_name, org_address, org_gst, org_industry, org_website, admin_name, admin_email, admin_password } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if email already exists globally to avoid confusion (or just rely on constraints)
    const userCheck = await client.query('SELECT id FROM users WHERE email = $1', [admin_email]);
    if (userCheck.rows.length > 0) {
      throw new AppError('Admin email already in use.', 409, 'CONFLICT');
    }

    // 1. Create Organization
    const orgResult = await client.query(
      `INSERT INTO organizations (name, address, gst, industry, website) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [org_name, org_address, org_gst, org_industry, org_website]
    );
    const orgId = orgResult.rows[0].id;

    // 2. Create Admin User
    const hashedPassword = await bcrypt.hash(admin_password, 12);
    const userResult = await client.query(
      `INSERT INTO users (org_id, name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [orgId, admin_name, admin_email, hashedPassword, 'admin']
    );
    const adminId = userResult.rows[0].id;

    await client.query('COMMIT');

    sendSuccess(res, 201, 'Organization registered successfully', { org_id: orgId, admin_id: adminId });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const userRes = await pool.query('SELECT * FROM users WHERE email = $1 AND is_active = true', [email]);
  const user = userRes.rows[0];

  if (!user) {
    return next(new AppError('Invalid email or password.', 401, 'UNAUTHORIZED'));
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return next(new AppError('Invalid email or password.', 401, 'UNAUTHORIZED'));
  }

  const { token, refreshToken } = await generateTokens(user.id, user.org_id, user.role, user.name, user.email);

  sendSuccess(res, 200, 'Login successful', {
    token,
    refresh_token: refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      org_id: user.org_id,
      avatar_url: user.avatar_url
    }
  });
});

exports.refreshToken = catchAsync(async (req, res, next) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return next(new AppError('Refresh token is required.', 400, 'VALIDATION_ERROR'));
  }

  const hashedToken = crypto.createHash('sha256').update(refresh_token).digest('hex');

  const tokenRes = await pool.query(
    'SELECT * FROM refresh_tokens WHERE token_hash = $1 AND revoked = false AND expires_at > NOW()',
    [hashedToken]
  );

  const storedToken = tokenRes.rows[0];
  if (!storedToken) {
    return next(new AppError('Invalid or expired refresh token.', 401, 'UNAUTHORIZED'));
  }

  const userRes = await pool.query('SELECT * FROM users WHERE id = $1 AND is_active = true', [storedToken.user_id]);
  const user = userRes.rows[0];

  if (!user) {
    return next(new AppError('User not found or inactive.', 401, 'UNAUTHORIZED'));
  }

  const payload = { sub: user.id, name: user.name, email: user.email, role: user.role, org_id: user.org_id };
  const newToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

  sendSuccess(res, 200, 'Token refreshed successfully', { token: newToken });
});

exports.logout = catchAsync(async (req, res, next) => {
  // If we had the refresh token in the req body, we could revoke it here.
  // For a simple stateless JWT logout, we just tell the client to remove it.
  // Assuming a refresh token is sent to be revoked:
  const { refresh_token } = req.body;
  if (refresh_token) {
    const hashedToken = crypto.createHash('sha256').update(refresh_token).digest('hex');
    await pool.query('UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1', [hashedToken]);
  }

  sendSuccess(res, 200, 'Logged out successfully');
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  const user = userRes.rows[0];

  if (user) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, hashedToken, expiresAt]
    );

    // TODO: Send email with reset token (mocked for now)
    console.log(`[Mock Email] Password reset token for ${email}: ${resetToken}`);
  }

  // Always return success to prevent email enumeration
  sendSuccess(res, 200, 'Password reset link sent to email');
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { token, new_password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const tokenRes = await pool.query(
    'SELECT * FROM password_reset_tokens WHERE token_hash = $1 AND used = false AND expires_at > NOW()',
    [hashedToken]
  );

  const storedToken = tokenRes.rows[0];
  if (!storedToken) {
    return next(new AppError('Invalid or expired reset token.', 400, 'VALIDATION_ERROR'));
  }

  const hashedPassword = await bcrypt.hash(new_password, 12);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, storedToken.user_id]);
    await client.query('UPDATE password_reset_tokens SET used = true WHERE id = $1', [storedToken.id]);

    await client.query('COMMIT');
    sendSuccess(res, 200, 'Password reset successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

exports.changePassword = catchAsync(async (req, res, next) => {
  const { current_password, new_password } = req.body;
  const userId = req.user.id;

  const userRes = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  const user = userRes.rows[0];

  const isMatch = await bcrypt.compare(current_password, user.password_hash);
  if (!isMatch) {
    return next(new AppError('Incorrect current password.', 401, 'UNAUTHORIZED'));
  }

  const hashedPassword = await bcrypt.hash(new_password, 12);
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, userId]);

  sendSuccess(res, 200, 'Password changed successfully');
});

exports.getMe = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const userRes = await pool.query(
    `SELECT u.id, u.name, u.email, u.role, u.org_id, u.phone, u.avatar_url, u.is_active, u.created_at, o.name as org_name 
     FROM users u 
     JOIN organizations o ON u.org_id = o.id 
     WHERE u.id = $1`,
    [userId]
  );

  sendSuccess(res, 200, 'Profile fetched successfully', userRes.rows[0]);
});

exports.updateMe = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { name, phone, avatar_url } = req.body;

  let query = 'UPDATE users SET ';
  const values = [];
  let count = 1;

  if (name !== undefined) { query += `name = $${count}, `; values.push(name); count++; }
  if (phone !== undefined) { query += `phone = $${count}, `; values.push(phone); count++; }
  if (avatar_url !== undefined) { query += `avatar_url = $${count}, `; values.push(avatar_url); count++; }

  if (values.length === 0) {
    return sendSuccess(res, 200, 'Nothing to update');
  }

  query = query.slice(0, -2); // remove last comma
  query += ` WHERE id = $${count} RETURNING id, name, email, phone, avatar_url`;
  values.push(userId);

  const updateRes = await pool.query(query, values);

  sendSuccess(res, 200, 'Profile updated successfully', { user: updateRes.rows[0] });
});
