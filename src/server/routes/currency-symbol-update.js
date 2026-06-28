const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');

// Update all currency symbols in database based on user selection
router.post('/update-symbols', auth, async (req, res) => {
  try {
    const { currency } = req.body; // 'INR' or 'USD'
    const userId = req.user.id;
    
    if (!currency || !['INR', 'USD'].includes(currency)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid currency. Must be INR or USD'
      });
    }

    const symbol = currency === 'INR' ? '₹' : '$';
    
    // Update all tables with currency symbols
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update bookings table - replace symbols in amount display
      await connection.query(`
        UPDATE bookings 
        SET currency = ?
        WHERE expert_id = ? OR seeker_id = ?
      `, [currency, userId, userId]);

      // Update expert_profiles pricing
      await connection.query(`
        UPDATE expert_profiles 
        SET pricing_currency = ?
        WHERE user_id = ?
      `, [currency, userId]);

      // Update wallet transactions
      await connection.query(`
        UPDATE wallet_transactions wt
        JOIN wallets w ON wt.wallet_id = w.id
        SET wt.currency = ?
        WHERE w.user_id = ?
      `, [currency, userId]);

      // Update wallets
      await connection.query(`
        UPDATE wallets 
        SET currency = ?
        WHERE user_id = ?
      `, [currency, userId]);

      // Update withdrawal requests
      await connection.query(`
        UPDATE withdrawal_requests 
        SET currency = ?
        WHERE user_id = ?
      `, [currency, userId]);

      // Update user preferences
      await connection.query(`
        INSERT INTO user_currency_preferences (user_id, preferred_currency)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE preferred_currency = VALUES(preferred_currency)
      `, [userId, currency]);

      await connection.commit();
      
      res.json({
        success: true,
        message: `All currency symbols updated to ${symbol}`,
        data: { currency, symbol }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error updating currency symbols:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update currency symbols',
      error: error.message
    });
  }
});

module.exports = router;