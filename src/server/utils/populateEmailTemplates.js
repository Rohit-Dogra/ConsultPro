const mysql = require('mysql2/promise');
const defaultTemplates = require('../models/email_templates');
require('dotenv').config();

async function populateEmailTemplates() {
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

        // First, populate template_types table
        const templateTypes = [
            'Expert Signup',
            'Seeker Signup', 
            'Forgot Password',
            'New Booking',
            'Booking Accepted',
            'Booking Rejected',
            'Booking Rescheduled',
            'Session Reminder',
            'Session Completed',
            'Session Feedback',
            'Session Feedback Received'
        ];

        for (const templateType of templateTypes) {
            // Check if template type already exists
            const [existingTypes] = await connection.execute(
                'SELECT id FROM template_types WHERE name = ?',
                [templateType]
            );

            if (existingTypes.length === 0) {
                // Insert template type
                await connection.execute(
                    'INSERT INTO template_types (name, created_at) VALUES (?, NOW())',
                    [templateType]
                );
                console.log(`Inserted template type: ${templateType}`);
            } else {
                console.log(`Template type already exists: ${templateType}`);
            }
        }

        // Now populate email_templates table
        for (const [templateName, template] of Object.entries(defaultTemplates)) {
            // Get template type ID
            const [templateTypes] = await connection.execute(
                'SELECT id FROM template_types WHERE name = ?',
                [templateName]
            );

            if (templateTypes.length === 0) {
                console.log(`Template type not found: ${templateName}`);
                continue;
            }

            const templateTypeId = templateTypes[0].id;

            // Check if template already exists
            const [existingTemplates] = await connection.execute(
                'SELECT id FROM email_templates WHERE template_type = ?',
                [templateTypeId]
            );

            if (existingTemplates.length === 0) {
                // Insert email template
                await connection.execute(
                    'INSERT INTO email_templates (template_type, subject, body, created_at) VALUES (?, ?, ?, NOW())',
                    [templateTypeId, template.subject, template.body]
                );
                console.log(`Inserted email template: ${templateName}`);
            } else {
                // Update existing template
                await connection.execute(
                    'UPDATE email_templates SET subject = ?, body = ?, updated_at = NOW() WHERE template_type = ?',
                    [template.subject, template.body, templateTypeId]
                );
                console.log(`Updated email template: ${templateName}`);
            }
        }

        console.log('Email templates population completed successfully!');

    } catch (error) {
        console.error('Error populating email templates:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the script if called directly
if (require.main === module) {
    populateEmailTemplates()
        .then(() => {
            console.log('Script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Script failed:', error);
            process.exit(1);
        });
}

module.exports = populateEmailTemplates; 