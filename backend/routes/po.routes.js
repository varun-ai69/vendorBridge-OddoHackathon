const express = require('express');
const router = express.Router();
const poController = require('../controllers/po.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { validateBody } = require('../middlewares/validate');
const { generatePOSchema, sendEmailSchema, updateStatusSchema } = require('../validators/po.validator');

router.use(authMiddleware);

// ============================================
// INTERNAL ROUTES (/api/v1/po)
// ============================================

router.post(
  '/po', 
  roleMiddleware('procurement_officer'), 
  validateBody(generatePOSchema),
  poController.generatePo
);

router.get(
  '/po', 
  roleMiddleware('procurement_officer', 'admin', 'manager'), 
  poController.listPos
);

// Includes support for vendor (checked dynamically in controller)
router.get(
  '/po/:poId', 
  roleMiddleware('procurement_officer', 'admin', 'manager', 'vendor'), 
  poController.getPo
);

router.get(
  '/po/:poId/download', 
  roleMiddleware('procurement_officer', 'admin', 'vendor'), 
  poController.downloadPoPdf
);

router.post(
  '/po/:poId/send-email', 
  roleMiddleware('procurement_officer'), 
  validateBody(sendEmailSchema),
  poController.sendPoEmail
);

// Both Vendor & Procurement can update status contextually
router.patch(
  '/po/:poId/status', 
  roleMiddleware('procurement_officer', 'vendor'), 
  validateBody(updateStatusSchema),
  poController.updatePoStatus
);


// ============================================
// VENDOR ROUTES (/api/v1/vendor/po)
// ============================================

router.get(
  '/vendor/po', 
  roleMiddleware('vendor'), 
  poController.listVendorPos
);

module.exports = router;
