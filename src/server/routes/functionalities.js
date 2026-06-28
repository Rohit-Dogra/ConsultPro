const express = require('express');
const router = express.Router();
const { pool } = require('../server');

// Public endpoint for functionalities (no authentication required)
router.get('/public', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [functionalities] = await connection.execute(
            'SELECT id, option_value, display_name FROM expert_functionality_options WHERE is_active = 1'
        );

        const response = {
            success: true,
            data: functionalities
        };
        
        // Check if client wants encrypted response
        if (req._wantResponseEncrypted) {
            return res.encryptAndSend(response);
        }
        
        res.json(response);
    } catch (error) {
        const errorResponse = {
            success: false,
            message: 'Failed to fetch functionalities'
        };
        
        if (req._wantResponseEncrypted) {
            return res.status(500).encryptAndSend(errorResponse);
        }
        
        res.status(500).json(errorResponse);
    } finally {
        if (connection) connection.release();
    }
});

// Get all functionality options
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [functionalities] = await connection.execute(
            'SELECT id, option_value, display_name FROM expert_functionality_options WHERE is_active = 1'
        );

        const response = {
            success: true,
            data: functionalities
        };
        
        // Check if client wants encrypted response
        if (req._wantResponseEncrypted) {
            return res.encryptAndSend(response);
        }
        
        res.json(response);
    } catch (error) {
        const errorResponse = {
            success: false,
            message: 'Failed to fetch functionalities'
        };
        
        if (req._wantResponseEncrypted) {
            return res.status(500).encryptAndSend(errorResponse);
        }
        
        res.status(500).json(errorResponse);
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;