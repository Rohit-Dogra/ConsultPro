const express = require('express');
const router = express.Router();
const { pool } = require('../server');
const authenticateToken = require('../middleware/auth');
const { 
  sendSessionCompletedEmail, 
  sendSessionFeedbackEmail, 
  sendSessionFeedbackReceivedEmail 
} = require('../utils/emailService');

// POST /api/session-feedback - Submit feedback for a session
router.post('/', authenticateToken, async (req, res) => {
  let connection;
  try {
    const { booking_id, rating, review, message } = req.body;
    const { user_id, role } = req.user;
    const user_role = (role === 'solution_seeker' || role === 'seeker') ? 'seeker' : 'expert';
    if (!booking_id) {
      return res.status(400).json({ success: false, message: 'Booking ID is required.' });
    }
    if (user_role === 'seeker' && (!rating || rating === 0)) {
      return res.status(400).json({ success: false, message: 'Rating is required for seekers.' });
    }
    connection = await pool.getConnection();
    await connection.beginTransaction();
    // Check if both expert and seeker joined
    const [bookingRows] = await connection.query('SELECT expert_joined, seeker_joined FROM bookings WHERE id = ?', [booking_id]);
    if (!bookingRows.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }
    const { expert_joined, seeker_joined } = bookingRows[0];
    if (!expert_joined || !seeker_joined) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Feedback not allowed: both participants must have joined.' });
    }
    const [bookings] = await connection.query(
      `SELECT b.*, 
              e.name as expert_name,
              s.name as seeker_name
       FROM bookings b
       LEFT JOIN users e ON b.expert_id = e.id
       LEFT JOIN users s ON b.seeker_id = s.id
       WHERE b.id = ?`,
      [booking_id]
    );
    if (bookings.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }
    const booking = bookings[0];
    if (booking.expert_id !== user_id && booking.seeker_id !== user_id) {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'You are not authorized to provide feedback for this session.' });
    }
    const [existingFeedback] = await connection.query(
      'SELECT id FROM session_feedback WHERE booking_id = ? AND user_id = ?',
      [booking_id, user_id]
    );
    if (existingFeedback.length > 0) {
      await connection.rollback();
      return res.status(409).json({ success: false, message: 'Feedback has already been submitted for this session.' });
    }
    const feedbackData = {
      booking_id,
      user_id,
      user_role,
      rating: user_role === 'seeker' ? rating : null,
      review: user_role === 'seeker' ? review : null,
      message: user_role === 'expert' ? message : null,
    };
    const [result] = await connection.query(
      'INSERT INTO session_feedback SET ?',
      feedbackData
    );
    await connection.query(
      "UPDATE bookings SET status = 'completed' WHERE id = ?",
      [booking_id]
    );

    // Check if both feedbacks are submitted
    const [allFeedbacks] = await connection.query(
      'SELECT COUNT(*) as count FROM session_feedback WHERE booking_id = ?',
      [booking_id]
    );

    await connection.commit();

    // Send email notifications
    try {
      if (allFeedbacks[0].count === 1) {
        // First feedback submitted - send completion emails to both parties
        const feedbackLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/feedback/${booking_id}`;
        
        // Send to seeker
        await sendSessionCompletedEmail(booking.seeker_id, booking_id, feedbackLink);
        console.log(` Session completed email sent to seeker ${booking.seeker_id}`);
        
        // Send to expert
        await sendSessionCompletedEmail(booking.expert_id, booking_id, feedbackLink);
        console.log(` Session completed email sent to expert ${booking.expert_id}`);
        
        // Send feedback request emails
        await sendSessionFeedbackEmail(booking.seeker_id, booking_id, feedbackLink);
        console.log(` Feedback request email sent to seeker ${booking.seeker_id}`);
        
        await sendSessionFeedbackEmail(booking.expert_id, booking_id, feedbackLink);
        console.log(` Feedback request email sent to expert ${booking.expert_id}`);
        
      } else if (allFeedbacks[0].count === 2) {
        // Both feedbacks submitted - send feedback received emails
        const [feedbacks] = await connection.query(
          `SELECT sf.*, u.name as user_name, u.email as user_email
           FROM session_feedback sf
           JOIN users u ON sf.user_id = u.id
           WHERE sf.booking_id = ?`,
          [booking_id]
        );

        for (const feedback of feedbacks) {
          const feedbackData = {
            rating: feedback.rating,
            review: feedback.review,
            message: feedback.message,
            expert_name: user_role === 'expert' ? feedback.user_name : booking.expert_name,
            seeker_name: user_role === 'seeker' ? feedback.user_name : booking.seeker_name
          };

          // Send to the other party
          const recipientId = feedback.user_role === 'seeker' ? booking.expert_id : booking.seeker_id;
          await sendSessionFeedbackReceivedEmail(recipientId, booking_id, feedbackData);
          console.log(` Feedback received email sent to user ${recipientId}`);
        }
      }
    } catch (emailError) {
      console.error(' Failed to send email notifications:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully.',
      feedbackId: result.insertId
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error in /api/session-feedback:', error);
    res.status(500).json({ success: false, message: 'Server error while submitting feedback.' });
  } finally {
    if (connection) connection.release();
  }
});

// GET /api/session-feedback/booking/:bookingId - Get all feedback for a specific booking
router.get('/booking/:bookingId', authenticateToken, async (req, res) => {
  let connection;
  try {
    const { bookingId } = req.params;
    connection = await pool.getConnection();
    const [feedbacks] = await connection.query(
      `SELECT sf.id, sf.user_id, sf.user_role, sf.rating, sf.review, sf.message, sf.created_at, u.name as user_name
       FROM session_feedback sf
       JOIN users u ON sf.user_id = u.id
       WHERE sf.booking_id = ? 
       ORDER BY sf.created_at DESC`,
      [bookingId]
    );
    res.status(200).json({
      success: true,
      data: feedbacks
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching feedback.' });
  } finally {
    if (connection) connection.release();
  }
});

// GET /api/session-feedback/expert/:expertId - Get feedback for an expert (authenticated)
router.get('/expert/:expertId', authenticateToken, async (req, res) => {
  let connection;
  try {
    const { expertId } = req.params;
    connection = await pool.getConnection();
    const [feedbacks] = await connection.query(
      `SELECT booking_id, rating, review, message, created_at
       FROM session_feedback
       WHERE user_role = 'seeker' AND booking_id IN (
         SELECT id FROM bookings WHERE expert_id = ?
       )
       ORDER BY created_at DESC`,
      [expertId]
    );
    res.status(200).json({ success: true, data: feedbacks });
  } catch (error) {
    console.error('Error fetching expert feedback:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch feedback' });
  } finally {
    if (connection) connection.release();
  }
});

// GET /api/session-feedback/expert/:expertId/public - Get public feedback for an expert (no auth required)
router.get('/expert/:expertId/public', async (req, res) => {
  let connection;
  try {
    const { expertId } = req.params;
    connection = await pool.getConnection();
    const [feedbacks] = await connection.query(
      `SELECT rating, created_at
       FROM session_feedback
       WHERE user_role = 'seeker' AND booking_id IN (
         SELECT id FROM bookings WHERE expert_id = ?
       )
       ORDER BY created_at DESC`,
      [expertId]
    );
    res.status(200).json({ success: true, data: feedbacks });
  } catch (error) {
    console.error('Error fetching expert public feedback:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch feedback' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;