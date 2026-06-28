const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get expert availability
router.get('/', auth, async (req, res) => {
    let connection;
    try {
        const db = req.app.locals.db;
        connection = await db.getConnection();
        
        const userId = req.query.user_id || req.user?.id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Query expert_availability directly without requiring users table entry
        const [availabilitySlots] = await connection.query(
            `SELECT ea.* 
             FROM expert_availability ea
             WHERE ea.user_id = ? 
             ORDER BY FIELD(ea.day_of_week, 
                'Monday', 'Tuesday', 'Wednesday', 
                'Thursday', 'Friday', 'Saturday', 'Sunday')`,
            [userId]
        );

        console.log('Fetching availability for user:', {
            userId,
            slotsFound: availabilitySlots.length
        });

        res.json({
            success: true,
            message: 'Availability retrieved successfully',
            data: availabilitySlots
        });

    } catch (error) {
        console.error('Error fetching availability:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch availability',
            error: error.message
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// Create/update expert availability
router.post('/', auth, async (req, res) => {
    let connection;
    try {
        const db = req.app.locals.db;
        connection = await db.getConnection();
        
        const { user_id, day_of_week, start_time, end_time, name } = req.body;
        const userId = user_id || req.user?.id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        await connection.beginTransaction();

        // Updated query to use id directly
        const [userRow] = await connection.query(
            'SELECT id FROM users WHERE id = ?',
            [userId]
        );

        if (userRow.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const correctUserId = userRow[0].id;

        console.log('Debug - User IDs:', {
            userId,
            correctUserId,
            day_of_week
        });

        // Check if slot exists using correct user ID
        const [existingSlot] = await connection.query(
            'SELECT id FROM expert_availability WHERE user_id = ? AND day_of_week = ?',
            [correctUserId, day_of_week]
        );

        let result;
        if (existingSlot.length > 0) {
            // Update existing slot
            [result] = await connection.query(
                `UPDATE expert_availability 
                 SET start_time = ?, 
                     end_time = ?, 
                     name = ?, 
                     updated_at = NOW()
                 WHERE user_id = ? AND day_of_week = ?`,
                [start_time, end_time, name, correctUserId, day_of_week]
            );
        } else {
            // Create new slot
            [result] = await connection.query(
                `INSERT INTO expert_availability 
                 (user_id, day_of_week, start_time, end_time, name, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
                [correctUserId, day_of_week, start_time, end_time, name]
            );
        }

        await connection.commit();

        res.json({
            success: true,
            message: `Availability ${existingSlot.length > 0 ? 'updated' : 'created'} successfully`,
            data: {
                user_id: correctUserId,
                booking_id: userId,
                day_of_week,
                start_time,
                end_time,
                name
            }
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error updating availability:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update availability',
            error: error.message
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

module.exports = router;