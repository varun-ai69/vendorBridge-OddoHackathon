const { pool } = require('../db/db');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const catchAsync = require('../utils/catchAsync');

const getVendorId = async (userId, orgId) => {
  const res = await pool.query('SELECT vendor_id FROM users WHERE id = $1 AND org_id = $2', [userId, orgId]);
  return res.rows[0]?.vendor_id;
};

exports.getAdminDashboard = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;

  const users = await pool.query('SELECT COUNT(*) FROM users WHERE org_id = $1', [orgId]);
  const vendors = await pool.query('SELECT COUNT(*) FROM vendors WHERE org_id = $1 AND is_active = true', [orgId]);
  const activeRfqs = await pool.query("SELECT COUNT(*) FROM rfqs WHERE org_id = $1 AND status IN ('sent', 'draft')", [orgId]);
  const pendingApprovals = await pool.query("SELECT COUNT(*) FROM approval_requests WHERE org_id = $1 AND status = 'pending'", [orgId]);

  const monthPos = await pool.query("SELECT COUNT(*), COALESCE(SUM(grand_total), 0) AS spend FROM purchase_orders WHERE org_id = $1 AND created_at >= date_trunc('month', current_date)", [orgId]);
  const pendingInvs = await pool.query("SELECT COUNT(*) FROM invoices WHERE org_id = $1 AND status = 'pending'", [orgId]);

  const recentRfqs = await pool.query("SELECT id, rfq_number, title, status, created_at FROM rfqs WHERE org_id = $1 ORDER BY created_at DESC LIMIT 5", [orgId]);
  const recentPos = await pool.query("SELECT id, po_number, grand_total, status, created_at FROM purchase_orders WHERE org_id = $1 ORDER BY created_at DESC LIMIT 5", [orgId]);

  sendSuccess(res, 200, 'Admin Dashboard', {
    total_users: parseInt(users.rows[0].count),
    total_vendors: parseInt(vendors.rows[0].count),
    active_rfqs: parseInt(activeRfqs.rows[0].count),
    pending_approvals: parseInt(pendingApprovals.rows[0].count),
    total_pos_this_month: parseInt(monthPos.rows[0].count),
    total_spend_this_month: parseFloat(monthPos.rows[0].spend),
    total_invoices_pending: parseInt(pendingInvs.rows[0].count),
    recent_rfqs: recentRfqs.rows,
    recent_pos: recentPos.rows,
    spend_by_category: [
      { category: "System General", amount: parseFloat(monthPos.rows[0].spend) }
    ]
  });
});

exports.getProcurementDashboard = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const userId = req.user.id;

  const myActiveRfqs = await pool.query("SELECT COUNT(*) FROM rfqs WHERE org_id = $1 AND created_by = $2 AND status IN ('draft', 'sent')", [orgId, userId]);
  const myPendingApprovals = await pool.query("SELECT COUNT(*) FROM approval_requests WHERE org_id = $1 AND requested_by = $2 AND status = 'pending'", [orgId, userId]);
  const myPos = await pool.query("SELECT COUNT(*) FROM purchase_orders WHERE org_id = $1 AND created_by = $2 AND created_at >= date_trunc('month', current_date)", [orgId, userId]);
  
  const recentRfqs = await pool.query("SELECT id, rfq_number, title, status, created_at FROM rfqs WHERE org_id = $1 AND created_by = $2 ORDER BY created_at DESC LIMIT 5", [orgId, userId]);
  const recentPos = await pool.query("SELECT id, po_number, grand_total, status, created_at FROM purchase_orders WHERE org_id = $1 AND created_by = $2 ORDER BY created_at DESC LIMIT 5", [orgId, userId]);

  sendSuccess(res, 200, 'Procurement Dashboard', {
    my_active_rfqs: parseInt(myActiveRfqs.rows[0].count),
    my_pending_approvals: parseInt(myPendingApprovals.rows[0].count),
    my_pos_this_month: parseInt(myPos.rows[0].count),
    quotations_received_today: 0, // Mocked 
    recent_rfqs: recentRfqs.rows,
    recent_pos: recentPos.rows,
    quick_actions: { create_rfq: true, compare_quotations: true }
  });
});

