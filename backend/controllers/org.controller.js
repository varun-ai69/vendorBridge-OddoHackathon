const { pool } = require('../db/db');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const catchAsync = require('../utils/catchAsync');

exports.getOrgDetails = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;

  const orgRes = await pool.query(
    'SELECT id, name, address, gst, industry, website, logo_url, is_active, created_at FROM organizations WHERE id = $1',
    [orgId]
  );

  if (orgRes.rows.length === 0) {
    return next(new AppError('Organization not found', 404, 'NOT_FOUND'));
  }

  sendSuccess(res, 200, 'Organization details fetched', { organization: orgRes.rows[0] });
});

exports.updateOrgDetails = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const { name, address, gst, website, logo_url } = req.body;

  let query = 'UPDATE organizations SET ';
  const values = [];
  let count = 1;

  if (name !== undefined) { query += `name = $${count}, `; values.push(name); count++; }
  if (address !== undefined) { query += `address = $${count}, `; values.push(address); count++; }
  if (gst !== undefined) { query += `gst = $${count}, `; values.push(gst); count++; }
  if (website !== undefined) { query += `website = $${count}, `; values.push(website); count++; }
  if (logo_url !== undefined) { query += `logo_url = $${count}, `; values.push(logo_url); count++; }

  if (values.length === 0) {
    return sendSuccess(res, 200, 'Nothing to update');
  }

  query = query.slice(0, -2); // remove last comma
  query += ` WHERE id = $${count} RETURNING id, name, address, gst, industry, website, logo_url`;
  values.push(orgId);

  try {
    const updateRes = await pool.query(query, values);
    sendSuccess(res, 200, 'Organization updated successfully', { organization: updateRes.rows[0] });
  } catch (error) {
    // Let global error handler catch unique constraint for GST if needed
    throw error;
  }
});
