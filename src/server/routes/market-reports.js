const express = require('express');
const router = express.Router();
const pool = require('../config/database'); // Adjust this path as needed
const authenticateToken = require('../middleware/auth'); // Import as default

// Get market report for a specific seeker
router.get('/seeker/:seekerId', authenticateToken, async (req, res) => {
  try {
    const { seekerId } = req.params;
    
    // Verify user has access to this report
    if (req.user.id !== seekerId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only access your own market report'
      });
    }
    
    const [reports] = await pool.query(
      'SELECT * FROM market_reports WHERE seeker_id = ? ORDER BY created_at DESC LIMIT 1',
      [seekerId]
    );
    
    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No market report found for this user'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: reports[0]
    });
  } catch (error) {
    console.error('Error fetching market report:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch market report',
      error: error.message
    });
  }
});

module.exports = router;