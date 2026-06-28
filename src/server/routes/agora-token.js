const express = require('express');
const router = express.Router();
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');


// Get credentials from environment variables with fallbacks
const APP_ID = process.env.AGORA_APP_ID || 'ce0203f2478e435cb7aae5509ee3a212';
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || '9f47004e66d24e11a30bea87b08d1ce5';

router.post('/generate', (req, res) => {
  const { channelName, uid } = req.body;

  if (!channelName || !uid) {
    return res.status(400).json({ error: 'channelName and uid are required' });
  }

  // Token expiration time in seconds (e.g., 1 hour)
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  try {
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs
    );

    return res.json({ token });
  } catch (error) {
    console.error('Error generating Agora token:', error);
    return res.status(500).json({ error: 'Failed to generate token' });
  }
});

module.exports = router;

