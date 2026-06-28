const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = req.app.locals.db;
    
    console.log(`Fetching user with ID: ${id}`);
    
    let userId = id;
    
    // First, check if this ID exists in users table directly
    const [directUsers] = await pool.query(
      `SELECT id, name, email, role FROM users WHERE id = ?`,
      [id]
    );
    
    if (directUsers.length === 0) {
      // ID not found in users table, check profile tables
      console.log(`ID ${id} not found in users table, checking profile tables...`);
      
      // Check expert_profiles table
      const [expertProfiles] = await pool.query(
        `SELECT user_id FROM expert_profiles WHERE id = ?`,
        [id]
      );
      
      if (expertProfiles.length > 0) {
        userId = expertProfiles[0].user_id;
        console.log(`Found user_id ${userId} in expert_profiles`);
      } else {
        // Check seeker_profiles table
        const [seekerProfiles] = await pool.query(
          `SELECT user_id FROM seeker_profiles WHERE id = ?`,
          [id]
        );
        
        if (seekerProfiles.length > 0) {
          userId = seekerProfiles[0].user_id;
          console.log(`Found user_id ${userId} in seeker_profiles`);
        } else {
          console.log(`ID ${id} not found in any table`);
          return res.status(404).json({ success: false, message: 'User not found' });
        }
      }
    }
    
    // Now fetch the user details using the correct user_id
    const [users] = await pool.query(
      `SELECT id, name, email, role, profile_picture, 
       COALESCE(subscription_status, 'inactive') as subscription_status 
       FROM users WHERE id = ?`,
      [userId]
    );
    
    if (users.length === 0) {
      console.log(`User with ID ${userId} not found in users table`);
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    console.log('User found:', users[0]);
    res.json(users[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user', error: error.message });
  }
});

// Update user data
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const pool = req.app.locals.db;
    
    console.log(`Updating user ${id} with data:`, updateData);
    
    // First, ensure the required columns exist
    const columnsToAdd = [
      { name: 'subscription_status', definition: "ENUM('inactive', 'trial', 'active', 'canceled', 'expired') DEFAULT 'inactive'" },
      { name: 'plan_name', definition: 'VARCHAR(100) NULL' },
      { name: 'plan_key', definition: 'VARCHAR(50) NULL' },
      { name: 'current_plan_id', definition: 'INT NULL' },
      { name: 'subscription_start_date', definition: 'DATETIME NULL' },
      { name: 'subscription_end_date', definition: 'DATETIME NULL' },
      { name: 'trial_used', definition: 'BOOLEAN DEFAULT FALSE' }
    ];
    
    for (const column of columnsToAdd) {
      try {
        await pool.query(`ALTER TABLE users ADD COLUMN ${column.name} ${column.definition}`);
        console.log(`Added column: ${column.name}`);
      } catch (error) {
        if (error.code !== 'ER_DUP_FIELDNAME') {
          console.log(`Column ${column.name} might already exist or error:`, error.message);
        }
      }
    }
    
    // Build dynamic update query - ensure all subscription fields are allowed
    const allowedFields = [
      'subscription_status', 'plan_name', 'plan_key', 'current_plan_id', 
      'subscription_start_date', 'subscription_end_date', 'trial_used'
    ];
    
    console.log('Allowed fields for update:', allowedFields);
    console.log('Received update data:', updateData);
    
    const updateFields = [];
    const updateValues = [];
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }
    
    updateValues.push(id);
    
    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    console.log('Update query:', query, 'Values:', updateValues);
    
    const [result] = await pool.query(query, updateValues);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    console.log('User updated successfully:', result);
    res.json({ success: true, message: 'User updated successfully', affectedRows: result.affectedRows });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
  }
});

module.exports = router;

