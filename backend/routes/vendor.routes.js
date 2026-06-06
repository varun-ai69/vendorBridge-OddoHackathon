const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendor.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { validateBody } = require('../middlewares/validate');
const { 
  createVendorSchema, 
  updateVendorSchema, 
  updateVendorStatusSchema, 
  updateVendorProfileSchema 
} = require('../validators/vendor.validator');

router.use(authMiddleware);

// ============================================
// ADMIN ROUTES (/api/v1/admin/vendors)
// ============================================
router.post(
  '/admin/vendors', 
  roleMiddleware('admin'), 
  validateBody(createVendorSchema), 
  vendorController.createVendor
);

router.get(
  '/admin/vendors', 
  roleMiddleware('admin', 'procurement_officer'), 
  vendorController.listVendors
);

router.get(
  '/admin/vendors/:vendorId', 
  roleMiddleware('admin', 'procurement_officer'), 
  vendorController.getVendor
);

router.put(
  '/admin/vendors/:vendorId', 
  roleMiddleware('admin'), 
  validateBody(updateVendorSchema), 
  vendorController.updateVendor
);

router.patch(
  '/admin/vendors/:vendorId/status', 
  roleMiddleware('admin'), 
  validateBody(updateVendorStatusSchema), 
  vendorController.updateVendorStatus
);

router.delete(
  '/admin/vendors/:vendorId', 
  roleMiddleware('admin'), 
  vendorController.deleteVendor
);


// ============================================
// VENDOR ROUTES (/api/v1/vendor/profile)
// ============================================
router.get(
  '/vendor/profile', 
  roleMiddleware('vendor'), 
  vendorController.getVendorProfile
);

router.put(
  '/vendor/profile', 
  roleMiddleware('vendor'), 
  validateBody(updateVendorProfileSchema), 
  vendorController.updateVendorProfile
);

module.exports = router;
