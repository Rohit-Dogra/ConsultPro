const express = require('express');
const router = express.Router();
const { pool } = require('../server');  // Updated to destructure pool from server.js

router.post('/register', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();

        const {
            name,
            profession,
            email,
            phone,
            areaOfInterest
        } = req.body;

        // Validate required fields
        const requiredFields = ['name', 'profession', 'email', 'phone', 'areaOfInterest'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Check for existing registration
        const [existingRegistration] = await connection.execute(
            'SELECT id FROM webinar_registrations WHERE email = ?',
            [email]
        );

        if (existingRegistration.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'This email is already registered for the webinar'
            });
        }

        // Insert new registration
        const [result] = await connection.execute(
            `INSERT INTO webinar_registrations 
            (name, profession, email, phone, area_of_interest) 
            VALUES (?, ?, ?, ?, ?)`,
            [name, profession, email, phone, areaOfInterest]
        );

        res.status(201).json({
            success: true,
            message: 'Registration successful! Check your email for details.',
            data: {
                id: result.insertId,
                name,
                email
            }
        });

    } catch (error) {
        console.error('Webinar registration error:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'This email is already registered'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error processing registration',
            error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

module.exports = router;