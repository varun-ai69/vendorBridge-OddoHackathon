const { pool } = require('../db/db');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const catchAsync = require('../utils/catchAsync');

/**
 * 7.1 Manager: List Pending Approvals
 */
exports.listApprovals = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const { status, page = 1, limit = 10 } = req.query;

  const offset = (page - 1) * limit;
  const values = [orgId];
  let whereClauses = ['ar.org_id = $1'];
  let count = 2;

  if (status) {
    whereClauses.push(`ar.status = $${count}`);
    values.push(status);
    count++;
  }

  const whereString = whereClauses.join(' AND ');

  const countRes = await pool.query(`SELECT COUNT(*) FROM approval_requests ar WHERE ${whereString}`, values);
  const total = parseInt(countRes.rows[0].count, 10);

  const query = `
    SELECT 
      ar.id AS approval_id, r.id AS rfq_id, r.rfq_number, r.title AS rfq_title, 
      v.company_name AS selected_vendor, q.total_amount AS quotation_amount, 
      u.name AS requested_by, ar.created_at AS requested_at, ar.status, ar.priority
    FROM approval_requests ar
    JOIN rfqs r ON ar.rfq_id = r.id
    JOIN quotations q ON ar.quotation_id = q.id
    JOIN vendors v ON q.vendor_id = v.id
    JOIN users u ON ar.requested_by = u.id
    WHERE ${whereString}
    ORDER BY ar.created_at DESC
    LIMIT $${count} OFFSET $${count + 1}
  `;
  const result = await pool.query(query, [...values, limit, offset]);

  sendSuccess(res, 200, 'Approvals fetched', {
    approvals: result.rows,
    total,
    page: Number(page),
    limit: Number(limit)
  });
});

/**
 * 7.2 Manager: Get Approval Detail
 */
exports.getApprovalDetail = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const { approvalId } = req.params;

  const query = `
    SELECT 
      ar.id AS approval_id, ar.status, ar.created_at, ar.remarks AS request_remarks,
      r.rfq_number, r.title, r.created_at AS rfq_created_at,
      v.company_name AS vendor_name, q.total_amount, q.delivery_timeline_days, q.pdf_url, q.submitted_at,
      u.name AS requested_by
    FROM approval_requests ar
    JOIN rfqs r ON ar.rfq_id = r.id
    JOIN quotations q ON ar.quotation_id = q.id
    JOIN vendors v ON q.vendor_id = v.id
    JOIN users u ON ar.requested_by = u.id
    WHERE ar.id = $1 AND ar.org_id = $2
  `;
  const result = await pool.query(query, [approvalId, orgId]);

  if (result.rows.length === 0) return next(new AppError('Approval request not found', 404, 'NOT_FOUND'));

  const data = result.rows[0];

  // Construct fake timeline strictly to contract map, pulling actual DB timestamp correlations where possible
  const timeline = [
    { event: "RFQ Created", by: "Procurement", at: data.rfq_created_at },
    { event: "Quotation Received", by: data.vendor_name, at: data.submitted_at },
    { event: "Vendor Shortlisted & Request Raised", by: data.requested_by, at: data.created_at }
  ];

  sendSuccess(res, 200, 'Approval details fetched', {
    approval_id: data.approval_id,
    status: data.status,
    request_remarks: data.request_remarks,
    rfq: { rfq_number: data.rfq_number, title: data.title },
    selected_quotation: {
      vendor_name: data.vendor_name,
      total_amount: data.total_amount,
      delivery_days: data.delivery_timeline_days,
      quotation_pdf_url: data.pdf_url
    },
    timeline,
    requested_by: data.requested_by,
    requested_at: data.created_at
  });
});

/**
 * 7.3 Manager: Approve or Reject
 */
exports.actionApproval = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const managerId = req.user.id;
  const { approvalId } = req.params;
  const { action, remarks } = req.body; // action: 'approved' | 'rejected'

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Fetch the request
    const checkRes = await client.query('SELECT rfq_id, quotation_id, status FROM approval_requests WHERE id = $1 AND org_id = $2', [approvalId, orgId]);
    if (checkRes.rows.length === 0) throw new AppError('Approval request not found', 404, 'NOT_FOUND');
    if (checkRes.rows[0].status !== 'pending') throw new AppError(`Approval is already ${checkRes.rows[0].status}`, 400, 'BAD_REQUEST');

    const { rfq_id, quotation_id } = checkRes.rows[0];

    // 1. Update Approval Request Status
    await client.query(
      `UPDATE approval_requests SET status = $1, reviewed_by = $2, remarks = $3 WHERE id = $4`,
      [action, managerId, remarks, approvalId]
    );

    if (action === 'approved') {
      // Transition RFQ & Quote cleanly into the execution phase mapped directly to schema ENUM constraints
      await client.query(`UPDATE quotations SET status = 'accepted' WHERE id = $1`, [quotation_id]);
      await client.query(`UPDATE rfqs SET status = 'awarded' WHERE id = $1`, [rfq_id]);
      
      // Mirror the awarded and closed status into the rfq_vendors pivot table natively
      await client.query(`UPDATE rfq_vendors SET status = 'awarded' WHERE rfq_id = $1 AND vendor_id = (SELECT vendor_id FROM quotations WHERE id = $2)`, [rfq_id, quotation_id]);
      await client.query(`UPDATE rfq_vendors SET status = 'closed' WHERE rfq_id = $1 AND status != 'awarded'`, [rfq_id]);

      // Note: We could mark ALL other quotations for this RFQ as 'rejected' optionally.
      await client.query(`UPDATE quotations SET status = 'rejected' WHERE rfq_id = $1 AND id != $2`, [rfq_id, quotation_id]);

      await client.query('COMMIT');
      return sendSuccess(res, 200, 'Procurement approved. Procurement Officer can now generate PO.', { action, approval_id: approvalId });
    } else {
      // If rejected, un-shortlist the quotation back to standard pool
      await client.query(`UPDATE quotations SET status = 'rejected' WHERE id = $1`, [quotation_id]);
      // The RFQ stays "sent" or goes "closed", we'll just leave it open for them to shortlist another one.
      
      await client.query('COMMIT');
      return sendSuccess(res, 200, 'Procurement rejected. Officer must select a new vendor.', { action, approval_id: approvalId });
    }
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

/**
 * 7.4 Procurement Officer: List My Approval Requests for an RFQ
 */
exports.listMyApprovalStatus = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const { rfqId } = req.params;

  const result = await pool.query(`
    SELECT ar.id, ar.status, ar.remarks, ar.created_at, u.name AS requested_by, mu.name AS reviewed_by
    FROM approval_requests ar
    JOIN users u ON ar.requested_by = u.id
    LEFT JOIN users mu ON ar.reviewed_by = mu.id
    WHERE ar.rfq_id = $1 AND ar.org_id = $2
    ORDER BY ar.created_at DESC
  `, [rfqId, orgId]);

  sendSuccess(res, 200, 'Approval flow fetched', {
    rfq_id: rfqId,
    approvals: result.rows
  });
});
