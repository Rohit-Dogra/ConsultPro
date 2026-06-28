const { sendEmail } = require('../models/email');

/**
 * Send email notification for booking-related actions
 * @param {string} templateType - The type of email template to use
 * @param {string} recipientId - The user ID of the recipient
 * @param {string} bookingId - The booking ID for context
 * @param {Object} additionalData - Additional data for the email template
 */
async function sendBookingEmail(templateType, recipientId, bookingId, additionalData = {}) {
    try {
        console.log(`Sending ${templateType} email to user ${recipientId} for booking ${bookingId}`);
        
        const emailOptions = {
            templateType,
            userId: recipientId,
            bookingId,
            ...additionalData
        };

        const result = await sendEmail(emailOptions);
        console.log(` Email sent successfully: ${templateType} to user ${recipientId}`);
        return result;
    } catch (error) {
        console.error(` Failed to send ${templateType} email to user ${recipientId}:`, error);
        return false;
    }
}

/**
 * Send email to expert when a new booking is created
 */
async function sendNewBookingEmail(expertId, bookingId) {
    return await sendBookingEmail('New Booking', expertId, bookingId);
}

/**
 * Send email to seeker when booking is accepted
 */
async function sendBookingAcceptedEmail(seekerId, bookingId) {
    return await sendBookingEmail('Booking Accepted', seekerId, bookingId);
}

/**
 * Send email to seeker when booking is rejected
 */
async function sendBookingRejectedEmail(seekerId, bookingId) {
    return await sendBookingEmail('Booking Rejected', seekerId, bookingId);
}

/**
 * Send email to seeker when booking is rescheduled
 */
async function sendBookingRescheduledEmail(seekerId, bookingId) {
    return await sendBookingEmail('Booking Rescheduled', seekerId, bookingId);
}

/**
 * Send session reminder email
 */
async function sendSessionReminderEmail(userId, bookingId) {
    return await sendBookingEmail('Session Reminder', userId, bookingId);
}

/**
 * Send session completed email
 */
async function sendSessionCompletedEmail(userId, bookingId, feedbackLink) {
    return await sendBookingEmail('Session Completed', userId, bookingId, { feedbackLink });
}

/**
 * Send session feedback request email
 */
async function sendSessionFeedbackEmail(userId, bookingId, feedbackLink) {
    return await sendBookingEmail('Session Feedback', userId, bookingId, { feedbackLink });
}

/**
 * Send session feedback received email
 */
async function sendSessionFeedbackReceivedEmail(userId, bookingId, feedbackData) {
    return await sendBookingEmail('Session Feedback Received', userId, bookingId, feedbackData);
}

module.exports = {
    sendBookingEmail,
    sendNewBookingEmail,
    sendBookingAcceptedEmail,
    sendBookingRejectedEmail,
    sendBookingRescheduledEmail,
    sendSessionReminderEmail,
    sendSessionCompletedEmail,
    sendSessionFeedbackEmail,
    sendSessionFeedbackReceivedEmail
}; 