const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all industries
router.get('/industries', async (req, res) => {
    try {
        const [industries] = await pool.query(
            'SELECT id, name FROM industries WHERE status = "active" ORDER BY name'
        );
        
        // Check if client wants encrypted response
        if (req._wantResponseEncrypted) {
            return res.encryptAndSend(industries);
        }
        
        res.json(industries);
    } catch (error) {
        const errorResponse = { message: 'Failed to fetch industries' };
        
        if (req._wantResponseEncrypted) {
            return res.status(500).encryptAndSend(errorResponse);
        }
        
        res.status(500).json(errorResponse);
    }
});

// Get product categories by industry
router.get('/product-categories/:industryId', async (req, res) => {
    try {
        const [categories] = await pool.query(
            'SELECT id, name FROM product_categories WHERE industry_id = ? AND status = "active" ORDER BY name',
            [req.params.industryId]
        );
        
        // Check if client wants encrypted response
        if (req._wantResponseEncrypted) {
            return res.encryptAndSend(categories);
        }
        
        res.json(categories);
    } catch (error) {
        const errorResponse = { message: 'Failed to fetch product categories' };
        
        if (req._wantResponseEncrypted) {
            return res.status(500).encryptAndSend(errorResponse);
        }
        
        res.status(500).json(errorResponse);
    }
});

// Get all seed segments
router.get('/seed-segments', async (req, res) => {
    try {
        const [segments] = await pool.query(
            'SELECT id, code, name FROM seed_segments WHERE status = "active" ORDER BY code'
        );
        
        // Check if client wants encrypted response
        if (req._wantResponseEncrypted) {
            return res.encryptAndSend(segments);
        }
        
        res.json(segments);
    } catch (error) {
        const errorResponse = { message: 'Failed to fetch seed segments' };
        
        if (req._wantResponseEncrypted) {
            return res.status(500).encryptAndSend(errorResponse);
        }
        
        res.status(500).json(errorResponse);
    }
});

module.exports = router;