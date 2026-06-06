/**
 * invoice.validator.js — Validation schemas for Invoices routes
 */

const required = (errors, data, field, label) => {
  if (data[field] === undefined || data[field] === null || String(data[field]).trim() === '') {
    errors.push({ field, issue: `${label || field} is required.` });
    return false;
  }
  return true;
};

const generateInvoiceSchema = (body) => {
  const errors = [];
  required(errors, body, 'invoice_date', 'Invoice Date');
  required(errors, body, 'subtotal', 'Subtotal');
  required(errors, body, 'grand_total', 'Grand Total');
  required(errors, body, 'due_date', 'Due Date');

  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    errors.push({ field: 'items', issue: 'At least one item must be billed.' });
  } else {
    body.items.forEach((item, index) => {
      if (!item.product_name) errors.push({ field: `items[${index}].product_name`, issue: 'Product name is required.' });
      if (item.unit_price === undefined || isNaN(item.unit_price)) errors.push({ field: `items[${index}].unit_price`, issue: 'Valid unit price is required.' });
      if (!item.quantity || isNaN(item.quantity)) errors.push({ field: `items[${index}].quantity`, issue: 'Valid quantity is required.' });
      if (item.subtotal === undefined || isNaN(item.subtotal)) errors.push({ field: `items[${index}].subtotal`, issue: 'Subtotal is required.' });
    });
  }
  return errors;
};

const updatePaymentStatusSchema = (body) => {
  const errors = [];
  required(errors, body, 'status', 'Status');
  
  if (body.status === 'paid') {
    required(errors, body, 'payment_date', 'Payment Date');
    required(errors, body, 'payment_reference', 'Payment Reference');
  }
  
  return errors;
};

const sendEmailSchema = (body) => {
  const errors = [];
  required(errors, body, 'recipient_email', 'Recipient Email');
  return errors;
};

module.exports = {
  generateInvoiceSchema,
  updatePaymentStatusSchema,
  sendEmailSchema
};
