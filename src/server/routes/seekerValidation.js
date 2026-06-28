const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { validateCallAccess } = require('../middleware/callTracker');
const { createResponse } = require('../utils/response.utils');

// Expert consultation booking with call limit validation
router.post('/book-consultation', auth, validateCallAccess('intro_call_with_expert'), async (req, res) => {
  try {
    const { expertId, sessionDate, sessionTime } = req.body;
    
    // Proceed with booking logic
    res.json(createResponse(true, { 
      expertId, 
      sessionDate, 
      sessionTime,
      remaining: req.callInfo.remaining - 1 
    }, 'Consultation booked'));
  } catch (error) {
    res.status(500).json(createResponse(false, null, 'Booking failed'));
  }
});

// Expert profile search with access validation
router.get('/search-experts', auth, validateCallAccess('expert_profile_search'), async (req, res) => {
  try {
    // Search logic here
    res.json(createResponse(true, [], 'Search completed'));
  } catch (error) {
    res.status(500).json(createResponse(false, null, 'Search failed'));
  }
});

module.exports = router;