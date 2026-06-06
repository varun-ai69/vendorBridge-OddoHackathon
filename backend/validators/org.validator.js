/**
 * org.validator.js — Validation schemas for Organization routes
 */

const isUrl = (v) => /^https?:\/\/.+/.test(v);

const isGST = (v) => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);

const updateOrgSchema = (body) => {
  const errors = [];

  if (body.gst && !isGST(body.gst)) {
    errors.push({ field: 'gst', issue: 'Must be a valid 15-character Indian GST number.' });
  }

  if (body.website && !isUrl(body.website)) {
    errors.push({ field: 'website', issue: 'Must be a valid URL (http/https).' });
  }

  if (body.logo_url && !isUrl(body.logo_url)) {
    errors.push({ field: 'logo_url', issue: 'Must be a valid URL (http/https).' });
  }

  return errors;
};

module.exports = { updateOrgSchema };
