const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Test endpoint
router.get('/test', async (req, res) => {
  res.json({ message: 'Deals API is working', timestamp: new Date() });
});

// Get all deals
router.get('/', async (req, res) => {
  try {
    console.log('=== DEALS API CALLED ===');
    
    // First check if table exists
    const [tables] = await pool.execute("SHOW TABLES LIKE 'deals'");
    console.log('Tables found:', tables);
    
    if (tables.length === 0) {
      console.log('Deals table does not exist');
      return res.json([]);
    }
    
    const [deals] = await pool.execute(
      'SELECT * FROM deals ORDER BY created_at DESC'
    );
    console.log('Found deals:', deals.length);
    console.log('Deals data:', JSON.stringify(deals, null, 2));
    res.json(deals);
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ error: 'Failed to fetch deals', details: error.message });
  }
});

// Get single deal by ID
router.get('/:id', async (req, res) => {
  try {
    const [deals] = await pool.execute(
      'SELECT * FROM deals WHERE id = ?',
      [req.params.id]
    );
    
    if (deals.length === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    
    res.json(deals[0]);
  } catch (error) {
    console.error('Error fetching deal:', error);
    res.status(500).json({ error: 'Failed to fetch deal' });
  }
});

module.exports = router;