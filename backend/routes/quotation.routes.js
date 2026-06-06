const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotation.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { validateBody } = require('../middlewares/validate');
const { 
  submitQuotationSchema, 
  updateQuotationSchema, 
  selectQuotationSchema 
} = require('../validators/quotation.validator');

// All quotation operations require authentication globally
router.use(authMiddleware);

// ============================================
// VENDOR ROUTES (/api/v1/vendor/rfqs AND /api/v1/vendor/quotations)
// ============================================

router.post(
  '/vendor/rfqs/:rfqId/quotation', 
  roleMiddleware('vendor'), 
  validateBody(submitQuotationSchema), 
  quotationController.submitQuotation
);

router.put(
  '/vendor/rfqs/:rfqId/quotation/:quotationId', 
  roleMiddleware('vendor'), 
  validateBody(updateQuotationSchema), 
  quotationController.updateQuotation
);

router.get(
  '/vendor/quotations', 
  roleMiddleware('vendor'), 
  quotationController.listVendorQuotations
);

router.get(
  '/vendor/quotations/:quotationId', 
  roleMiddleware('vendor'), 
  quotationController.getVendorQuotation
);

// ============================================
// INTERNAL ROUTES (/api/v1/rfq)
// ============================================

router.get(
  '/rfq/:rfqId/quotations', 
  roleMiddleware('procurement_officer', 'manager'), 
  quotationController.listRfqsQuotations
);

router.get(
  '/rfq/:rfqId/quotations/compare', 
  roleMiddleware('procurement_officer', 'manager'), 
  quotationController.compareQuotations
);

router.patch(
  '/rfq/:rfqId/quotations/:quotationId/select', 
  roleMiddleware('procurement_officer'), 
  validateBody(selectQuotationSchema), 
  quotationController.selectQuotation
);

module.exports = router;
