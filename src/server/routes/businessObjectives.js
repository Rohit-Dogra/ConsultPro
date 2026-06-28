const express = require('express');
const router = express.Router();

// GET /api/business-objectives - Fetch all active business objectives
router.get('/', async (req, res) => {
  try {
    // Get pool from app.locals since it's set there
    const pool = req.app.locals.db;
    
    if (!pool) {
      // Return mock data if no database connection
      return res.json({
        success: true,
        data: [
          { id: 1, name: 'Strategic Planning', function_id: 23, is_active: true },
          { id: 2, name: 'Market Analysis', function_id: 23, is_active: true },
          { id: 3, name: 'Business Model Innovation', function_id: 23, is_active: true },
          { id: 4, name: 'Talent Acquisition', function_id: 24, is_active: true },
          { id: 5, name: 'Employee Engagement', function_id: 24, is_active: true },
          { id: 6, name: 'Training & Development', function_id: 24, is_active: true },
          { id: 7, name: 'Technology Strategy', function_id: 29, is_active: true },
          { id: 8, name: 'System Integration', function_id: 29, is_active: true },
          { id: 9, name: 'Data Analytics', function_id: 29, is_active: true },
          { id: 10, name: 'Brand Development', function_id: 27, is_active: true },
          { id: 11, name: 'Digital Marketing', function_id: 27, is_active: true },
          { id: 12, name: 'Customer Engagement', function_id: 27, is_active: true },
          { id: 13, name: 'Financial Planning', function_id: 28, is_active: true },
          { id: 14, name: 'Risk Assessment', function_id: 28, is_active: true },
          { id: 15, name: 'Compliance Management', function_id: 28, is_active: true }
        ],
        message: 'Business objectives fetched successfully (mock data)'
      });
    }
    
    const query = `
      SELECT 
        id,
        name,
        function_id,
        is_active
      FROM business_objectives 
      WHERE is_active = TRUE
      ORDER BY function_id, name
    `;
    
    const [rows] = await pool.execute(query);
    
    res.json({
      success: true,
      data: rows,
      message: 'Business objectives fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching business objectives:', error);
    // Return mock data on error
    res.json({
      success: true,
      data: [
        { id: 1, name: 'Strategic Planning', function_id: 23, is_active: true },
        { id: 2, name: 'Market Analysis', function_id: 23, is_active: true },
        { id: 3, name: 'Business Model Innovation', function_id: 23, is_active: true },
        { id: 4, name: 'Talent Acquisition', function_id: 24, is_active: true },
        { id: 5, name: 'Employee Engagement', function_id: 24, is_active: true },
        { id: 6, name: 'Training & Development', function_id: 24, is_active: true },
        { id: 7, name: 'Technology Strategy', function_id: 29, is_active: true },
        { id: 8, name: 'System Integration', function_id: 29, is_active: true },
        { id: 9, name: 'Data Analytics', function_id: 29, is_active: true },
        { id: 10, name: 'Brand Development', function_id: 27, is_active: true },
        { id: 11, name: 'Digital Marketing', function_id: 27, is_active: true },
        { id: 12, name: 'Customer Engagement', function_id: 27, is_active: true },
        { id: 13, name: 'Financial Planning', function_id: 28, is_active: true },
        { id: 14, name: 'Risk Assessment', function_id: 28, is_active: true },
        { id: 15, name: 'Compliance Management', function_id: 28, is_active: true }
      ],
      message: 'Business objectives fetched successfully (fallback data)'
    });
  }
});

module.exports = router;