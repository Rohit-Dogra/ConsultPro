const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { CallTracker, validateCallAccess } = require('../middleware/callTracker');
const { createResponse } = require('../utils/response.utils');

// Start expert consultation call
router.post('/start-consultation', auth, validateCallAccess('intro_call_with_expert'), async (req, res) => {
  try {
    const tracker = new CallTracker(req.app.locals.db);
    await tracker.trackCall(req.user.user_id, 'intro_call_with_expert');
    
    res.json(createResponse(true, {
      callAllowed: true,
      remaining: req.callInfo.remaining - 1
    }, 'Call started'));
  } catch (error) {
    res.status(500).json(createResponse(false, null, 'Failed to start call'));
  }
});

// Get usage stats
router.get('/usage/:featureKey', auth, async (req, res) => {
  try {
    const tracker = new CallTracker(req.app.locals.db);
    const result = await tracker.checkCallLimit(req.user.user_id, req.params.featureKey);
    
    res.json(createResponse(true, result, 'Usage retrieved'));
  } catch (error) {
    res.status(500).json(createResponse(false, null, 'Failed to get usage'));
  }
});

module.exports = router;