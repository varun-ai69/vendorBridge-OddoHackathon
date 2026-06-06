/**
 * user.validator.js — Validation schemas for Admin User Management
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

const validRoles = ['admin', 'procurement_officer', 'manager']; // Internal roles only

const inviteUserSchema = (body) => {
  const errors = [];
  required(errors, body, 'name', 'Name');
  
  if (required(errors, body, 'email', 'Email') && !isEmail(body.email)) {
    errors.push({ field: 'email', issue: 'Must be a valid email format.' });
  }
  
  if (required(errors, body, 'role', 'Role') && !validRoles.includes(body.role)) {
    errors.push({ field: 'role', issue: `Role must be one of: ${validRoles.join(', ')}` });
  }

  required(errors, body, 'generated_password', 'Generated Password');

  return errors;
};

const updateUserSchema = (body) => {
  const errors = [];
  if (body.role && !validRoles.includes(body.role)) {
    errors.push({ field: 'role', issue: `Role must be one of: ${validRoles.join(', ')}` });
  }
  return errors;
};

const statusUserSchema = (body) => {
  const errors = [];
  if (body.is_active === undefined) {
    errors.push({ field: 'is_active', issue: 'is_active is required.' });
  } else if (typeof body.is_active !== 'boolean') {
    errors.push({ field: 'is_active', issue: 'Must be a boolean value (true or false).' });
  }
  return errors;
};

const resetPasswordSchema = (body) => {
  const errors = [];
  if (required(errors, body, 'new_password', 'New Password') && !isStrongPassword(body.new_password)) {
    errors.push({ field: 'new_password', issue: 'Weak password.' });
  }
  return errors;
};

module.exports = {
  inviteUserSchema,
  updateUserSchema,
  statusUserSchema,
  resetPasswordSchema
};
