/**
 * errorHandler.js — Global Express error-handling middleware
 */
const AppError = require('../utils/AppError');
const { sendError } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  if (err.isOperational) {
    return sendError(res, err.statusCode, err.errorCode, err.message, err.details);
  }

  if (err.code === '23505') {
    const field = err.detail?.match(/\(([^)]+)\)/)?.[1] || 'field';
    return sendError(res, 409, 'CONFLICT', `A record with this ${field} already exists.`);
  }

  if (err.code === '23503') {
    return sendError(res, 409, 'CONFLICT', 'Referenced record does not exist.');
  }

  if (err.code === '22P02') {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid ID format provided.');
  }

  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'UNAUTHORIZED', 'Invalid token.');
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'UNAUTHORIZED', 'Token has expired.');
  }

  console.error('💥 UNHANDLED ERROR:', err);

  return sendError(
    res,
    500,
    'INTERNAL_SERVER_ERROR',
    process.env.NODE_ENV === 'production'
      ? 'Something went wrong. Please try again.'
      : err.message
  );
};

module.exports = errorHandler;
