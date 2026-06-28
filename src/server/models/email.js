const nodemailer = require('nodemailer');
const createSESTransport = require('./email_ses');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function getConnection() {
    // Create a new connection each time instead of reusing
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });
    return connection;
}
async function sendEmail(options) {
    const { templateType, userId, bookingId, resetPasswordLink, feedbackLink, password } = options;
    let conn = null;
    try {
        console.log('Starting email send process for template:', templateType);
        console.log('SMTP Settings:', {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            user: process.env.SMTP_USER,
            secure: process.env.SMTP_SECURE
        });

        // Get a fresh connection for each email send
        conn = await getConnection();
        console.log('Database connection established');

        // Get template type
        const [templateTypes] = await conn.execute(
            'SELECT * FROM template_types WHERE name = ?',
            [templateType]
        );
        console.log('Template types found:', templateTypes.length);

        if (templateTypes.length === 0) {
            throw new Error(`Template type not found: ${templateType}`);
        }
        const templateTypeId = templateTypes[0].id;
        console.log('Template type ID:', templateTypeId);

        // Get email template
        const [templates] = await conn.execute(
            'SELECT * FROM email_templates WHERE template_type = ?',
            [templateTypeId]
        );
        console.log('Email templates found:', templates.length);

        if (templates.length === 0) {
            throw new Error(`Email template not found for type: ${templateType}`);
        }
        const template = templates[0];
        console.log('Using template:', {
            id: template.id,
            subject: template.subject
        });

        let emailData = {};
        // Get user data if userId is provided
        if (userId) {
            console.log('Fetching user data for ID:', userId);
            const [users] = await conn.execute(
                'SELECT * FROM users WHERE id = ?',
                [userId]
            );
            console.log('User data found:', users.length > 0);
            
            if (users.length > 0) {
                emailData = {
                    ...emailData,
                    name: users[0].name,
                    email: users[0].email,
                    password: password
                };
                console.log('User data prepared:', {
                    name: emailData.name,
                    email: emailData.email
                });
            }
        }
        // Get booking data if bookingId is provided
        if (bookingId) {
            const [bookings] = await conn.execute(
                `SELECT b.*, 
                    u1.email as seeker_email, u1.name as seeker_name,
                    u2.email as expert_email, u2.name as expert_name
                FROM bookings b
                JOIN users u1 ON b.seeker_id = u1.id
                JOIN users u2 ON b.expert_id = u2.id
                WHERE b.id = ?`,
                [bookingId]
            );
            if (bookings.length > 0) {
                const booking = bookings[0];
                emailData = {
                    ...emailData,
                    appointment_date: new Date(booking.appointment_date).toLocaleDateString(),
                    start_time: booking.start_time,
                    end_time: booking.end_time,
                    session_type: booking.session_type,
                    amount: booking.amount,
                    notes: booking.notes,
                    expert_name: booking.expert_name,
                    seeker_name: booking.seeker_name,
                    expert_email: booking.expert_email,
                    seeker_email: booking.seeker_email
                };

                // For rescheduled bookings, get old booking details
                if (templateType === 'Booking Rescheduled' && booking.old_booking_id) {
                    const [oldBookings] = await conn.execute(
                        'SELECT * FROM bookings WHERE id = ?',
                        [booking.old_booking_id]
                    );
                    if (oldBookings.length > 0) {
                        const oldBooking = oldBookings[0];
                        emailData = {
                            ...emailData,
                            old_appointment_date: new Date(oldBooking.appointment_date).toLocaleDateString(),
                            old_start_time: oldBooking.start_time,
                            old_end_time: oldBooking.end_time
                        };
                    }
                }
            }
        }
        // Add reset password link if provided
        if (resetPasswordLink) {
            emailData.resetPasswordLink = resetPasswordLink;
        }
        // Add feedback link if provided
        if (feedbackLink) {
            emailData.feedbackLink = feedbackLink;
        }
        // Replace placeholders in template
        let emailBody = template.body;
        let emailSubject = template.subject;
        Object.keys(emailData).forEach(key => {
            const placeholder = new RegExp(`<%= ${key} %>`, 'g');
            emailBody = emailBody.replace(placeholder, emailData[key] || '');
            emailSubject = emailSubject.replace(placeholder, emailData[key] || '');
        });
        // Determine recipient email
        let recipientEmail = emailData.email;
        console.log('Recipient email:', recipientEmail);

        if (!recipientEmail) {
            throw new Error('Recipient email not found');
        }
        // Create transporter
        console.log('Creating email transporter...');
        let transporter;
        if (process.env.EMAIL_PROVIDER === 'SES') {
            console.log('Using Amazon SES for email sending');
            transporter = createSESTransport();
        } else {
            console.log('Using SMTP for email sending');
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD
                },
                debug: true // Enable debug logging
            });
            
            // Verify SMTP connection
            console.log('Verifying SMTP connection...');
            await transporter.verify();
            console.log('SMTP connection verified successfully');
        }
        // Send email
        console.log('Sending email...');
        const info = await transporter.sendMail({
            from: `"Expertise Station" <${process.env.SMTP_FROM || process.env.FROM_EMAIL}>`,
            to: recipientEmail,
            subject: emailSubject,
            html: emailBody
        });

        console.log('Email sent successfully:', info.messageId);
        return true;
    } catch (error) {
        console.error('Detailed error in sendEmail:', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            command: error.command
        });
        throw error;
    } finally {
        // Important: Close the connection when done to prevent leaks
        if (conn) {
            console.log('Closing database connection');
            await conn.end();
        }
    }
}
module.exports = {
    sendEmail
};
