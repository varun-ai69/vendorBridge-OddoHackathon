const { pool } = require('../db/db');
const { sendSuccess } = require('../utils/response');
const catchAsync = require('../utils/catchAsync');

/**
 * 10.1 Get Activity Log (Global)
 */
exports.getActivityLogs = catchAsync(async (req, res, next) => {
  const orgId = req.user.org_id;
  const { entity_type, entity_id, user_id, date_from, date_to, page = 1, limit = 20 } = req.query;

  const offset = (page - 1) * limit;
  const values = [orgId];
  let whereClauses = ['al.org_id = $1'];
  let count = 2;

  if (entity_type) { whereClauses.push(`al.entity_type = $${count}`); values.push(entity_type); count++; }
  if (entity_id) { whereClauses.push(`al.entity_id = $${count}`); values.push(entity_id); count++; }
  if (user_id) { whereClauses.push(`al.user_id = $${count}`); values.push(user_id); count++; }
  if (date_from) { whereClauses.push(`al.created_at >= $${count}`); values.push(date_from); count++; }
  if (date_to) { whereClauses.push(`al.created_at <= $${count}`); values.push(date_to); count++; }

  const dbString = whereClauses.join(' AND ');

  const countRes = await pool.query(`SELECT COUNT(*) FROM audit_logs al WHERE ${dbString}`, values);
  const total = parseInt(countRes.rows[0].count, 10);

  const query = `
    SELECT 
      al.id AS log_id, al.entity_type, al.entity_id, '' AS entity_ref, 
      al.action, '' AS description, u.name AS performed_by, u.role, 
      al.created_at AS timestamp, al.ip_address
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE ${dbString}
    ORDER BY al.created_at DESC
    LIMIT $${count} OFFSET $${count + 1}
  `;
  const result = await pool.query(query, [...values, limit, offset]);

  sendSuccess(res, 200, 'Activity logs fetched', { 
    logs: result.rows, total, page: Number(page), limit: Number(limit) 
  });
});

/**
 * 10.2 Get My Notifications
 */
exports.getNotifications = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const orgId = req.user.org_id;
  const { is_read, type, page = 1, limit = 10 } = req.query;

  const offset = (page - 1) * limit;
  const values = [userId, orgId];
  let whereClauses = ['user_id = $1', 'org_id = $2'];
  let count = 3;

  if (is_read !== undefined) {
    whereClauses.push(`is_read = $${count}`);
    values.push(is_read === 'true');
    count++;
  }
  if (type) {
    whereClauses.push(`type = $${count}`);
    values.push(type);
    count++;
  }

  const dbString = whereClauses.join(' AND ');

  const countRes = await pool.query(`SELECT COUNT(*) FROM notifications WHERE ${dbString}`, values);
  const total = parseInt(countRes.rows[0].count, 10);

  const unreadRes = await pool.query('SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND org_id = $2 AND is_read = false', [userId, orgId]);
  const unreadCount = parseInt(unreadRes.rows[0].count, 10);

  const query = `
    SELECT id, type, title, message, entity_type, entity_id, is_read, created_at
    FROM notifications
    WHERE ${dbString}
    ORDER BY created_at DESC
    LIMIT $${count} OFFSET $${count + 1}
  `;
  const dataRes = await pool.query(query, [...values, limit, offset]);

  sendSuccess(res, 200, 'Notifications fetched', {
    notifications: dataRes.rows,
    unread_count: unreadCount,
    total,
    page: Number(page),
    limit: Number(limit)
  });
});

/**
 * 10.3 Mark Notification as Read
 */
exports.markNotificationRead = catchAsync(async (req, res, next) => {
  const { notificationId } = req.params;
  const userId = req.user.id;
  
  await pool.query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [notificationId, userId]);
  sendSuccess(res, 200, 'Notification marked as read');
});

/**
 * 10.4 Mark All Notifications as Read
 */
exports.markAllNotificationsRead = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const orgId = req.user.org_id;

  await pool.query('UPDATE notifications SET is_read = true WHERE user_id = $1 AND org_id = $2 AND is_read = false', [userId, orgId]);
  sendSuccess(res, 200, 'All notifications marked as read');
});

/**
 * 10.5 Get Unread Notification Count
 */
exports.getUnreadCount = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const orgId = req.user.org_id;

  const countRes = await pool.query('SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND org_id = $2 AND is_read = false', [userId, orgId]);
  sendSuccess(res, 200, 'Unread count fetched', { unread_count: parseInt(countRes.rows[0].count, 10) });
});
