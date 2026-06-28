const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Create consultation request
router.post('/', async (req, res) => {
  let connection;
  try {
    const { user_id, email, name, problems, outcomes, functionality, phone, expert_id } = req.body;
    
    // Debug logging
    console.log('Consultation request data:', {
      user_id,
      expert_id,
      email,
      name,
      functionality
    });
    
    if (!email || !name || !problems || !outcomes || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    connection = await pool.getConnection();
    
    // Ensure users table has Google OAuth columns
    try {
      await connection.execute(`ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE NULL`);
      console.log('✅ Added google_id column to users table');
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') {
        console.log('Google ID column error:', error.message);
      }
    }
    
    try {
      await connection.execute(`ALTER TABLE users ADD COLUMN profile_picture VARCHAR(500) NULL`);
      console.log('✅ Added profile_picture column to users table');
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') {
        console.log('Profile picture column error:', error.message);
      }
    }
    
    // Make password nullable
    try {
      await connection.execute(`ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL`);
    } catch (error) {
      console.log('Password column already nullable or error:', error.message);
    }
    
    // Create user_consultation_requests table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_consultation_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255) NULL,
        expert_id VARCHAR(36) DEFAULT NULL,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        problems TEXT NOT NULL,
        outcomes TEXT NOT NULL,
        functionality VARCHAR(255) NULL,
        phone VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Add expert_id column if it doesn't exist (for existing tables)
    try {
      await connection.execute(`ALTER TABLE user_consultation_requests ADD COLUMN expert_id VARCHAR(36) DEFAULT NULL AFTER user_id`);
      console.log('✅ Added expert_id column to user_consultation_requests table');
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') {
        console.log('Expert ID column error:', error.message);
      }
    }
    console.log('✅ User consultation requests table created/verified with expert_id column');
    
    // Check if user already has a consultation request
    const [existingRows] = await connection.execute(
      `SELECT id FROM user_consultation_requests WHERE user_id = ?`,
      [user_id || null]
    );
    
    let result;
    if (existingRows.length > 0) {
      // Update existing record
      console.log('Updating existing consultation request for user:', user_id);
      [result] = await connection.execute(
        `UPDATE user_consultation_requests 
         SET expert_id = ?, email = ?, name = ?, problems = ?, outcomes = ?, functionality = ?, phone = ?, created_at = NOW()
         WHERE user_id = ?`,
        [expert_id || null, email, name, problems, outcomes, functionality || null, phone, user_id || null]
      );
      console.log('✅ Consultation request updated for user:', user_id);
    } else {
      // Insert new record
      console.log('Inserting new consultation request with values:', [user_id || null, expert_id || null, email, name, problems, outcomes, functionality || null, phone]);
      [result] = await connection.execute(
        `INSERT INTO user_consultation_requests 
         (user_id, expert_id, email, name, problems, outcomes, functionality, phone, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [user_id || null, expert_id || null, email, name, problems, outcomes, functionality || null, phone]
      );
      console.log('✅ Consultation request inserted with ID:', result.insertId);
    }
    
    res.status(201).json({
      success: true,
      message: existingRows.length > 0 ? 'Consultation request updated successfully' : 'Consultation request submitted successfully',
      id: result.insertId || existingRows[0]?.id,
      debug: {
        user_id: user_id || null,
        expert_id: expert_id || null,
        action: existingRows.length > 0 ? 'updated' : 'created'
      }
    });
    
  } catch (error) {
    console.error('Error creating consultation request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit consultation request',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;