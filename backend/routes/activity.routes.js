const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

// Admin / Manager Audit Access
router.get(
  '/activity-logs', 
  roleMiddleware('admin', 'manager'), 
  activityController.getActivityLogs
);

// All roles cross-mapped for notification access
router.get('/notifications', activityController.getNotifications);
router.patch('/notifications/:notificationId/read', activityController.markNotificationRead);
router.patch('/notifications/read-all', activityController.markAllNotificationsRead);
router.get('/notifications/unread-count', activityController.getUnreadCount);

module.exports = router;
