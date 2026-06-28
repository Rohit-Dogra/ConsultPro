const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get user preferences - check both new and old tables
router.get('/preferences', auth, async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const pool = req.app.locals.db;
    
    // Create tables if they don't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_currency_preferences (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        preferred_currency VARCHAR(10) DEFAULT 'INR',
        timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS currency_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        currency_code VARCHAR(10) NOT NULL UNIQUE,
        currency_name VARCHAR(100) NOT NULL,
        currency_symbol VARCHAR(10) NOT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Insert default currencies if table is empty
    const [currencyCount] = await pool.query('SELECT COUNT(*) as count FROM currency_settings');
    if (currencyCount[0].count === 0) {
      await pool.execute(`
        INSERT INTO currency_settings (currency_code, currency_name, currency_symbol) VALUES
        ('INR', 'Indian Rupee', '₹'),
        ('USD', 'US Dollar', '$'),
        ('EUR', 'Euro', '€'),
        ('GBP', 'British Pound', '£')
      `);
    }
    
    // First try to get from new user_currency_preferences table
    let [prefRows] = await pool.query(`
      SELECT 
        ucp.preferred_currency as currency,
        ucp.timezone,
        cs.currency_symbol,
        cs.currency_name
      FROM user_currency_preferences ucp
      LEFT JOIN currency_settings cs ON ucp.preferred_currency = cs.currency_code
      WHERE ucp.user_id = ?
    `, [userId]);
    
    // If not found in new table, check old users table
    if (prefRows.length === 0) {
      try {
        const [userRows] = await pool.query(`
          SELECT currency, timezone FROM users WHERE id = ? LIMIT 1
        `, [userId]);
        
        if (userRows.length > 0 && (userRows[0].currency || userRows[0].timezone)) {
          // Migrate to new table
          await pool.query(`
            INSERT INTO user_currency_preferences (user_id, preferred_currency, timezone)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE 
              preferred_currency = VALUES(preferred_currency),
              timezone = VALUES(timezone)
          `, [userId, userRows[0].currency || 'INR', userRows[0].timezone || 'Asia/Kolkata']);
          
          // Re-fetch from new table
          [prefRows] = await pool.query(`
            SELECT 
              ucp.preferred_currency as currency,
              ucp.timezone,
              cs.currency_symbol,
              cs.currency_name
            FROM user_currency_preferences ucp
            LEFT JOIN currency_settings cs ON ucp.preferred_currency = cs.currency_code
            WHERE ucp.user_id = ?
          `, [userId]);
        }
      } catch (error) {
        console.log('Old users table structure, creating new preferences');
      }
    }
    
    if (prefRows.length === 0) {
      // Return default preferences
      return res.status(200).json({
        success: true,
        data: {
          currency: null,
          timezone: null,
          currency_symbol: null,
          currency_name: null
        }
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        currency: prefRows[0].currency,
        timezone: prefRows[0].timezone,
        currency_symbol: prefRows[0].currency_symbol,
        currency_name: prefRows[0].currency_name
      }
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user preferences',
      error: error.message
    });
  }
});

// Update user preferences
router.put('/preferences', auth, async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const pool = req.app.locals.db;
    const { currency, timezone } = req.body;
    
    if (!currency || !timezone) {
      return res.status(400).json({
        success: false,
        message: 'Currency and timezone are required'
      });
    }
    
    console.log(`Updating preferences for user ${userId}: Currency=${currency}, Timezone=${timezone}`);
    
    // Verify currency exists in currency_settings
    const [currencyCheck] = await pool.query(`
      SELECT currency_code FROM currency_settings 
      WHERE currency_code = ? AND is_active = TRUE
    `, [currency]);
    
    if (currencyCheck.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid currency code'
      });
    }
    
    // Update in new user_currency_preferences table
    await pool.query(`
      INSERT INTO user_currency_preferences (user_id, preferred_currency, timezone)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        preferred_currency = VALUES(preferred_currency),
        timezone = VALUES(timezone)
    `, [userId, currency, timezone]);
    
    // Also update users table for backward compatibility
    try {
      await pool.query(
        'UPDATE users SET currency = ?, timezone = ? WHERE id = ?',
        [currency, timezone, userId]
      );
    } catch (userUpdateError) {
      console.log('Users table update failed, continuing with new table only');
    }
    
    return res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        currency,
        timezone
      }
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user preferences',
      error: error.message
    });
  }
});



module.exports = router;