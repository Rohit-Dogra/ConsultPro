const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');

// Get available currencies and current conversion rates
router.get('/', auth, async (req, res) => {
  try {
    // Get available currencies
    const [currencies] = await pool.query(`
      SELECT currency_code as code, currency_symbol as symbol, currency_name as name, is_active
      FROM currency_settings 
      WHERE is_active = TRUE
      ORDER BY currency_code
    `);

    // Get current conversion rates (latest available)
    const [rates] = await pool.query(`
      SELECT from_currency, to_currency, rate, date, created_at
      FROM currency_conversion_rates 
      ORDER BY date DESC, created_at DESC, from_currency, to_currency
    `);

    res.json({
      success: true,
      data: {
        currencies,
        rates
      }
    });
  } catch (error) {
    console.error('Error fetching currencies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch currencies',
      error: error.message
    });
  }
});

// Convert currency amount
router.post('/convert', auth, async (req, res) => {
  try {
    const { amount, from_currency, to_currency } = req.body;

    if (!amount || !from_currency || !to_currency) {
      return res.status(400).json({
        success: false,
        message: 'Amount, from_currency, and to_currency are required'
      });
    }

    // If same currency, no conversion needed
    if (from_currency === to_currency) {
      return res.json({
        success: true,
        data: {
          original_amount: amount,
          converted_amount: amount,
          from_currency,
          to_currency,
          rate: 1.0
        }
      });
    }

    // Get conversion rate (get latest rate by date)
    let [rateResult] = await pool.query(`
      SELECT rate FROM currency_conversion_rates
      WHERE from_currency = ? AND to_currency = ?
      ORDER BY date DESC, created_at DESC
      LIMIT 1
    `, [from_currency, to_currency]);

    let conversionRate = null;
    let isReverse = false;

    if (rateResult.length > 0) {
      conversionRate = rateResult[0].rate;
    } else {
      // Try reverse rate
      [rateResult] = await pool.query(`
        SELECT rate FROM currency_conversion_rates
        WHERE from_currency = ? AND to_currency = ?
        ORDER BY date DESC, created_at DESC
        LIMIT 1
      `, [to_currency, from_currency]);

      if (rateResult.length > 0) {
        conversionRate = 1 / rateResult[0].rate;
        isReverse = true;
      }
    }

    // If no rate found, use default rates
    if (!conversionRate) {
      const defaultRates = {
        'INR_USD': 0.012,
        'USD_INR': 83.0
      };
      
      const rateKey = `${from_currency}_${to_currency}`;
      conversionRate = defaultRates[rateKey] || 1.0;
    }

    const convertedAmount = parseFloat((amount * conversionRate).toFixed(2));

    res.json({
      success: true,
      data: {
        original_amount: amount,
        converted_amount: convertedAmount,
        from_currency,
        to_currency,
        rate: conversionRate,
        is_reverse_rate: isReverse
      }
    });

  } catch (error) {
    console.error('Error converting currency:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to convert currency',
      error: error.message
    });
  }
});

// Update conversion rates (admin only)
router.put('/rates', auth, async (req, res) => {
  try {
    const { rates } = req.body;

    if (!rates || !Array.isArray(rates)) {
      return res.status(400).json({
        success: false,
        message: 'Rates array is required'
      });
    }

    // Insert or update rates for today
    for (const rate of rates) {
      const { from_currency, to_currency, rate: conversionRate } = rate;
      
      if (!from_currency || !to_currency || !conversionRate) {
        continue;
      }

      await pool.query(`
        INSERT INTO currency_conversion_rates (from_currency, to_currency, rate, date)
        VALUES (?, ?, ?, CURDATE())
        ON DUPLICATE KEY UPDATE rate = VALUES(rate), created_at = NOW()
      `, [from_currency, to_currency, conversionRate]);
    }

    res.json({
      success: true,
      message: 'Conversion rates updated successfully'
    });

  } catch (error) {
    console.error('Error updating conversion rates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update conversion rates',
      error: error.message
    });
  }
});

