const express = require('express');
const router = express.Router();
const rfqController = require('../controllers/rfq.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { validateBody } = require('../middlewares/validate');
const { 
  createRfqSchema, 
  updateRfqSchema, 
  cancelRfqSchema, 
  addVendorsSchema 
} = require('../validators/rfq.validator');

// All RFQ operations require authentication globally
router.use(authMiddleware);

// ============================================
// INTERNAL ROUTES (/api/v1/rfq)
// ============================================

// 🛒 CREATE (Procurement specific)
router.post(
  '/rfq', 
  roleMiddleware('procurement_officer'), 
  validateBody(createRfqSchema), 
  rfqController.createRfq
);

// 👑 🛒 ✅ LIST & VIEW (Admin, Procurement Officer, Manager)
router.get(
  '/rfq', 
  roleMiddleware('admin', 'procurement_officer', 'manager'), 
  rfqController.listRfqs
);

router.get(
  '/rfq/:rfqId', 
  roleMiddleware('admin', 'procurement_officer', 'manager'), 
  rfqController.getRfq
);

// 🛒 MODIFY & ACTIONS (Procurement specific)
router.put(
  '/rfq/:rfqId', 
  roleMiddleware('procurement_officer'), 
  validateBody(updateRfqSchema), 
  rfqController.updateRfq
);

router.patch(
  '/rfq/:rfqId/cancel', 
  roleMiddleware('procurement_officer'), 
  validateBody(cancelRfqSchema), 
  rfqController.cancelRfq
);

router.post(
  '/rfq/:rfqId/vendors', 
  roleMiddleware('procurement_officer'), 
  validateBody(addVendorsSchema), 
  rfqController.addVendorsToRfq
);


// ============================================
// VENDOR ROUTES (/api/v1/vendor/rfqs)
// ============================================
router.get(
  '/vendor/rfqs', 
  roleMiddleware('vendor'), 
  rfqController.listVendorRfqs
);

router.get(
  '/vendor/rfqs/:rfqId', 
  roleMiddleware('vendor'), 
  rfqController.getVendorRfq
);

module.exports = router;
