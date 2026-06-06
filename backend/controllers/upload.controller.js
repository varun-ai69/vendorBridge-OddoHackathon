const { pool } = require('../db/db');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const catchAsync = require('../utils/catchAsync');

/**
 * 13. FILE UPLOADS
 * Native PostgreSQL mapping block tracking CDN URLs.
 */
exports.uploadAttachment = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const userId = req.user.id;
  
  // Simulating an express-multer file intercept that would sit just above this layer
  const fakeFileName = req.body.file_name || `uploaded_document_${Date.now()}.pdf`;
  const fakeFileSize = 204800; // static simulation
  const fakeMimeType = 'application/pdf';
  
  const entityType = req.body.entity_type || 'rfq'; 
  const entityId = req.body.entity_id || null;

  const generatedId = `uuid-${Date.now()}`;
  const fileUrl = `https://cdn/uploads/${generatedId}-${fakeFileName}`;

  // Natively map the file tracking struct directly into SQL logic
  const query = `
    INSERT INTO file_uploads (org_id, file_url, file_name, file_size, mime_type, entity_type, entity_id, uploaded_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, file_url, file_name, file_size, mime_type
  `;
  
  const result = await pool.query(query, [
    orgId, fileUrl, fakeFileName, fakeFileSize, fakeMimeType, entityType, entityId, userId
  ]);

  sendSuccess(res, 200, 'File uploaded mock successful', {
    success: true,
    file_url: result.rows[0].file_url,
    file_name: result.rows[0].file_name,
    file_size: parseInt(result.rows[0].file_size),
    mime_type: result.rows[0].mime_type
  });
});
