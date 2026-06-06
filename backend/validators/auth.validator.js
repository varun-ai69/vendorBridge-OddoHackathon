/**
 * auth.validator.js — Validation schemas for Auth routes
 */

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const isStrongPassword = (v) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#])[A-Za-z\d@$!%*?&_\-#]{8,}$/.test(v);

const required = (errors, data, field, label) => {
  if (data[field] === undefined || data[field] === null || String(data[field]).trim() === '') {
    errors.push({ field, issue: `${label || field} is required.` });
    return false;
  }
  return true;
};

const registerOrgSchema = (body) => {
  const errors = [];
  required(errors, body, 'org_name', 'Organization name');
  required(errors, body, 'admin_name', 'Admin name');

  if (required(errors, body, 'admin_email', 'Admin email') && !isEmail(body.admin_email)) {
    errors.push({ field: 'admin_email', issue: 'Must be a valid email address.' });
  }

  if (required(errors, body, 'admin_password', 'Admin password') && !isStrongPassword(body.admin_password)) {
    errors.push({
      field: 'admin_password',
      issue: 'Password must be at least 8 chars + include uppercase, lowercase, number, and special character.',
    });
  }

  return errors;
};

const loginSchema = (body) => {
  const errors = [];
  if (required(errors, body, 'email', 'Email') && !isEmail(body.email)) {
    errors.push({ field: 'email', issue: 'Must be a valid email address.' });
  }
  required(errors, body, 'password', 'Password');
  return errors;
};

const refreshTokenSchema = (body) => {
  const errors = [];
  required(errors, body, 'refresh_token', 'Refresh token');
  return errors;
};

const forgotPasswordSchema = (body) => {
  const errors = [];
  if (required(errors, body, 'email', 'Email') && !isEmail(body.email)) {
    errors.push({ field: 'email', issue: 'Must be a valid email address.' });
  }
  return errors;
};

const resetPasswordSchema = (body) => {
  const errors = [];
  required(errors, body, 'token', 'Reset token');
  if (required(errors, body, 'new_password', 'New password') && !isStrongPassword(body.new_password)) {
    errors.push({ field: 'new_password', issue: 'Weak password.' });
  }
  return errors;
};

const changePasswordSchema = (body) => {
  const errors = [];
  required(errors, body, 'current_password', 'Current password');
  if (required(errors, body, 'new_password', 'New password') && !isStrongPassword(body.new_password)) {
    errors.push({ field: 'new_password', issue: 'Weak password.' });
  }
  return errors;
};

const updateProfileSchema = (body) => {
  const errors = [];
  if (body.avatar_url && !/^https?:\/\/.+/.test(body.avatar_url)) {
    errors.push({ field: 'avatar_url', issue: 'Must be a valid URL.' });
  }
  return errors;
};

module.exports = {
  registerOrgSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
};