exports.getManagerDashboard = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;

  const pendingApprovals = await pool.query("SELECT COUNT(*) FROM approval_requests WHERE org_id = $1 AND status = 'pending'", [orgId]);
  const approvalsThisMonth = await pool.query("SELECT COUNT(*) FROM approval_requests WHERE org_id = $1 AND status = 'approved' AND created_at >= date_trunc('month', current_date)", [orgId]);
  const rejectionsThisMonth = await pool.query("SELECT COUNT(*) FROM approval_requests WHERE org_id = $1 AND status = 'rejected' AND created_at >= date_trunc('month', current_date)", [orgId]);

  const spendApproved = await pool.query(`
    SELECT COALESCE(SUM(q.total_amount), 0) AS spend
    FROM approval_requests ar
    JOIN quotations q ON ar.quotation_id = q.id
    WHERE ar.org_id = $1 AND ar.status = 'approved' AND ar.created_at >= date_trunc('month', current_date)
  `, [orgId]);

  const recentApprovals = await pool.query("SELECT id, status, priority, created_at FROM approval_requests WHERE org_id = $1 ORDER BY created_at DESC LIMIT 5", [orgId]);

  sendSuccess(res, 200, 'Manager Dashboard', {
    pending_approvals: parseInt(pendingApprovals.rows[0].count),
    approved_this_month: parseInt(approvalsThisMonth.rows[0].count),
    rejected_this_month: parseInt(rejectionsThisMonth.rows[0].count),
    total_spend_approved: parseFloat(spendApproved.rows[0].spend),
    recent_approvals: recentApprovals.rows,
    approval_trend: [ 
        { month: "Current Month", approved: parseInt(approvalsThisMonth.rows[0].count), rejected: parseInt(rejectionsThisMonth.rows[0].count) } 
    ]
  });
});

exports.getVendorDashboard = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const vendorId = await getVendorId(req.user.id, orgId);

  if (!vendorId) return next(new AppError('Unlinked vendor account', 400, 'BAD_REQUEST'));

  const activeRfqsRes = await pool.query("SELECT COUNT(*) FROM rfq_vendors rv JOIN rfqs r ON rv.rfq_id = r.id WHERE rv.vendor_id = $1 AND r.status IN ('sent')", [vendorId]);
  const quotesSub = await pool.query("SELECT COUNT(*) FROM quotations WHERE vendor_id = $1 AND org_id = $2", [vendorId, orgId]);
  const quotesAcc = await pool.query("SELECT COUNT(*) FROM quotations WHERE vendor_id = $1 AND org_id = $2 AND status = 'accepted'", [vendorId, orgId]);
  const activePos = await pool.query("SELECT COUNT(*) FROM purchase_orders WHERE vendor_id = $1 AND org_id = $2 AND status NOT IN ('delivered', 'cancelled')", [vendorId, orgId]);
  const pendInv = await pool.query("SELECT COUNT(*) FROM invoices WHERE vendor_id = $1 AND org_id = $2 AND status = 'pending'", [vendorId, orgId]);
  
  const totalRev = await pool.query("SELECT COALESCE(SUM(grand_total), 0) AS rev FROM invoices WHERE vendor_id = $1 AND org_id = $2 AND status = 'paid' AND payment_date >= date_trunc('month', current_date)", [vendorId, orgId]);

  const recentRfqs = await pool.query("SELECT r.id, r.rfq_number, r.title FROM rfq_vendors rv JOIN rfqs r ON rv.rfq_id = r.id WHERE rv.vendor_id = $1 ORDER BY r.created_at DESC LIMIT 3", [vendorId]);
  const recentPos  = await pool.query("SELECT id, po_number, grand_total, status FROM purchase_orders WHERE vendor_id = $1 ORDER BY created_at DESC LIMIT 3", [vendorId]);

  sendSuccess(res, 200, 'Vendor Dashboard', {
    active_rfqs_received: parseInt(activeRfqsRes.rows[0].count),
    quotations_submitted: parseInt(quotesSub.rows[0].count),
    quotations_accepted: parseInt(quotesAcc.rows[0].count),
    active_pos: parseInt(activePos.rows[0].count),
    pending_invoices: parseInt(pendInv.rows[0].count),
    total_revenue_this_month: parseFloat(totalRev.rows[0].rev),
    recent_rfqs: recentRfqs.rows,
    recent_pos: recentPos.rows
  });
});
