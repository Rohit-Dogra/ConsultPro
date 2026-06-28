const express = require('express');
const router = express.Router();
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

// Add a test route to verify this file is loaded
router.get('/test', (req, res) => {
  res.json({ message: 'Agora routes are working!' });
});

// Generate Agora token and mark user as joined
router.post('/token', async (req, res) => {
  const pool = req.app.locals.db;
  try {
    const { channelName, uid } = req.body;
    
    if (!channelName || !uid) {
      return res.status(400).json({
        success: false,
        message: 'Channel name (bookingId) and user ID are required'
      });
    }

    // Check if Agora credentials are configured
    const appID = process.env.AGORA_APP_ID || 'ce0203f2478e435cb7aae5509ee3a212';
    const appCertificate = process.env.AGORA_APP_CERTIFICATE || '9f47004e66d24e11a30bea87b08d1ce5';
    
    if (!appID || !appCertificate) {
      console.error('Agora credentials not configured');
      return res.status(500).json({
        success: false,
        message: 'Agora service not configured'
      });
    }

    const bookingId = channelName; // channelName is the bookingId

    // 1. Find the booking and check if the user is part of it.
    const [bookingResult] = await pool.query(
      'SELECT * FROM bookings WHERE id = ?',
      [bookingId]
    );

    if (bookingResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    const booking = bookingResult[0];

    // 2. Verify user is authorized for this booking
    if (uid !== booking.expert_id && uid !== booking.seeker_id) {
      return res.status(403).json({ success: false, message: 'User not authorized for this booking' });
    }

    console.log(`Token requested for booking ${bookingId} by user ${uid}`);

    // 2. Generate Agora token
    const numericUid = parseInt(uid.toString().replace(/[^0-9]/g, '').substring(0, 8), 10) % 1000000;
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 7200; // 2 hours
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appID,
      appCertificate,
      channelName,
      numericUid,
      role,
      privilegeExpiredTs
    );
    
    console.log(`Token generated successfully for channel: ${channelName}, uid: ${numericUid}`);
    
    res.json({
      success: true,
      token: token,
      uid: numericUid,
      appId: appID
    });

  } catch (error) {
    console.error('Error generating Agora token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate token',
      error: error.message
    });
  }
});

module.exports = router;






