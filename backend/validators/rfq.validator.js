/**
 * rfq.validator.js — Validation schemas for RFQ routes
 */

const required = (errors, data, field, label) => {
  if (data[field] === undefined || data[field] === null || String(data[field]).trim() === '') {
    errors.push({ field, issue: `${label || field} is required.` });
    return false;
  }
  return true;
};

const createRfqSchema = (body) => {
  const errors = [];
  required(errors, body, 'title', 'Title');
  required(errors, body, 'deadline', 'Deadline');

  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    errors.push({ field: 'items', issue: 'At least one item is required.' });
  } else {
    body.items.forEach((item, index) => {
      if (!item.product_name) errors.push({ field: `items[${index}].product_name`, issue: 'Product name is required.' });
      if (!item.quantity || isNaN(item.quantity) || item.quantity <= 0) errors.push({ field: `items[${index}].quantity`, issue: 'Valid quantity is required.' });
      if (!item.unit) errors.push({ field: `items[${index}].unit`, issue: 'Unit is required.' });
    });
  }

  if (body.vendor_ids && !Array.isArray(body.vendor_ids)) {
    errors.push({ field: 'vendor_ids', issue: 'Must be an array of vendor UUIDs.' });
  }

  if (body.attachment_urls && !Array.isArray(body.attachment_urls)) {
    errors.push({ field: 'attachment_urls', issue: 'Must be an array of URLs.' });
  }

  return errors;
};

const updateRfqSchema = (body) => {
  const errors = [];
  // Basic structural validation can go here
  if (body.items && !Array.isArray(body.items)) {
    errors.push({ field: 'items', issue: 'Items must be an array.' });
  }
  return errors;
};

const cancelRfqSchema = (body) => {
  const errors = [];
  required(errors, body, 'reason', 'Cancellation Reason');
  return errors;
};

const addVendorsSchema = (body) => {
  const errors = [];
  if (!body.vendor_ids || !Array.isArray(body.vendor_ids) || body.vendor_ids.length === 0) {
    errors.push({ field: 'vendor_ids', issue: 'At least one vendor ID is required.' });
  }
  return errors;
};

module.exports = {
  createRfqSchema,
  updateRfqSchema,
  cancelRfqSchema,
  addVendorsSchema
};
