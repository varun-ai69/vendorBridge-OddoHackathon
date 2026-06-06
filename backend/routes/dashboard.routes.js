const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.get(
  '/dashboard/admin', 
  roleMiddleware('admin'), 
  dashboardController.getAdminDashboard
);

router.get(
  '/dashboard/procurement', 
  roleMiddleware('procurement_officer'), 
  dashboardController.getProcurementDashboard
);

router.get(
  '/dashboard/manager', 
  roleMiddleware('manager'), 
  dashboardController.getManagerDashboard
);

router.get(
  '/dashboard/vendor', 
  roleMiddleware('vendor'), 
  dashboardController.getVendorDashboard
);

module.exports = router;
