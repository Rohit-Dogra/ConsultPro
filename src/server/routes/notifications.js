// src/server/routes/notifications.js

const express = require('express');
const router = express.Router();
const admin = require('../firebase-admin-init'); // Proper Firebase Admin init

// Get notifications for a user
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  console.log('Fetching notifications for user:', userId);

  try {
    const pool = req.app.locals.db;

    const [notifications] = await pool.query(
      `SELECT id, type, message, related_id, 
              COALESCE(read_status, FALSE) as read_status, 
              COALESCE(status_color, 'default') as status_color,
              created_at 
       FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );

    console.log(`Found ${notifications.length} notifications for user ${userId}`);
    res.json({ success: true, data: notifications });

  } catch (error) {
    console.error('Error in notifications endpoint:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: error.message });
  }
});

// Mark notification as read (single)
router.put('/:id/read', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = req.app.locals.db;
    await pool.query('UPDATE notifications SET read_status = TRUE WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/:userId/read-all', async (req, res) => {
  const { userId } = req.params;
  try {
    const pool = req.app.locals.db;
    await pool.query('UPDATE notifications SET read_status = TRUE WHERE user_id = ? AND read_status = FALSE', [userId]);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark all notifications as read' });
  }
});

// Create a new notification
router.post('/', async (req, res) => {
  const { user_id, type, message, related_id, user_role } = req.body;

  if (!user_id || !type || !message || !user_role) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const pool = req.app.locals.db;

    const [result] = await pool.query(
      'INSERT INTO notifications (user_id, type, message, related_id, created_at) VALUES (?, ?, ?, ?, NOW())',
      [user_id, type, message, related_id || null]
    );

    const notificationSent = await sendPushNotification(pool, user_id, type, message, related_id, user_role);

    res.json({ 
      success: true, 
      notificationId: result.insertId,
      notificationSent 
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ success: false, message: 'Failed to create notification' });
  }
});

// Helper: Notification title based on type
function getNotificationTitle(type) {
  const titles = {
    'booking': 'New Booking Request',
    'booking_status': 'Booking Status Update',
    'booking_reschedule': 'Booking Rescheduled',
    'session_reminder': 'Session Reminder',
    'message': 'New Message',
    'session_accepted': 'Session Accepted',
    'session_rejected': 'Session Rejected',
    'session_cancelled': 'Session Cancelled',
    'session_rescheduled': 'Session Rescheduled'
  };
  return titles[type] || 'New Notification';
}

// Send Push Notification (FCM)
async function sendPushNotification(pool, userId, type, message, relatedId, userRole) {
  console.log(` Sending push notification to user ${userId}`);

  try {
    const [tokens] = await pool.query(
      'SELECT token FROM notification_tokens WHERE user_id = ?',
      [userId]
    );

    if (tokens.length === 0) {
      console.log(` No notification tokens found for user ${userId}`);
      return false;
    }

    const notification = {
      notification: {
        title: getNotificationTitle(type),
        body: message,
      },
      data: {
        type,
        related_id: relatedId || '',
        user_role: userRole || '',
        click_action: '/appointment-log',
        tag: type
      },
      token: tokens[0].token
    };

    console.log(` Sending FCM to token: ${tokens[0].token.substring(0, 20)}...`);

    const response = await admin.messaging().send(notification);
    console.log(' Notification sent:', response);
    return true;

  } catch (error) {
    console.error(' Error sending FCM notification:', error);
    return false;
  }
}

// Store FCM token
router.post('/users/:userId/notification-token', async (req, res) => {
  const { userId } = req.params;
  const { token } = req.body;

  if (!userId || !token) {
    return res.status(400).json({ success: false, error: 'Missing userId or token' });
  }

  try {
    const pool = req.app.locals.db;

    const [userCheck] = await pool.query(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );

    if (userCheck.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await pool.query(
      `INSERT INTO notification_tokens (user_id, token) 
       VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE token = ?, updated_at = CURRENT_TIMESTAMP`,
      [userId, token, token]
    );

    res.json({ success: true, message: 'Notification token updated successfully' });
  } catch (error) {
    console.error('Error updating notification token:', error);
    res.status(500).json({ success: false, error: 'Failed to update notification token' });
  }
});

module.exports = router;
module.exports.sendPushNotification = sendPushNotification;