// Get user's currency preference
router.get('/user-preference', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [result] = await pool.query(`
      SELECT 
        ucp.preferred_currency,
        ucp.timezone,
        cs.currency_symbol,
        cs.currency_name
      FROM user_currency_preferences ucp
      LEFT JOIN currency_settings cs ON ucp.preferred_currency = cs.currency_code
      WHERE ucp.user_id = ?
    `, [userId]);

    if (result.length === 0) {
      // Return default preference
      return res.json({
        success: true,
        data: {
          preferred_currency: 'INR',
          timezone: 'Asia/Kolkata',
          currency_symbol: '₹',
          currency_name: 'Indian Rupee'
        }
      });
    }

    res.json({
      success: true,
      data: result[0]
    });

  } catch (error) {
    console.error('Error fetching user currency preference:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user currency preference',
      error: error.message
    });
  }
});

// Update user's currency preference
router.put('/user-preference', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { preferred_currency, timezone } = req.body;

    if (!preferred_currency) {
      return res.status(400).json({
        success: false,
        message: 'Preferred currency is required'
      });
    }

    // Verify currency exists
    const [currencyCheck] = await pool.query(`
      SELECT currency_code FROM currency_settings 
      WHERE currency_code = ? AND is_active = TRUE
    `, [preferred_currency]);

    if (currencyCheck.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid currency code'
      });
    }

    // Insert or update user preference
    await pool.query(`
      INSERT INTO user_currency_preferences (user_id, preferred_currency, timezone)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        preferred_currency = VALUES(preferred_currency),
        timezone = VALUES(timezone)
    `, [userId, preferred_currency, timezone || 'Asia/Kolkata']);

    // Also update the users table for backward compatibility
    await pool.query(`
      UPDATE users SET currency = ?, timezone = ? WHERE id = ?
    `, [preferred_currency, timezone || 'Asia/Kolkata', userId]);

    res.json({
      success: true,
      message: 'Currency preference updated successfully',
      data: {
        preferred_currency,
        timezone: timezone || 'Asia/Kolkata'
      }
    });

  } catch (error) {
    console.error('Error updating user currency preference:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update currency preference',
      error: error.message
    });
  }
});

// Get currency display settings for a component
router.get('/display-settings/:component', auth, async (req, res) => {
  try {
    const { component } = req.params;

    const [result] = await pool.query(`
      SELECT * FROM currency_display_settings 
      WHERE component_name = ?
    `, [component]);

    if (result.length === 0) {
      // Return default settings
      return res.json({
        success: true,
        data: {
          component_name: component,
          default_currency: 'INR',
          show_currency_selector: true,
          allow_currency_conversion: true
        }
      });
    }

    res.json({
      success: true,
      data: result[0]
    });

  } catch (error) {
    console.error('Error fetching display settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch display settings',
      error: error.message
    });
  }
});

// Update currency display settings for a component (admin only)
router.put('/display-settings/:component', auth, async (req, res) => {
  try {
    const { component } = req.params;
    const { default_currency, show_currency_selector, allow_currency_conversion } = req.body;

    await pool.query(`
      INSERT INTO currency_display_settings 
      (component_name, default_currency, show_currency_selector, allow_currency_conversion)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        default_currency = VALUES(default_currency),
        show_currency_selector = VALUES(show_currency_selector),
        allow_currency_conversion = VALUES(allow_currency_conversion)
    `, [component, default_currency || 'INR', show_currency_selector !== false, allow_currency_conversion !== false]);

    res.json({
      success: true,
      message: 'Display settings updated successfully'
    });

  } catch (error) {
    console.error('Error updating display settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update display settings',
      error: error.message
    });
  }
});

// Get historical conversion rates
router.get('/rates/history', auth, async (req, res) => {
  try {
    const { from_currency, to_currency, days = 30 } = req.query;

    let query = `
      SELECT from_currency, to_currency, rate, date
      FROM currency_conversion_rates
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `;
    let params = [parseInt(days)];

    if (from_currency && to_currency) {
      query += ` AND from_currency = ? AND to_currency = ?`;
      params.push(from_currency, to_currency);
    }

    query += ` ORDER BY date DESC, from_currency, to_currency`;

    const [rates] = await pool.query(query, params);

    res.json({
      success: true,
      data: rates
    });

  } catch (error) {
    console.error('Error fetching rate history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rate history',
      error: error.message
    });
  }
});

module.exports = router;