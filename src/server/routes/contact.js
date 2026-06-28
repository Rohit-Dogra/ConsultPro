const express = require('express');
const router = express.Router();
// Fix the import - remove the destructuring
const pool = require('../config/database');

router.post('/', async (req, res) => {
  let connection;
  try {
    console.log('📧 Received contact form data:', req.body);
    const { name, email, phone, message } = req.body;

    // Input validation
    if (!name?.trim() || !email?.trim() || !phone?.trim() || !message?.trim()) {
      console.log('❌ Validation failed - missing fields');
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    console.log('🔌 Getting database connection...');
    connection = await pool.getConnection();
    console.log('Database connection established');

    // Insert the contact message
    const [result] = await connection.execute(
      `INSERT INTO contact_messages (
        name, 
        email, 
        phone, 
        message, 
        status,
        created_at
      ) VALUES (?, ?, ?, ?, 'pending', NOW())`,
      [
        name.trim(),
        email.toLowerCase().trim(),
        phone.trim(),
        message.trim()
      ]
    );

    console.log('Message stored successfully, ID:', result.insertId);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('❌ Contact form submission error:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage
    });

    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (connection) {
      connection.release();
      console.log('🔌 Database connection released');
    }
  }
});

module.exports = router;