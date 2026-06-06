const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.get('/reports/procurement-summary', roleMiddleware('admin', 'manager', 'procurement_officer'), reportController.getProcurementSummary);
router.get('/reports/spend-trend', roleMiddleware('admin', 'manager'), reportController.getSpendTrend);
router.get('/reports/vendor-performance', roleMiddleware('admin', 'manager', 'procurement_officer'), reportController.getVendorPerformance);
router.get('/reports/approval-analytics', roleMiddleware('admin', 'manager'), reportController.getApprovalAnalytics);
router.get('/reports/spend-by-category', roleMiddleware('admin', 'manager', 'procurement_officer'), reportController.getSpendByCategory);

router.post('/reports/export', roleMiddleware('admin', 'manager', 'procurement_officer'), reportController.exportReport);

router.get('/vendor/reports/performance', roleMiddleware('vendor'), reportController.getVendorMyPerformance);

module.exports = router;
