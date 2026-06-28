const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all deals
router.get('/', async (req, res) => {
  try {
    const [deals] = await pool.execute(
      'SELECT id, title, deal_type, company_name, sector, current_turnover, created_at FROM deals ORDER BY created_at DESC'
    );
    res.json(deals);
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ error: 'Failed to fetch deals' });
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