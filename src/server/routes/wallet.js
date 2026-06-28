const express = require('express');
const router = express.Router();
const { pool } = require('../server');
const authMiddleware = require('../middleware/auth');   
const { v4: uuidv4 } = require('uuid');
const cron = require('node-cron');

// Middleware to ensure the user is an expert
const isExpert = (req, res, next) => {
    if (req.user.role !== 'expert') {
        return res.status(403).json({ success: false, message: 'Access denied. Only experts can access wallet features.' });
    }
    next();
};

// All routes in this file are protected and for experts only
router.use(authMiddleware);
router.use(isExpert);

// Helper function to get next day as YYYY-MM-DD
function getNextDay(dateStr) {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
}

// Function to process auto withdrawals for completed sessions
async function processAutoWithdrawals() {
    try {
        console.log('Starting auto-withdrawal process at:', new Date().toISOString());
        
        // Get all completed bookings that haven't been withdrawn yet
        const [rows] = await pool.execute(`
            SELECT 
                b.expert_id as user_id,
                DATE(b.created_at) as session_date,
                SUM(b.amount * 0.7) as total_amount,
                COUNT(*) as session_count,
                GROUP_CONCAT(b.id) as booking_ids
            FROM bookings b
            WHERE b.status = 'completed'
              AND (b.amount_withdrawn IS NULL OR b.amount_withdrawn = 0)
            GROUP BY b.expert_id, DATE(b.created_at)
            HAVING total_amount > 0
        `);

        console.log(`Found ${rows.length} entries to process for auto-withdrawal`);

        for (const row of rows) {
            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();
                
                // Format dates properly
                const sessionDateStr = row.session_date.toISOString().split('T')[0];
                const withdrawalDate = getNextDay(sessionDateStr);
                
                console.log(`Processing expert ${row.user_id}: Amount ₹${row.total_amount}`);
                
                // Check if withdrawal already exists
                const [existing] = await connection.execute(
                    `SELECT id FROM withdrawal_history WHERE user_id = ? AND withdrawal_date = ?`,
                    [row.user_id, withdrawalDate]
                );
                
                if (existing.length > 0) {
                    console.log(`   Withdrawal already exists for ${withdrawalDate}`);
                    await connection.rollback();
                    connection.release();
                    continue;
                }

                const withdrawalId = uuidv4();

                // Insert withdrawal record
                await connection.execute(`
                    INSERT INTO withdrawal_history (id, user_id, amount, status, withdrawal_date, created_at)
                    VALUES (?, ?, ?, 'Pending', ?, NOW())
                `, [withdrawalId, row.user_id, row.total_amount, withdrawalDate]);

                // Update specific bookings to mark as withdrawn
                const bookingIds = row.booking_ids.split(',');
                const placeholders = bookingIds.map(() => '?').join(',');
                
                await connection.execute(`
                    UPDATE bookings 
                    SET amount_withdrawn = 1 
                    WHERE id IN (${placeholders})
                      AND expert_id = ?
                      AND status = 'completed'
                `, [...bookingIds, row.user_id]);

                await connection.commit();
                console.log(`   SUCCESS: Auto-withdrawal completed for expert ${row.user_id}`);
                
            } catch (error) {
                await connection.rollback();
                console.error(`  ERROR for expert ${row.user_id}:`, error);
            } finally {
                connection.release();
            }
        }
        
        console.log('Auto-withdrawal process completed at:', new Date().toISOString());
    } catch (error) {
        console.error('Error in auto-withdrawal cron job:', error);
    }
}

// Cron schedule - runs at midnight (00:00) every day
cron.schedule('0 0 * * *', () => {
    console.log('Auto-withdrawal cron job triggered at midnight');
    processAutoWithdrawals();
});

