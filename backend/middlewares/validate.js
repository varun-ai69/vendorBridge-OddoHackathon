/**
 * validate.js — Request body validation middleware factory
 */
const AppError = require('../utils/AppError');

const validateBody = (schemaFn) => (req, res, next) => {
  const payload = req.body || {};
  const errors = schemaFn(payload);
  if (errors.length > 0) {
    return next(new AppError('Validation failed.', 400, 'VALIDATION_ERROR', errors));
  }
  next();
};

const validateQuery = (schemaFn) => (req, res, next) => {
  const payload = req.query || {};
  const errors = schemaFn(payload);
  if (errors.length > 0) {
    return next(new AppError('Invalid query parameters.', 400, 'VALIDATION_ERROR', errors));
  }
  next();
};

module.exports = { validateBody, validateQuery };
