const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approval.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { validateBody } = require('../middlewares/validate');
const { actionApprovalSchema } = require('../validators/approval.validator');

router.use(authMiddleware);

// ============================================
// MANAGER ROUTES
// ============================================
router.get(
  '/approvals', 
  roleMiddleware('manager'), 
  approvalController.listApprovals
);

router.get(
  '/approvals/:approvalId', 
  roleMiddleware('manager', 'procurement_officer'), 
  approvalController.getApprovalDetail
);

router.patch(
  '/approvals/:approvalId/action', 
  roleMiddleware('manager'), 
  validateBody(actionApprovalSchema),
  approvalController.actionApproval
);


// ============================================
// PROCUREMENT OFFICER ROUTES
// ============================================
router.get(
  '/rfq/:rfqId/approval-status', 
  roleMiddleware('procurement_officer', 'manager'), 
  approvalController.listMyApprovalStatus
);

module.exports = router;
