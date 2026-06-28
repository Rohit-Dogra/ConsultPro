const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { validateSeekerAccess } = require('../middleware/seekerValidator');
const { createResponse } = require('../utils/response.utils');

// Submit consultation request (no auth required)
router.post('/requests', async (req, res) => {
  try {
    const { firstName, lastName, email, mobile, userType, whatsappConsent, termsAccepted } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !email || !mobile || !userType) {
      return res.status(400).json(createResponse(false, null, 'All required fields must be provided'));
    }
    
    // Create/update table to include email and support aspiring-entrepreneur
    await req.app.locals.db.execute(`
      CREATE TABLE IF NOT EXISTS consultation_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        mobile VARCHAR(20) NOT NULL,
        user_type ENUM('solution-seeker', 'expert', 'aspiring-entrepreneur') NOT NULL,
        whatsapp_consent TINYINT(1) DEFAULT 0,
        terms_accepted TINYINT(1) DEFAULT 0,
        status ENUM('pending', 'contacted', 'completed', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Add email column if it doesn't exist (for existing tables)
    try {
      await req.app.locals.db.execute(`ALTER TABLE consultation_requests ADD COLUMN email VARCHAR(255) NOT NULL AFTER last_name`);
    } catch (error) {
      // Column already exists, ignore error
    }
    
    // Update user_type enum to include aspiring-entrepreneur
    try {
      await req.app.locals.db.execute(`ALTER TABLE consultation_requests MODIFY COLUMN user_type ENUM('solution-seeker', 'expert', 'aspiring-entrepreneur') NOT NULL`);
    } catch (error) {
      // Already updated, ignore error
    }
    
    // Insert consultation request
    const [result] = await req.app.locals.db.execute(`
      INSERT INTO consultation_requests (first_name, last_name, email, mobile, user_type, whatsapp_consent, terms_accepted)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [firstName, lastName, email, mobile, userType, whatsappConsent ? 1 : 0, termsAccepted ? 1 : 0]);
    
    res.json(createResponse(true, { id: result.insertId }, 'Consultation request submitted successfully'));
  } catch (error) {
    console.error('Consultation request error:', error);
    res.status(500).json(createResponse(false, null, 'Failed to submit consultation request'));
  }
});

// Book consultation with call limit validation
router.post('/book', auth, validateSeekerAccess('intro_call_with_expert'), async (req, res) => {
  try {
    const { expertId, sessionDate, sessionTime } = req.body;
    const userId = req.user.user_id;
    
    // Insert booking logic here
    const [result] = await req.app.locals.db.execute(`
      INSERT INTO consultations (user_id, expert_id, session_date, session_time, status)
      VALUES (?, ?, ?, ?, 'scheduled')
    `, [userId, expertId, sessionDate, sessionTime]);
    
    res.json(createResponse(true, { 
      id: result.insertId,
      remaining: req.usageInfo.remaining - 1 
    }, 'Consultation booked'));
  } catch (error) {
    res.status(500).json(createResponse(false, null, 'Booking failed'));
  }
});

module.exports = router;