// GET /api/wallet/balance - Fetch wallet balance (after 30% deduction and excluding withdrawn amounts)
router.get('/balance', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT IFNULL(SUM(amount * 0.7), 0) AS balance 
             FROM bookings 
             WHERE expert_id = ? AND status = "completed" AND (amount_withdrawn IS NULL OR amount_withdrawn = 0)`,
            [req.user.user_id]
        );
        
        res.json({ 
            success: true, 
            data: { 
                balance: parseFloat(rows[0].balance).toFixed(2), 
                currency: 'INR' 
            } 
        });
    } catch (error) {
        console.error('Error fetching wallet balance:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/wallet/earnings - Fetch earnings history (directly from completed bookings)
router.get('/earnings', async (req, res) => {
    try {
        const query = `
            SELECT 
                b.id,
                b.created_at,
                b.session_type,
                b.status,
                b.amount as original_amount,
                (b.amount * 0.7) as amount,
                b.amount_withdrawn,
                COALESCE(sp.name, u.name, 'Unknown') as seeker_name
            FROM bookings b
            LEFT JOIN users u ON b.seeker_id = u.id
            LEFT JOIN seeker_profiles sp ON sp.user_id = u.id
            WHERE b.expert_id = ? AND b.status = 'completed'
            ORDER BY b.created_at DESC
        `;
        const [earnings] = await pool.execute(query, [req.user.user_id]);
        
        // Format the data
        const formattedEarnings = earnings.map(earning => ({
            id: earning.id,
            created_at: earning.created_at,
            session_type: earning.session_type || 'Audio',
            status: earning.status,
            original_amount: parseFloat(earning.original_amount).toFixed(2),
            amount: parseFloat(earning.amount).toFixed(2),
            amount_withdrawn: earning.amount_withdrawn || 0,
            seeker_name: earning.seeker_name,
            withdrawal_status: earning.amount_withdrawn ? 'Withdrawn' : 'Available'
        }));
        
        res.json({ success: true, data: formattedEarnings });
    } catch (error) {
        console.error('Error fetching earnings history:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/wallet/withdrawals - Fetch withdrawal history
router.get('/withdrawals', async (req, res) => {
    try {
        const [withdrawals] = await pool.execute(`
            SELECT 
                id,
                DATE_FORMAT(withdrawal_date, '%Y-%m-%d') as date,
                amount,
                status,
                created_at,
                withdrawal_date
            FROM withdrawal_history 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        `, [req.user.user_id]);
        
        res.json({ success: true, data: withdrawals });
    } catch (error) {
        console.error('Error fetching withdrawal history:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/wallet/payout-settings - Fetch payout settings
router.get('/payout-settings', async (req, res) => {
    try {
        const [settings] = await pool.execute('SELECT bank_account_number, bank_holder_name, bank_name, ifsc_code, pan_card FROM payout_settings WHERE user_id = ?', [req.user.user_id]);
        if (settings.length === 0) {
            return res.json({ success: true, data: {} });
        }
        res.json({ success: true, data: settings[0] });
    } catch (error) {
        console.error('Error fetching payout settings:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/wallet/payout-settings - Update payout settings
router.post('/payout-settings', async (req, res) => {
    const { bank_account_number, bank_holder_name, bank_name, ifsc_code, pan_card } = req.body;
    if (!bank_account_number || !ifsc_code) {
        return res.status(400).json({ success: false, message: 'Bank account number and IFSC code are required.' });
    }
    try {
        if (!req.user || !req.user.user_id) {
            console.error('Missing user or user_id in request:', req.user);
            return res.status(401).json({ success: false, message: 'Unauthorized: user_id missing.' });
        }
        
        const query = `
            INSERT INTO payout_settings (id, user_id, bank_account_number, bank_holder_name, bank_name, ifsc_code, pan_card)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            bank_account_number = VALUES(bank_account_number),
            bank_holder_name = VALUES(bank_holder_name),
            bank_name = VALUES(bank_name),
            ifsc_code = VALUES(ifsc_code),
            pan_card = VALUES(pan_card);
        `;
        await pool.execute(query, [req.user.user_id, req.user.user_id, bank_account_number, bank_holder_name || null, bank_name || null, ifsc_code, pan_card || null]);
        res.json({ success: true, message: 'Payout settings saved successfully.' });
    } catch (error) {
        console.error('Error saving payout settings:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});

// POST /api/wallet/withdraw - Manual withdrawal request (if needed)
router.post('/withdraw', async (req, res) => {
    const { amount } = req.body;
    const minWithdrawal = 500;

    if (!amount || isNaN(amount) || amount < minWithdrawal) {
        return res.status(400).json({ success: false, message: `Invalid amount. Minimum withdrawal is ₹${minWithdrawal}.` });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Check current available balance
        const [balanceRows] = await connection.execute(
            `SELECT IFNULL(SUM(amount * 0.7), 0) AS balance 
             FROM bookings 
             WHERE expert_id = ? AND status = "completed" AND (amount_withdrawn IS NULL OR amount_withdrawn = 0)`,
            [req.user.user_id]
        );
        
        const availableBalance = parseFloat(balanceRows[0].balance);
        
        if (availableBalance < amount) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Insufficient balance.' });
        }

        // Create withdrawal history entry
        const withdrawalId = uuidv4();
        const today = new Date().toISOString().split('T')[0];
        
        await connection.execute(`
            INSERT INTO withdrawal_history (id, user_id, amount, status, created_at, withdrawal_date)
            VALUES (?, ?, ?, 'Pending', NOW(), ?)
        `, [withdrawalId, req.user.user_id, amount, today]);

        // Get bookings to mark as withdrawn
        const [bookingsToWithdraw] = await connection.execute(`
            SELECT id, amount 
            FROM bookings 
            WHERE expert_id = ? AND status = 'completed' AND (amount_withdrawn IS NULL OR amount_withdrawn = 0)
            ORDER BY created_at ASC
        `, [req.user.user_id]);

        let remainingAmount = amount;
        const bookingIds = [];
        
        for (const booking of bookingsToWithdraw) {
            const bookingEarning = booking.amount * 0.7;
            if (remainingAmount <= 0) break;
            
            bookingIds.push(booking.id);
            remainingAmount -= bookingEarning;
        }

        if (bookingIds.length > 0) {
            await connection.execute(`
                UPDATE bookings 
                SET amount_withdrawn = 1 
                WHERE id IN (${bookingIds.map(() => '?').join(',')})
            `, bookingIds);
        }

        await connection.commit();
        res.json({ success: true, message: 'Withdrawal request submitted successfully.' });
        
    } catch (error) {
        await connection.rollback();
        console.error('Error processing withdrawal:', error);
        res.status(500).json({ success: false, message: 'Server error during withdrawal.' });
    } finally {
        connection.release();
    }
});

module.exports = router;