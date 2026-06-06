/**
 * response.js — Standardized API response helpers
 */
const sendSuccess = (res, statusCode, message, data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data,
  });
};

const sendError = (res, statusCode, errorCode, message, details = []) => {
  const body = {
    success: false,
    error: errorCode,
    message,
  };
  if (details.length) body.details = details;
  return res.status(statusCode).json(body);
};

module.exports = { sendSuccess, sendError };
