const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Create post inquiry
router.post('/', async (req, res) => {
  try {
    const { post_id, name, email, phone, description } = req.body;
    const id = uuidv4();
    
    await pool.execute(
      'INSERT INTO post_inquiries (id, post_id, name, email, phone, description) VALUES (?, ?, ?, ?, ?, ?)',
      [id, post_id, name, email, phone, description]
    );
    
    res.json({ success: true, message: 'Inquiry sent successfully!' });
  } catch (error) {
    console.error('Error creating inquiry:', error);
    res.status(500).json({ error: 'Failed to send inquiry' });
  }
});

module.exports = router;