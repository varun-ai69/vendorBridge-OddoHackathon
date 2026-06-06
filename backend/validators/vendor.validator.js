/**
 * vendor.validator.js — Validation schemas for Vendor Management
 */

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const required = (errors, data, field, label) => {
  if (data[field] === undefined || data[field] === null || String(data[field]).trim() === '') {
    errors.push({ field, issue: `${label || field} is required.` });
    return false;
  }
  return true;
};

const createVendorSchema = (body) => {
  const errors = [];
  required(errors, body, 'company_name', 'Company Name');
  required(errors, body, 'contact_person', 'Contact Person');
  
  if (required(errors, body, 'email', 'Email') && !isEmail(body.email)) {
    errors.push({ field: 'email', issue: 'Must be a valid email format.' });
  }

  required(errors, body, 'generated_password', 'Generated Password');

  if (body.category && !Array.isArray(body.category)) {
    errors.push({ field: 'category', issue: 'Category must be an array of strings.' });
  }

  return errors;
};

const updateVendorSchema = (body) => {
  const errors = [];
  if (body.email && !isEmail(body.email)) {
    errors.push({ field: 'email', issue: 'Must be a valid email format.' });
  }
  if (body.category && !Array.isArray(body.category)) {
    errors.push({ field: 'category', issue: 'Category must be an array of strings.' });
  }
  return errors;
};

const updateVendorStatusSchema = (body) => {
  const errors = [];
  if (body.is_approved === undefined && body.is_active === undefined) {
    errors.push({ field: 'status', issue: 'Must provide either is_approved or is_active.' });
  }
  return errors;
};

const updateVendorProfileSchema = (body) => {
  // Vendor self-update
  const errors = [];
  // basic checks could go here
  return errors;
};

module.exports = {
  createVendorSchema,
  updateVendorSchema,
  updateVendorStatusSchema,
  updateVendorProfileSchema
};
