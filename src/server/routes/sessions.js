const express = require('express');
const router = express.Router();
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const auth = require('../middleware/auth');

// Generate Agora token for a session
router.get('/:id/token', auth, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.userId;
    
    // Get database connection
    const pool = req.app.locals.db;
    
    // Verify the user is part of this session
    const [bookings] = await pool.query(
      'SELECT * FROM bookings WHERE id = ? AND (expert_id = ? OR seeker_id = ?)',
      [sessionId, userId, userId]
    );
    
    if (bookings.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to join this session'
      });
    }
    
    const booking = bookings[0];
    
    // Check if the session is active (within time window)
    const sessionDate = new Date(`${booking.appointment_date}T${booking.start_time}`);
    const now = new Date();
    const sessionEnd = new Date(`${booking.appointment_date}T${booking.end_time}`);
    
    // Allow joining 5 minutes before start time
    const fiveMinutesBefore = new Date(sessionDate);
    fiveMinutesBefore.setMinutes(sessionDate.getMinutes() - 5);
    
    if (now < fiveMinutesBefore) {
      return res.status(400).json({
        success: false,
        message: 'Session is not available yet'
      });
    }
    
    if (now > sessionEnd) {
      return res.status(400).json({
        success: false,
        message: 'Session has ended'
      });
    }
    
    // Generate Agora token
    const appID = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    const channelName = sessionId;
    const uid = userId;
    const role = RtcRole.PUBLISHER;
    
    // Token expires in 2 hours
    const expirationTimeInSeconds = 7200;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    
    // Build token with uid
    const token = RtcTokenBuilder.buildTokenWithUid(
      appID,
      appCertificate,
      channelName,
      uid,
      role,
      privilegeExpiredTs
    );
    
    res.json({
      success: true,
      token: token
    });
  } catch (error) {
    console.error('Error generating Agora token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate token'
    });
  }
});

// Add this endpoint to generate tokens for specific session IDs
router.post('/token/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const { userId } = req.body;
  
  if (!sessionId || !userId) {
    return res.status(400).json({
      success: false,
      message: 'Session ID and User ID are required'
    });
  }
  
  try {
    // Get booking details to verify user is part of this session
    const [bookings] = await pool.query(
      `SELECT b.*, 
              DATE_FORMAT(b.appointment_date, '%Y-%m-%d') as date,
              TIME_FORMAT(b.start_time, '%H:%i:%s') as start_time,
              TIME_FORMAT(b.end_time, '%H:%i:%s') as end_time
       FROM bookings b
       WHERE b.id = ? AND (b.expert_id = ? OR b.seeker_id = ?)`,
      [sessionId, userId, userId]
    );
    
    if (bookings.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to join this session'
      });
    }
    
    const booking = bookings[0];
    
    // Check if the session is active (within time window)
    const sessionDate = new Date(`${booking.date}T${booking.start_time}`);
    const now = new Date();
    const sessionEnd = new Date(`${booking.date}T${booking.end_time}`);
    
    // Allow joining 5 minutes before start time
    const fiveMinutesBefore = new Date(sessionDate);
    fiveMinutesBefore.setMinutes(sessionDate.getMinutes() - 5);
    
    if (now < fiveMinutesBefore) {
      return res.status(400).json({
        success: false,
        message: 'Session is not available yet'
      });
    }
    
    if (now > sessionEnd) {
      return res.status(400).json({
        success: false,
        message: 'Session has ended'
      });
    }
    
    // Generate Agora token
    const appID = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    const channelName = sessionId;
    const uid = parseInt(userId.replace(/-/g, '').substring(0, 8), 16) % 100000000; // Convert UUID to numeric UID
    const role = RtcRole.PUBLISHER;
    
    // Token expires in 2 hours
    const expirationTimeInSeconds = 7200;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    
    // Build token with uid
    const token = RtcTokenBuilder.buildTokenWithUid(
      appID,
      appCertificate,
      channelName,
      uid,
      role,
      privilegeExpiredTs
    );
    
    res.json({
      success: true,
      token: token,
      uid: uid
    });
  } catch (error) {
    console.error('Error generating Agora token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate token'
    });
  }
});

module.exports = router;
