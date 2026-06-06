/**
 * approval.validator.js — Validation schemas for Approval Workflow
 */

const required = (errors, data, field, label) => {
  if (data[field] === undefined || data[field] === null || String(data[field]).trim() === '') {
    errors.push({ field, issue: `${label || field} is required.` });
    return false;
  }
  return true;
};

const actionApprovalSchema = (body) => {
  const errors = [];
  required(errors, body, 'action', 'Approval Action');
  
  if (body.action && !['approved', 'rejected'].includes(body.action)) {
    errors.push({ field: 'action', issue: 'Action must be strictly either "approved" or "rejected".' });
  }
  return errors;
};

module.exports = {
  actionApprovalSchema
};
