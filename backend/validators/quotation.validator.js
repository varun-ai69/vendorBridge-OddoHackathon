/**
 * quotation.validator.js — Validation schemas for Quotation routes
 */

const required = (errors, data, field, label) => {
  if (data[field] === undefined || data[field] === null || String(data[field]).trim() === '') {
    errors.push({ field, issue: `${label || field} is required.` });
    return false;
  }
  return true;
};

const submitQuotationSchema = (body) => {
  const errors = [];
  required(errors, body, 'total_amount', 'Total Amount');
  required(errors, body, 'currency', 'Currency');

  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    errors.push({ field: 'items', issue: 'At least one item must be quoted.' });
  } else {
    body.items.forEach((item, index) => {
      if (!item.product_name) errors.push({ field: `items[${index}].product_name`, issue: 'Product name is required.' });
      if (item.unit_price === undefined || isNaN(item.unit_price)) errors.push({ field: `items[${index}].unit_price`, issue: 'Valid unit price is required.' });
      if (!item.quantity || isNaN(item.quantity)) errors.push({ field: `items[${index}].quantity`, issue: 'Valid quantity is required.' });
      if (item.subtotal === undefined || isNaN(item.subtotal)) errors.push({ field: `items[${index}].subtotal`, issue: 'Subtotal is required.' });
    });
  }

  if (body.attachment_urls && !Array.isArray(body.attachment_urls)) {
    errors.push({ field: 'attachment_urls', issue: 'Must be an array of URLs.' });
  }

  return errors;
};

const updateQuotationSchema = (body) => {
  const errors = [];
  if (body.items && !Array.isArray(body.items)) {
    errors.push({ field: 'items', issue: 'Items must be an array.' });
  }
  if (body.attachment_urls && !Array.isArray(body.attachment_urls)) {
    errors.push({ field: 'attachment_urls', issue: 'Must be an array of URLs.' });
  }
  return errors;
};

const selectQuotationSchema = (body) => {
  const errors = [];
  required(errors, body, 'selection_reason', 'Selection Reason');
  return errors;
};

module.exports = {
  submitQuotationSchema,
  updateQuotationSchema,
  selectQuotationSchema
};
