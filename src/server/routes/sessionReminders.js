const express = require('express');
const { sendSessionReminderEmail } = require('../utils/emailService');
const router = express.Router();

/**
 * Send session reminders for upcoming sessions
 * This should be called by a cron job every minute
 */
router.post('/send-reminders', async (req, res) => {
  try {
    const pool = req.app.locals.db;
    
    // Get sessions that are starting in 10 minutes and are confirmed
    const [upcomingSessions] = await pool.query(
      `SELECT b.*, 
              u1.name as seeker_name, u1.email as seeker_email,
              u2.name as expert_name, u2.email as expert_email
       FROM bookings b
       JOIN users u1 ON b.seeker_id = u1.id
       JOIN users u2 ON b.expert_id = u2.id
       WHERE b.status = 'confirmed'
       AND b.appointment_date = CURDATE()
       AND b.start_time BETWEEN 
         TIME_SUB(NOW(), INTERVAL 11 MINUTE) 
         AND TIME_SUB(NOW(), INTERVAL 9 MINUTE)
       AND b.reminder_sent = FALSE`,
      []
    );

    console.log(`Found ${upcomingSessions.length} sessions needing reminders`);

    let successCount = 0;
    let errorCount = 0;

    for (const session of upcomingSessions) {
      try {
        // Send reminder to seeker
        await sendSessionReminderEmail(session.seeker_id, session.id);
        console.log(`Reminder sent to seeker ${session.seeker_id} for session ${session.id}`);

        // Send reminder to expert
        await sendSessionReminderEmail(session.expert_id, session.id);
        console.log(`Reminder sent to expert ${session.expert_id} for session ${session.id}`);

        // Mark reminder as sent
        await pool.query(
          'UPDATE bookings SET reminder_sent = TRUE WHERE id = ?',
          [session.id]
        );

        successCount++;
      } catch (error) {
        console.error(` Failed to send reminder for session ${session.id}:`, error);
        errorCount++;
      }
    }

    res.json({
      success: true,
      message: `Session reminders processed: ${successCount} successful, ${errorCount} failed`,
      data: {
        totalSessions: upcomingSessions.length,
        successCount,
        errorCount
      }
    });

  } catch (error) {
    console.error('Error sending session reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send session reminders'
    });
  }
});

/**
 * Manually send reminder for a specific session
 */
router.post('/send-reminder/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const pool = req.app.locals.db;

    // Get session details
    const [sessions] = await pool.query(
      `SELECT b.*, 
              u1.name as seeker_name, u1.email as seeker_email,
              u2.name as expert_name, u2.email as expert_email
       FROM bookings b
       JOIN users u1 ON b.seeker_id = u1.id
       JOIN users u2 ON b.expert_id = u2.id
       WHERE b.id = ? AND b.status = 'confirmed'`,
      [bookingId]
    );

    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or not confirmed'
      });
    }

    const session = sessions[0];

    // Send reminder to seeker
    await sendSessionReminderEmail(session.seeker_id, session.id);
    console.log(` Manual reminder sent to seeker ${session.seeker_id} for session ${session.id}`);

    // Send reminder to expert
    await sendSessionReminderEmail(session.expert_id, session.id);
    console.log(` Manual reminder sent to expert ${session.expert_id} for session ${session.id}`);

    // Mark reminder as sent
    await pool.query(
      'UPDATE bookings SET reminder_sent = TRUE WHERE id = ?',
      [session.id]
    );

    res.json({
      success: true,
      message: 'Session reminders sent successfully'
    });

  } catch (error) {
    console.error('Error sending manual session reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send session reminder'
    });
  }
});

module.exports = router; 