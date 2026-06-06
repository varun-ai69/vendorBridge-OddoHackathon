const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { validateBody } = require('../middlewares/validate');
const { 
  generateInvoiceSchema, 
  updatePaymentStatusSchema, 
  sendEmailSchema 
} = require('../validators/invoice.validator');

router.use(authMiddleware);


// ============================================
// INTERNAL ROUTES
// ============================================

router.get(
  '/invoices', 
  roleMiddleware('procurement_officer', 'admin', 'manager'), 
  invoiceController.listInvoices
);

// Note: This endpoint scales to handle 9.8 Vendor Specific access safely utilizing context inside controller.
router.get(
  '/invoices/:invoiceId', 
  roleMiddleware('procurement_officer', 'admin', 'manager', 'vendor'), 
  invoiceController.getInvoice
);

router.get(
  '/invoices/:invoiceId/download', 
  roleMiddleware('procurement_officer', 'admin', 'vendor'), 
  invoiceController.downloadInvoicePdf
);

router.post(
  '/invoices/:invoiceId/send-email', 
  roleMiddleware('procurement_officer', 'vendor'), 
  validateBody(sendEmailSchema),
  invoiceController.sendInvoiceEmail
);

router.patch(
  '/invoices/:invoiceId/status', 
  roleMiddleware('procurement_officer', 'admin'), 
  validateBody(updatePaymentStatusSchema),
  invoiceController.updateInvoiceStatus
);


// ============================================
// VENDOR ROUTES 
// ============================================

router.post(
  '/vendor/po/:poId/invoice', 
  roleMiddleware('vendor'), 
  validateBody(generateInvoiceSchema), 
  invoiceController.generateInvoice
);

router.get(
  '/vendor/invoices', 
  roleMiddleware('vendor'), 
  invoiceController.listVendorInvoices
);

// For explicit pathing (Section 9.8 directly), routed identically:
router.get(
  '/vendor/invoices/:invoiceId', 
  roleMiddleware('vendor'), 
  invoiceController.getInvoice
);

module.exports = router;
