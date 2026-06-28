const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get current global currency rates
router.get('/rates', async (req, res) => {
  try {
    // Try database first, but handle connection errors gracefully
    let dbRates = [];
    try {
      const result = await pool.query(`
        SELECT from_currency, to_currency, rate, date, created_at 
        FROM currency_conversion_rates 
        WHERE (from_currency = 'INR' AND to_currency = 'USD') 
           OR (from_currency = 'USD' AND to_currency = 'INR')
        ORDER BY date DESC, created_at DESC
      `);
      dbRates = result[0] || [];
    } catch (dbError) {
      console.warn('Database connection failed, using fallback rates:', dbError.message);
    }

    if (dbRates.length > 0) {
      return res.json({
        success: true,
        data: dbRates,
        source: 'database'
      });
    }

    // Fallback to default rates
    const fallbackRates = [
      { from_currency: 'USD', to_currency: 'INR', rate: 83.5, updated_at: new Date() },
      { from_currency: 'INR', to_currency: 'USD', rate: 0.012, updated_at: new Date() }
    ];

    res.json({
      success: true,
      data: fallbackRates,
      source: 'fallback'
    });

  } catch (error) {
    console.error('Error fetching currency rates:', error);
    
    // Always return fallback rates on any error
    const fallbackRates = [
      { from_currency: 'USD', to_currency: 'INR', rate: 83.5, updated_at: new Date() },
      { from_currency: 'INR', to_currency: 'USD', rate: 0.012, updated_at: new Date() }
    ];

    res.json({
      success: true,
      data: fallbackRates,
      source: 'fallback_error'
    });
  }
});

// Convert amount between currencies
router.post('/convert', async (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;
    
    if (!amount || !fromCurrency || !toCurrency) {
      return res.status(400).json({
        success: false,
        message: 'Amount, fromCurrency, and toCurrency are required'
      });
    }

    if (fromCurrency === toCurrency) {
      return res.json({
        success: true,
        data: {
          originalAmount: amount,
          convertedAmount: amount,
          fromCurrency,
          toCurrency,
          rate: 1
        }
      });
    }

    // Get conversion rate from database with error handling
    let rate = null;
    try {
      const [rates] = await pool.query(`
        SELECT rate FROM currency_conversion_rates 
        WHERE from_currency = ? AND to_currency = ?
        ORDER BY date DESC, created_at DESC 
        LIMIT 1
      `, [fromCurrency, toCurrency]);

      if (rates.length > 0) {
        rate = rates[0].rate;
      } else {
        // Try reverse rate
        const [reverseRates] = await pool.query(`
          SELECT rate FROM currency_conversion_rates 
          WHERE from_currency = ? AND to_currency = ?
          ORDER BY date DESC, created_at DESC 
          LIMIT 1
        `, [toCurrency, fromCurrency]);
        
        if (reverseRates.length > 0) {
          rate = 1 / reverseRates[0].rate;
        }
      }
    } catch (dbError) {
      console.warn('Database query failed, using default rates:', dbError.message);
    }

    // Use default rates if no database rate found
    if (rate === null) {
      const defaultRates = {
        'INR_USD': 0.012,
        'USD_INR': 83.0
      };
      rate = defaultRates[`${fromCurrency}_${toCurrency}`] || 1.0;
    }

    const convertedAmount = (parseFloat(amount) * parseFloat(rate)).toFixed(2);

    res.json({
      success: true,
      data: {
        originalAmount: parseFloat(amount),
        convertedAmount: parseFloat(convertedAmount),
        fromCurrency,
        toCurrency,
        rate: parseFloat(rate)
      }
    });

  } catch (error) {
    console.error('Error converting currency:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to convert currency'
    });
  }
});

// Get current global currency status
router.get('/status', async (req, res) => {
  try {
    let currentCurrency = 'INR';
    let bookingStats = { currency: 'INR', count: 0 };

    try {
      // Check most common currency in bookings
      const [bookingCurrency] = await pool.query(`
        SELECT currency, COUNT(*) as count
        FROM bookings 
        WHERE currency IS NOT NULL
        GROUP BY currency 
        ORDER BY count DESC 
        LIMIT 1
      `);

      currentCurrency = bookingCurrency[0]?.currency || 'INR';
      bookingStats = bookingCurrency[0] || { currency: 'INR', count: 0 };
    } catch (dbError) {
      console.warn('Database query failed, using default currency:', dbError.message);
    }

    res.json({
      success: true,
      data: {
        currentCurrency,
        symbol: currentCurrency === 'USD' ? '$' : '₹',
        bookingStats
      }
    });

  } catch (error) {
    console.error('Error getting currency status:', error);
    
    // Return default currency status on error
    res.json({
      success: true,
      data: {
        currentCurrency: 'INR',
        symbol: '₹',
        bookingStats: { currency: 'INR', count: 0 }
      }
    });
  }
});

module.exports = router;