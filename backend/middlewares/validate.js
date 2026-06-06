/**
 * validate.js — Request body validation middleware factory
 */
const AppError = require('../utils/AppError');

const validateBody = (schemaFn) => (req, res, next) => {
  const errors = schemaFn(req.body);
  if (errors.length > 0) {
    return next(new AppError('Validation failed.', 400, 'VALIDATION_ERROR', errors));
  }
  next();
};

const validateQuery = (schemaFn) => (req, res, next) => {
  const errors = schemaFn(req.query);
  if (errors.length > 0) {
    return next(new AppError('Invalid query parameters.', 400, 'VALIDATION_ERROR', errors));
  }
  next();
};

module.exports = { validateBody, validateQuery };
