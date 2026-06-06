/**
 * po.validator.js — Validation schemas for Purchase Order routes
 */

const required = (errors, data, field, label) => {
  if (data[field] === undefined || data[field] === null || String(data[field]).trim() === '') {
    errors.push({ field, issue: `${label || field} is required.` });
    return false;
  }
  return true;
};

const generatePOSchema = (body) => {
  const errors = [];
  required(errors, body, 'rfq_id', 'RFQ ID');
  required(errors, body, 'quotation_id', 'Quotation ID');
  required(errors, body, 'approval_id', 'Approval ID');
  required(errors, body, 'delivery_address', 'Delivery Address');
  required(errors, body, 'expected_delivery_date', 'Expected Delivery Date');
  required(errors, body, 'payment_terms', 'Payment Terms');
  return errors;
};

const sendEmailSchema = (body) => {
  const errors = [];
  required(errors, body, 'recipient_email', 'Recipient Email');
  return errors;
};

const updateStatusSchema = (body) => {
  const errors = [];
  required(errors, body, 'status', 'Status');
  return errors;
};

module.exports = {
  generatePOSchema,
  sendEmailSchema,
  updateStatusSchema
};
