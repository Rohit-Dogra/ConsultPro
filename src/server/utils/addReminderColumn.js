const mysql = require('mysql2/promise');
require('dotenv').config();

async function addReminderColumn() {
    let connection;
    
    try {
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        console.log('Connected to database');

        // Check if column already exists
        const [columns] = await connection.execute(
            `SELECT COLUMN_NAME 
             FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = ? 
             AND TABLE_NAME = 'bookings' 
             AND COLUMN_NAME = 'reminder_sent'`,
            [process.env.DB_NAME]
        );

        if (columns.length === 0) {
            // Add reminder_sent column
            await connection.execute(
                'ALTER TABLE bookings ADD COLUMN reminder_sent BOOLEAN DEFAULT FALSE AFTER real_end_time'
            );
            console.log('Added reminder_sent column to bookings table');
        } else {
            console.log('reminder_sent column already exists');
        }

        console.log('Database migration completed successfully!');

    } catch (error) {
        console.error('Error adding reminder column:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the script if called directly
if (require.main === module) {
    addReminderColumn()
        .then(() => {
            console.log('Script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Script failed:', error);
            process.exit(1);
        });
}

module.exports = addReminderColumn; 