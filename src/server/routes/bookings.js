const authenticateToken = require('../middleware/auth');
const SubscriptionValidator = require('../middleware/subscriptionValidator');
const SubscriptionService = require('../services/SubscriptionService');
const express = require('express');
const jwt = require('jsonwebtoken');
const { sendPushNotification } = require('./notifications');
const { 
  sendNewBookingEmail, 
  sendBookingAcceptedEmail, 
  sendBookingRejectedEmail, 
  sendBookingRescheduledEmail 
} = require('../utils/emailService');

const router = express.Router();

function generateBookingId() {
  // Generates a random 5-digit number as a string
  return Math.floor(10000 + Math.random() * 90000).toString();
}

// Helper function to extract seeker_id from JWT token in Authorization header
function getSeekerIdFromToken(req) {
  try {
    const authHeader = req.headers['authorization'];
    console.log('Authorization header:', authHeader);
    if (!authHeader) return null;

    const token = authHeader.split(' ')[1]; // "Bearer <token>"
    console.log('Token extracted:', token);
    if (!token) return null;

    const secret = process.env.JWT_SECRET || 'your_jwt_secret'; // JWT secret key
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
      console.log('Decoded token:', decoded);
    } catch (verifyError) {
      console.error('JWT verification error:', verifyError);
      return null;
    }

    return decoded.user_id || decoded.id; // Check both possible ID fields
  } catch (err) {
    console.error('Error in getSeekerIdFromToken:', err);
    return null;
  }
}

// Helper function to create notifications
async function createNotification(pool, userId, type, message, relatedId) {
  try {
    await pool.query(
      `INSERT INTO notifications 
       (user_id, type, message, related_id, read_status, created_at) 
       VALUES (?, ?, ?, ?, FALSE, NOW())`,
      [userId, type, message, relatedId]
    );
    console.log(`Notification created for user ${userId}`);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

// Get all bookings
router.get('/', async (req, res) => {
  try {
    const pool = req.app.locals.db;
    const [bookings] = await pool.query(
      `SELECT b.*, 
              e.name AS expert_name, 
              s.name AS seeker_name
       FROM bookings b
       LEFT JOIN users e ON b.expert_id = e.id
       LEFT JOIN users s ON b.seeker_id = s.id
       ORDER BY b.created_at DESC`
    );
    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

// Get bookings for an expert
router.get('/expert/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = req.app.locals.db;
    
    console.log(`Fetching expert bookings for ID: ${id}`);
    
    const [bookings] = await pool.query(
      `SELECT b.id, b.expert_id, b.seeker_id, 
              COALESCE(s.name, 'Unknown Seeker') AS seeker_name, 
              b.appointment_date AS date,
              TIME_FORMAT(b.start_time, '%h:%i %p') AS start_time,
              TIME_FORMAT(b.end_time, '%h:%i %p') AS end_time,
              b.session_type, b.status, b.amount, b.created_at, b.notes, b.rejection_reason,
              sr.problem_statement, sr.desired_solution, sr.functionality, sr.id as session_request_id
       FROM bookings b
       LEFT JOIN users s ON b.seeker_id = s.id
       LEFT JOIN session_requests sr ON b.session_request_id = sr.id
       WHERE b.expert_id = ?
       ORDER BY b.appointment_date DESC, b.start_time DESC`,
      [id]
    );
    
    console.log(`Found ${bookings.length} expert bookings`);
    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Error fetching expert bookings:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch expert bookings' });
  }
});

//  Get bookings for a seeker - FIXED TO MATCH EXPERT FORMAT
router.get('/seeker/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching seeker bookings for ID: ${id}`);
    
    const pool = req.app.locals.db;
    
    // First check if the seeker exists
    const [seekerCheck] = await pool.query(
      `SELECT id, name FROM users WHERE id = ?`,
      [id]
    );
    
    if (seekerCheck.length === 0) {
      console.log(`Seeker with ID ${id} not found`);
      return res.status(404).json({ 
        success: false, 
        message: 'Seeker not found' 
      });
    }
    
    try {
      //  FIXED: Match the exact same structure as expert bookings with session request info
      const [bookings] = await pool.query(
        `SELECT b.id, b.expert_id, b.seeker_id, 
                COALESCE(e.name, 'Unknown Expert') AS expert_name, 
                b.appointment_date AS date,
                TIME_FORMAT(b.start_time, '%h:%i %p') AS start_time,
                TIME_FORMAT(b.end_time, '%h:%i %p') AS end_time,
                b.session_type, b.status, b.amount, b.created_at, b.notes, b.rejection_reason,
                sr.problem_statement, sr.desired_solution, sr.functionality, sr.id as session_request_id
         FROM bookings b
         LEFT JOIN users e ON b.expert_id = e.id
         LEFT JOIN session_requests sr ON b.session_request_id = sr.id
         WHERE b.seeker_id = ?
         ORDER BY b.appointment_date DESC, b.start_time DESC`,
        [id]
      );
      
      console.log(`Found ${bookings.length} seeker bookings`);
      
      // Add detailed logging for each booking
      bookings.forEach((booking, index) => {
        console.log(`Seeker Booking ${index + 1}:`, {
          id: booking.id,
          expert_id: booking.expert_id,
          expert_name: booking.expert_name,
          seeker_id: booking.seeker_id,
          date: booking.date,
          start_time: booking.start_time,
          end_time: booking.end_time,
          status: booking.status,
          amount: booking.amount,
          session_request_id: booking.session_request_id,
          has_problem_statement: !!booking.problem_statement
        });
      });
      
      res.json({ 
        success: true, 
        data: bookings 
      });
    } catch (queryError) {
      console.error('Database query error for seeker bookings:', queryError);
      
      // Return empty data instead of error to prevent frontend crash
      res.json({ 
        success: true, 
        data: [] 
      });
    }
  } catch (error) {
    console.error('Error fetching seeker bookings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch seeker bookings' 
    });
  }
});

// Upcoming confirmed bookings for an expert
router.get('/upcoming/:expert_id', async (req, res) => {
  try {
    const { expert_id } = req.params;
    const pool = req.app.locals.db;

    const [results] = await pool.query(
      `SELECT b.*, 
              COALESCE(s.name, 'Unknown Seeker') AS seeker_name
       FROM bookings b
       LEFT JOIN users s ON b.seeker_id = s.id
       WHERE b.expert_id = ? 
         AND b.status = 'confirmed' 
         AND b.appointment_date >= CURDATE()
       ORDER BY b.appointment_date ASC, b.start_time ASC`,
      [expert_id]
    );

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error fetching upcoming bookings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch upcoming bookings' });
  }
});

//  NEW: Upcoming confirmed bookings for a seeker
router.get('/upcoming/seeker/:seeker_id', async (req, res) => {
  try {
    const { seeker_id } = req.params;
    const pool = req.app.locals.db;

    const [results] = await pool.query(
      `SELECT b.*, 
              COALESCE(e.name, 'Unknown Expert') AS expert_name
       FROM bookings b
       LEFT JOIN users e ON b.expert_id = e.id
       WHERE b.seeker_id = ? 
         AND b.status IN ('confirmed', 'pending')
         AND b.appointment_date >= CURDATE()
       ORDER BY b.appointment_date ASC, b.start_time ASC`,
      [seeker_id]
    );

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error fetching seeker upcoming bookings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch seeker upcoming bookings' });
  }
});

// Create a new booking with subscription validation
router.post('/', authenticateToken, async (req, res) => {
  const subscriptionService = new SubscriptionService(req.app.locals.db);
  
  // Temporarily bypass subscription validation for free bookings
  // try {
  //   const userId = req.user.user_id;
  //   const validation = await subscriptionService.validateFeatureAccess(userId, 'expert_consultations', 1);
  //   
  //   if (!validation.allowed) {
  //     return res.status(403).json({
  //       success: false,
  //       error: 'Feature access denied',
  //       reason: validation.reason,
  //       upgradeRequired: true,
  //       currentUsage: validation.currentUsage,
  //       usageLimit: validation.limit
  //     });
  //   }
  // } catch (validationError) {
  //   console.error('Subscription validation error:', validationError);
  // }
  try {
    // Get seeker_id from token or request body
    let seeker_id = getSeekerIdFromToken(req);
    if (!seeker_id && req.body.seeker_id) {
      seeker_id = req.body.seeker_id;
    }
    
    if (!seeker_id) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid or missing token' });
    }

    const { 
      expert_id, 
      seeker_name, // This might be added in your updated code
      date, 
      start_time, 
      end_time, 
      session_type, 
      amount, 
      notes = '',
      session_request_id,
      // Add this line to extract status from request body:
      status = 'draft'  // Default to 'draft' if not provided
    } = req.body;

    if (!expert_id || !date || !start_time || !end_time || !session_type) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const pool = req.app.locals.db;

    // Convert time format for database storage
    const dbStartTime = convertTo24HourFormat(start_time);
    const dbEndTime = convertTo24HourFormat(end_time);

    // Check for overlapping bookings
    const [overlappingBookings] = await pool.query(
      `SELECT * FROM bookings 
       WHERE expert_id = ? 
       AND appointment_date = ?
       AND status IN ('pending', 'confirmed')  
       AND (
         (start_time <= ? AND end_time > ?) OR
         (start_time < ? AND end_time >= ?) OR
         (? <= start_time AND ? >= end_time)
       )`,
      [expert_id, date, dbStartTime, dbStartTime, dbEndTime, dbEndTime, dbStartTime, dbEndTime]
    );

    if (overlappingBookings.length > 0) {
      const overlappingBooking = overlappingBookings[0];
      return res.status(409).json({
        success: false,
        message: `This time slot overlaps with an existing ${overlappingBooking.session_type} session (${overlappingBooking.start_time} - ${overlappingBooking.end_time})`
      });
    }

    const bookingId = generateBookingId();

    // Get seeker name for notification
    const [seekerResult] = await pool.query(
      'SELECT name FROM users WHERE id = ?',
      [seeker_id]
    );
    const seekerName = seekerResult.length > 0 ? seekerResult[0].name : 'A seeker';

    // Get expert name for the booking record
    const [expertResult] = await pool.query(
      'SELECT name FROM users WHERE id = ?',
      [expert_id]
    );
    const expertName = expertResult.length > 0 ? expertResult[0].name : 'Expert';

    console.log(`Creating booking: seeker=${seeker_id} (${seekerName}), expert=${expert_id} (${expertName})`);

    // If no session_request_id provided, try to find the latest pending session request for this seeker
    let finalSessionRequestId = session_request_id;
    if (!finalSessionRequestId) {
      const [pendingRequests] = await pool.query(
        `SELECT id FROM session_requests 
         WHERE seeker_id = ? AND status = 'pending' 
         ORDER BY created_at DESC LIMIT 1`,
        [seeker_id]
      );
      
      if (pendingRequests.length > 0) {
        finalSessionRequestId = pendingRequests[0].id;
        console.log(`Auto-linked session request ${finalSessionRequestId} with booking ${bookingId}`);
      }
    }

    // Insert booking with all required fields including session_request_id
    const [result] = await pool.query(
      `INSERT INTO bookings (id, expert_id, seeker_id, session_request_id, appointment_date, start_time, end_time,
        session_type, status, amount, notes, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [bookingId, expert_id, seeker_id, session_request_id || null, date, start_time, end_time, session_type, status, amount, notes]
    );

    console.log(`Booking created successfully: ID=${bookingId}`);

    // Increment usage after successful booking creation - BYPASSED FOR FREE BOOKINGS
    // try {
    //   await subscriptionService.incrementUsage(seeker_id, 'expert_consultations', 1);
    //   console.log('Usage incremented for expert_consultations');
    // } catch (usageError) {
    //   console.error('Failed to increment usage:', usageError);
    // }

    // Create notification for expert
    await createNotification(
      pool,
      expert_id,
      'booking',
      `${seekerName} has booked a ${session_type} session with you on ${date} at ${start_time}`,
      bookingId
    );

    // Create notification for seeker too
    await createNotification(
      pool,
      seeker_id,
      'booking',
      `You have booked a ${session_type} session with ${expertName} on ${date} at ${start_time}`,
      bookingId
    );

    // Send email notification to expert
    try {
      await sendNewBookingEmail(expert_id, bookingId);
      console.log(` Email sent to expert ${expert_id} for new booking ${bookingId}`);
    } catch (emailError) {
      console.error(' Failed to send email to expert:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        id: bookingId,
        expert_id,
        expert_name: expertName,
        seeker_id,
        seeker_name: seekerName,
        session_request_id: finalSessionRequestId || null,
        date,
        start_time,
        end_time,
        session_type,
        status: 'draft',
        amount: amount || 0,
        notes: notes || '',
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, message: 'Failed to create booking' });
  }
});

// Update booking status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;

    if (!['draft', 'pending', 'confirmed', 'rejected', 'completed', 'cancelled', 'rescheduled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    // Require rejection reason when rejecting
    if (status === 'rejected' && !rejection_reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required when rejecting a booking'
      });
    }

    const pool = req.app.locals.db;
    
    // First check if booking exists
    const [existingBooking] = await pool.query(
      `SELECT * FROM bookings WHERE id = ?`,
      [id]
    );
    
    if (existingBooking.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const booking = existingBooking[0];

    // Update booking with rejection reason if provided
    await pool.query(
      `UPDATE bookings 
       SET status = ?, 
           rejection_reason = ?, 
           updated_at = NOW() 
       WHERE id = ?`,
      [status, status === 'rejected' ? rejection_reason : null, id]
    );

    // Update linked session request status if it exists
    if (booking.session_request_id) {
      let sessionRequestStatus = 'pending';
      if (status === 'confirmed') {
        sessionRequestStatus = 'scheduled';
      } else if (status === 'completed') {
        sessionRequestStatus = 'completed';
      } else if (status === 'rejected' || status === 'cancelled') {
        sessionRequestStatus = 'cancelled';
      }

      await pool.query(
        `UPDATE session_requests 
         SET status = ?, updated_at = NOW() 
         WHERE id = ?`,
        [sessionRequestStatus, booking.session_request_id]
      );
      console.log(`Updated session request ${booking.session_request_id} status to ${sessionRequestStatus}`);
    }

    // Create detailed notification messages based on status
    let notificationMessage = '';
    let recipientId = '';

    if (status === 'confirmed') {
      const sessionType = booking.session_type || 'session';
      notificationMessage = `Your ${sessionType} booking for ${booking.appointment_date} at ${booking.start_time} has been confirmed`;
      recipientId = booking.seeker_id;
    } else if (status === 'rejected') {
      const sessionType = booking.session_type || 'session';
      notificationMessage = `Your ${sessionType} booking for ${booking.appointment_date} at ${booking.start_time} has been rejected. Reason: ${rejection_reason}`;
      recipientId = booking.seeker_id;
    } else if (status === 'cancelled') {
      const [seekerResult] = await pool.query('SELECT name FROM users WHERE id = ?', [booking.seeker_id]);
      const seekerName = seekerResult.length > 0 ? seekerResult[0].name : 'A seeker';
      notificationMessage = `${seekerName} has cancelled their booking for ${booking.appointment_date} at ${booking.start_time}`;
      recipientId = booking.expert_id;
    } else if (status === 'rescheduled') {
      notificationMessage = `Your booking has been rescheduled to ${booking.appointment_date} at ${booking.start_time}`;
      recipientId = booking.seeker_id;
    }

    if (notificationMessage && recipientId) {
      console.log(`🔔 Creating notification for booking status update:`, {
        recipientId,
        notificationMessage,
        bookingId: id,
        status
      });
      
      try {
        await pool.query(
          `INSERT INTO notifications 
           (user_id, type, message, related_id, created_at) 
           VALUES (?, 'booking_status', ?, ?, NOW())`,
          [recipientId, notificationMessage, id]
        );
        console.log(`✅ Notification saved to database for user ${recipientId}`);
        
        // Send FCM push notification
        // Determine userRole for notification (seeker/expert)
        let userRole = '';
        if (recipientId === booking.seeker_id) userRole = 'solution_seeker';
        else if (recipientId === booking.expert_id) userRole = 'expert';
        
        console.log(`📤 Attempting to send FCM push notification:`, {
          recipientId,
          userRole,
          type: 'booking_status',
          message: notificationMessage
        });
        
        const pushResult = await sendPushNotification(pool, recipientId, 'booking_status', notificationMessage, id, userRole);
        
        if (pushResult) {
          console.log(`✅ FCM push notification sent successfully to user ${recipientId}`);
        } else {
          console.log(`⚠️ FCM push notification failed for user ${recipientId}`);
        }
      } catch (notifError) {
        console.error('❌ Error creating notification:', notifError);
      }
    } else {
      console.log(`⚠️ No notification created - missing message or recipient:`, {
        notificationMessage,
        recipientId
      });
    }

    // Send email notifications based on status
    try {
      if (status === 'confirmed') {
        await sendBookingAcceptedEmail(booking.seeker_id, id);
        console.log(` Email sent to seeker ${booking.seeker_id} for booking accepted`);
      } else if (status === 'rejected') {
        await sendBookingRejectedEmail(booking.seeker_id, id, { rejection_reason });
        console.log(` Email sent to seeker ${booking.seeker_id} for booking rejected`);
      }
    } catch (emailError) {
      console.error(' Failed to send email notification:', emailError);
    }

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: {
        id,
        status,
        rejection_reason: status === 'rejected' ? rejection_reason : null,
        updated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ success: false, message: 'Failed to update booking status' });
  }
});

// Reschedule booking endpoint
router.put('/:id/reschedule', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { date, start_time, end_time, booking_id } = req.body;
    const pool = req.app.locals.db;
    
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Get booking details first
    const [bookingDetails] = await connection.query(
      'SELECT seeker_id FROM bookings WHERE id = ?',
      [id]
    );

    if (bookingDetails.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const booking = bookingDetails[0];

    // Check for existing bookings in that time slot
    const [existingBookings] = await connection.query(
      `SELECT id FROM bookings 
       WHERE expert_id = (SELECT expert_id FROM bookings WHERE id = ?)
       AND appointment_date = ? 
       AND id != ?
       AND status IN ('pending', 'confirmed')
       AND (
         (start_time <= ? AND end_time > ?) OR
         (start_time < ? AND end_time >= ?) OR
         (? <= start_time AND ? >= end_time)
       )`,
      [id, date, booking_id, start_time, start_time, end_time, end_time, start_time, end_time]
    );

    if (existingBookings.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: 'This time slot is not available. Please choose another time.'
      });
    }

    // Update the booking
    await connection.query(
      `UPDATE bookings 
       SET appointment_date = ?, 
           start_time = ?, 
           end_time = ?, 
           updated_at = NOW()
       WHERE id = ?`,
      [date, start_time, end_time, id]
    );

    await connection.commit();
    
    // Send email notification for rescheduled booking
    try {
      await sendBookingRescheduledEmail(booking.seeker_id, id);
      console.log(` Email sent to seeker for rescheduled booking ${id}`);
    } catch (emailError) {
      console.error(' Failed to send reschedule email:', emailError);
    }
    
    res.json({
      success: true,
      message: 'Booking rescheduled successfully'
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error in reschedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reschedule booking'
    });
  }
});

// Add this helper function to check time slot availability
async function checkTimeSlotAvailability(pool, expertId, date, startTime, endTime, excludeBookingId = null) {
  const [overlappingBookings] = await pool.query(
    `SELECT id, start_time, end_time 
     FROM bookings 
     WHERE expert_id = ? 
     AND appointment_date = ?
     AND status IN ('pending', 'confirmed')
     AND id != ?
     AND (
       (start_time <= ? AND end_time > ?) OR
       (start_time < ? AND end_time >= ?) OR
       (? <= start_time AND ? >= end_time)
     )`,
    [expertId, date, excludeBookingId || '', startTime, startTime, endTime, endTime, startTime, endTime]
  );

  return overlappingBookings.length === 0;
}

// Helper function to convert time from "2:00 PM" format to "14:00:00" format
function convertTo24HourFormat(timeStr) {
  try {
    // If already in 24-hour format, just add seconds if missing
    if (!timeStr.includes('AM') && !timeStr.includes('PM')) {
      return timeStr.includes(':') ? `${timeStr}:00` : timeStr;
    }
    
    const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeMatch) return '00:00:00';
    
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const period = timeMatch[3].toUpperCase();
    
    // Convert to 24-hour format
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    // Format as HH:MM:SS
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  } catch (error) {
    console.error('Error converting time format:', error);
    return '00:00:00'; // Default fallback
  }
}

// Helper to calculate end time
function calculateEndTime(startTime) {
  const [hour, minute, second] = startTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(hour, minute, second, 0);
  
  // To change the session duration, modify the number below.
  // The duration is in minutes.
  const sessionDurationInMinutes = 60; // This is for a 1-hour session.
  
  // For a 10-minute session, change the line above to:
  // const sessionDurationInMinutes = 10;
  
  startDate.setMinutes(startDate.getMinutes() + sessionDurationInMinutes);
  
  const endHour = startDate.getHours().toString().padStart(2, '0');
  const endMinute = startDate.getMinutes().toString().padStart(2, '0');
  const endSecond = startDate.getSeconds().toString().padStart(2, '0');
  
  return `${endHour}:${endMinute}:${endSecond}`;
}

// Get booking by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = req.app.locals.db;

    // The user must be authenticated to access a specific booking
    const [bookingResult] = await pool.query(
      `SELECT b.*,
              e.name as expert_name,
              s.name as seeker_name,
              sr.problem_statement,
              sr.desired_solution,
              sr.functionality,
              sr.id as session_request_id
       FROM bookings b
       LEFT JOIN users e ON b.expert_id = e.id
       LEFT JOIN users s ON b.seeker_id = s.id
       LEFT JOIN session_requests sr ON b.session_request_id = sr.id
       WHERE b.id = ?`,
      [id]
    );

    if (bookingResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    let booking = bookingResult[0];

    // If real_start_time is null and status is confirmed, set it to NOW()
    if (!booking.real_start_time && booking.status === 'confirmed') {
      await pool.query('UPDATE bookings SET real_start_time = NOW() WHERE id = ?', [id]);
      // Re-fetch to get the updated real_start_time
      const [updated] = await pool.query(
        `SELECT real_start_time FROM bookings WHERE id = ?`,
        [id]
      );
      booking.real_start_time = updated[0].real_start_time;
    }

    // Always return real_start_time as ISO string (or null)
    booking.real_start_time = booking.real_start_time ? new Date(booking.real_start_time).toISOString() : null;

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('Error fetching booking by ID:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch booking' });
  }
});

// Add this route to get booking stats
router.get('/stats/:expertId', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await req.app.locals.db.getConnection();
    
    // Get total completed sessions
    const [totalSessions] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM bookings 
      WHERE expert_id = ? AND status = 'completed'
    `, [req.params.expertId]);

    // Get pending bookings count
    const [pendingBookings] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM bookings 
      WHERE expert_id = ? AND status = 'pending'
    `, [req.params.expertId]);

    res.json({
      success: true,
      data: {
        totalSessions: totalSessions[0].count,
        pendingBookings: pendingBookings[0].count
      }
    });
  } catch (error) {
    console.error('Error fetching booking stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking statistics'
    });
  } finally {
    if (connection) connection.release();
  }
});



// NEW: Get booking stats for a seeker
router.get('/stats/seeker/:seeker_id', async (req, res) => {
  try {
    const { seeker_id } = req.params;
    const pool = req.app.locals.db;

    const [stats] = await pool.query(
      `SELECT 
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings
       FROM bookings 
       WHERE seeker_id = ?`,
      [seeker_id]
    );

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Error fetching booking stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch booking statistics' 
    });
  }
});

// NEW: Get confirmed bookings for a seeker
router.get('/confirmed/seeker/:seeker_id', async (req, res) => {
  try {
    const { seeker_id } = req.params;
    const pool = req.app.locals.db;

    const [bookings] = await pool.query(
      `SELECT b.*, 
              e.first_name as expert_first_name,
              e.last_name as expert_last_name,
              e.designation as expert_designation
       FROM bookings b
       LEFT JOIN expert_profiles e ON b.expert_id = e.user_id
       WHERE b.seeker_id = ? 
         AND b.status = 'confirmed'
       ORDER BY b.appointment_date ASC, b.start_time ASC`,
      [seeker_id]
    );

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching confirmed bookings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch confirmed bookings' 
    });
  }
});

// Mark participant as joined and set real_start_time if both joined
router.post('/:id/join', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;
    const pool = req.app.locals.db;

    // Get booking
    const [bookingResult] = await pool.query('SELECT * FROM bookings WHERE id = ?', [id]);
    if (bookingResult.length === 0) return res.status(404).json({ success: false, message: 'Booking not found' });
    const booking = bookingResult[0];

    // Mark the user as joined
    if (userId === booking.expert_id) {
      await pool.query('UPDATE bookings SET expert_joined = TRUE WHERE id = ?', [id]);
    } else if (userId === booking.seeker_id) {
      await pool.query('UPDATE bookings SET seeker_joined = TRUE WHERE id = ?', [id]);
    } else {
      return res.status(403).json({ success: false, message: 'Not authorized for this session' });
    }

    // Re-fetch joined status
    const [updatedBookingResult] = await pool.query('SELECT expert_joined, seeker_joined, real_start_time, count FROM bookings WHERE id = ?', [id]);
    const updated = updatedBookingResult[0];

    // If both have joined and real_start_time is not set, set it now and increment count
    if (!updated.real_start_time && updated.expert_joined && updated.seeker_joined) {
      await pool.query('UPDATE bookings SET real_start_time = NOW(), count = count + 1 WHERE id = ?', [id]);
    }

    // Return whether real_start_time is set
    const [finalBookingResult] = await pool.query('SELECT real_start_time FROM bookings WHERE id = ?', [id]);
    const realStartTime = finalBookingResult[0].real_start_time;

    res.json({ success: true, real_start_time: realStartTime });
  } catch (error) {
    console.error('Error in join session:', error);
    res.status(500).json({ success: false, message: 'Failed to join session' });
  }
});

// this is last one to join 
// Check slot availability (for rescheduling and new bookings)
router.post('/check-availability', async (req, res) => {
  try {
    const { expert_id, date, start_time, end_time, exclude_booking_id } = req.body;
    if (!expert_id || !date || !start_time || !end_time) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const pool = req.app.locals.db;
    // Convert time format for database storage
    const dbStartTime = convertTo24HourFormat(start_time);
    const dbEndTime = convertTo24HourFormat(end_time);
    const available = await checkTimeSlotAvailability(pool, expert_id, date, dbStartTime, dbEndTime, exclude_booking_id);
    res.json({ available });
  } catch (error) {
    console.error('Error checking slot availability:', error);
    res.status(500).json({ success: false, message: 'Failed to check slot availability' });
  }
});

// Endpoint to check if both participants have joined a session
router.get('/:id/join-status', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = req.app.locals.db;
    const [result] = await pool.query(
      'SELECT expert_joined, seeker_joined, real_start_time, real_end_time FROM bookings WHERE id = ?',
      [id]
    );
    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    const { expert_joined, seeker_joined, real_start_time, real_end_time } = result[0];
    const bothJoined = !!expert_joined && !!seeker_joined;
    
    res.json({ 
      success: true,
      bothJoined,
      expert_joined,
      seeker_joined,
      real_start_time,
      real_end_time
    });
  } catch (error) {
    console.error('Error checking join status:', error);
    res.status(500).json({ success: false, message: 'Failed to check join status' });
  }
});


// End call and check if feedback should be shown
router.post('/:id/end-call', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = req.app.locals.db;
    
    console.log(`🔚 End call request for booking: ${id}`);
    
    // First check if booking exists
    const [bookingCheck] = await pool.query(
      'SELECT id FROM bookings WHERE id = ?',
      [id]
    );
    
    if (bookingCheck.length === 0) {
      console.log(`❌ Booking ${id} not found`);
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    // Check join status with better error handling
    const [result] = await pool.query(
      'SELECT expert_joined, seeker_joined, real_start_time FROM bookings WHERE id = ?',
      [id]
    );
    
    if (result.length === 0) {
      console.log(`❌ No join status found for booking ${id}`);
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    const booking = result[0];
    const expertJoined = !!booking.expert_joined;
    const seekerJoined = !!booking.seeker_joined;
    const bothJoined = expertJoined && seekerJoined;
    const hasRealStartTime = !!booking.real_start_time;
    
    console.log(`📊 End call status for booking ${id}:`, {
      expert_joined: booking.expert_joined,
      seeker_joined: booking.seeker_joined,
      expert_joined_bool: expertJoined,
      seeker_joined_bool: seekerJoined,
      both_joined: bothJoined,
      has_real_start_time: hasRealStartTime,
      real_start_time: booking.real_start_time
    });
    
    // Show feedback only if both participants actually joined the call
    const showFeedback = bothJoined && hasRealStartTime;
    
    console.log(`✅ End call response for booking ${id}: showFeedback = ${showFeedback}`);
    
    res.json({ 
      success: true, 
      showFeedback,
      debug: {
        expert_joined: expertJoined,
        seeker_joined: seekerJoined,
        both_joined: bothJoined,
        has_real_start_time: hasRealStartTime
      }
    });
  } catch (error) {
    console.error('❌ Error in /:id/end-call:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Simple endpoint to check current join status
router.get('/:id/current-status', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = req.app.locals.db;
    
    console.log(`🔍 Checking current status for booking: ${id}`);
    
    const [result] = await pool.query(
      'SELECT expert_joined, seeker_joined, real_start_time, real_end_time, expert_id, seeker_id FROM bookings WHERE id = ?',
      [id]
    );
    
    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    const booking = result[0];
    const bothJoined = booking.expert_joined && booking.seeker_joined;
    
    console.log(`📊 Current status for booking ${id}:`, {
      expert_joined: booking.expert_joined,
      seeker_joined: booking.seeker_joined,
      both_joined: bothJoined,
      real_start_time: booking.real_start_time,
      real_end_time: booking.real_end_time,
      expert_id: booking.expert_id,
      seeker_id: booking.seeker_id
    });
    
    res.json({
      success: true,
      booking_id: id,
      expert_joined: booking.expert_joined,
      seeker_joined: booking.seeker_joined,
      both_joined: bothJoined,
      real_start_time: booking.real_start_time,
      real_end_time: booking.real_end_time,
      expert_id: booking.expert_id,
      seeker_id: booking.seeker_id
    });
    
  } catch (error) {
    console.error('❌ Error checking current status:', error);
    res.status(500).json({ success: false, message: 'Failed to check current status' });
  }
});

// Debug endpoint to manually check and reset join flags
router.get('/:id/debug-join-status', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = req.app.locals.db;
    
    console.log(`🔧 Debug: Checking join status for booking: ${id}`);
    
    // Get current state
    const [result] = await pool.query(
      'SELECT expert_joined, seeker_joined, real_start_time, real_end_time, expert_id, seeker_id FROM bookings WHERE id = ?',
      [id]
    );
    
    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    const booking = result[0];
    
    console.log(`🔧 Debug: Current database state for booking ${id}:`, {
      expert_joined: booking.expert_joined,
      seeker_joined: booking.seeker_joined,
      expert_joined_type: typeof booking.expert_joined,
      seeker_joined_type: typeof booking.seeker_joined,
      real_start_time: booking.real_start_time,
      real_end_time: booking.real_end_time,
      expert_id: booking.expert_id,
      seeker_id: booking.seeker_id
    });
    
    // Check if there's an issue with the boolean values
    const expertJoinedBool = !!booking.expert_joined;
    const seekerJoinedBool = !!booking.seeker_joined;
    const bothJoined = expertJoinedBool && seekerJoinedBool;
    
    console.log(`🔧 Debug: Boolean conversion:`, {
      expert_joined_original: booking.expert_joined,
      expert_joined_bool: expertJoinedBool,
      seeker_joined_original: booking.seeker_joined,
      seeker_joined_bool: seekerJoinedBool,
      both_joined: bothJoined
    });
    
    res.json({
      success: true,
      booking_id: id,
      raw_data: {
        expert_joined: booking.expert_joined,
        seeker_joined: booking.seeker_joined,
        expert_joined_type: typeof booking.expert_joined,
        seeker_joined_type: typeof booking.seeker_joined
      },
      boolean_conversion: {
        expert_joined: expertJoinedBool,
        seeker_joined: seekerJoinedBool,
        both_joined: bothJoined
      },
      timestamps: {
        real_start_time: booking.real_start_time,
        real_end_time: booking.real_end_time
      },
      participants: {
        expert_id: booking.expert_id,
        seeker_id: booking.seeker_id
      }
    });
    
  } catch (error) {
    console.error('❌ Error in debug join status:', error);
    res.status(500).json({ success: false, message: 'Failed to debug join status' });
  }
});

// Add a new route for expert's upcoming meetings and recent activity
router.get('/expert/dashboard/:expert_id', async (req, res) => {
  try {
    const { expert_id } = req.params;
    const pool = req.app.locals.db;

    // Modified query to properly format the appointment date
    const [upcomingMeetings] = await pool.query(
      `SELECT b.*, 
              COALESCE(s.name, 'Unknown Seeker') AS seeker_name,
              DATE_FORMAT(b.appointment_date, '%Y-%m-%d') AS appointment_date,
              TIME_FORMAT(b.start_time, '%h:%i %p') AS start_time,
              TIME_FORMAT(b.end_time, '%h:%i %p') AS end_time,
              CASE 
                WHEN b.appointment_date = CURDATE() THEN 'Today'
                WHEN b.appointment_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY) THEN 'Tomorrow'
                ELSE DATE_FORMAT(b.appointment_date, '%W, %M %d')
              END AS display_date,
              b.appointment_date = CURDATE() AS is_today
       FROM bookings b
       LEFT JOIN users s ON b.seeker_id = s.id
       WHERE b.expert_id = ? 
         AND b.status = 'confirmed' 
         AND b.appointment_date >= CURDATE()
       ORDER BY b.appointment_date ASC, b.start_time ASC
       LIMIT 5`,
      [expert_id]
    );

    // Transform the data to ensure proper date formatting
    const transformedMeetings = upcomingMeetings.map(meeting => ({
      id: meeting.id,
      seeker_name: meeting.seeker_name,
      appointment_date: meeting.appointment_date, // Now properly formatted as YYYY-MM-DD
      display_date: meeting.display_date,
      start_time: meeting.start_time,
      end_time: meeting.end_time,
      session_type: meeting.session_type,
      status: meeting.status,
      is_today: !!meeting.is_today // Convert to boolean
    }));

    res.status(200).json({
      success: true,
      data: {
        upcomingMeetings: transformedMeetings
      }
    });

  } catch (error) {
    console.error('Error fetching expert dashboard data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch dashboard data' 
    });
  }
});

// Helper function to generate activity descriptions
function getActivityDescription(activity) {
  const date = new Date(activity.appointment_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
  const time = new Date(`2000-01-01 ${activity.start_time}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });

  switch (activity.activity_type) {
    case 'booking_confirmed':
      return `Confirmed ${activity.session_type} session for ${date} at ${time}`;
    case 'session_completed':
      return `Completed ${activity.session_type} session with ${activity.seeker_name}`;
    case 'booking_cancelled':
      return `Cancelled session scheduled for ${date}`;
    case 'new_booking':
      return `New booking request for ${date} at ${time}`;
    default:
      return `Updated ${activity.session_type} session details`;
  }
}

// Add these new routes for expert dashboard data
router.get('/expert/:expert_id/confirmed', async (req, res) => {
  try {
    const { expert_id } = req.params;
    const pool = req.app.locals.db;

    const [confirmedBookings] = await pool.query(
      `SELECT 
        b.id,
        b.appointment_date,
        TIME_FORMAT(b.start_time, '%h:%i %p') as start_time,
        TIME_FORMAT(b.end_time, '%h:%i %p') as end_time,
        b.session_type,
        b.status,
        COALESCE(s.name, 'Unknown Seeker') as seeker_name,
        CASE 
          WHEN b.appointment_date = CURDATE() THEN TRUE 
          ELSE FALSE 
        END as is_today
       FROM bookings b
       LEFT JOIN users s ON b.seeker_id = s.id
       WHERE b.expert_id = ? 
         AND b.status = 'confirmed'
         AND b.appointment_date >= CURDATE()
       ORDER BY b.appointment_date ASC, b.start_time ASC
       LIMIT 5`,
      [expert_id]
    );

    res.json({
      success: true,
      data: confirmedBookings.map(booking => ({
        ...booking,
        appointment_date: new Date(booking.appointment_date).toISOString().split('T')[0]
      }))
    });

  } catch (error) {
    console.error('Error fetching confirmed bookings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch confirmed bookings' 
    });
  }
});

router.get('/expert/:expert_id/completed', async (req, res) => {
  try {
    const { expert_id } = req.params;
    const pool = req.app.locals.db;

    const [completedBookings] = await pool.query(
      `SELECT 
        b.id,
        b.appointment_date,
        b.session_type,
        b.status,
        b.updated_at as completed_at,
        COALESCE(s.name, 'Unknown Seeker') as seeker_name
       FROM bookings b
       LEFT JOIN users s ON b.seeker_id = s.id
       WHERE b.expert_id = ? 
         AND b.status = 'completed'
       ORDER BY b.updated_at DESC
       LIMIT 10`,
      [expert_id]
    );

    res.json({
      success: true,
      data: completedBookings.map(booking => ({
        id: booking.id,
        seeker_name: booking.seeker_name,
        session_type: booking.session_type,
        completed_at: new Date(booking.completed_at).toISOString(),
        status: 'completed'
      }))
    });

  } catch (error) {
    console.error('Error fetching completed bookings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch completed bookings' 
    });
  }
});

// Add a stats route for the expert dashboard
router.get('/expert/:expert_id/stats', async (req, res) => {
  try {
    const { expert_id } = req.params;
    const pool = req.app.locals.db;

    const [stats] = await pool.query(
      `SELECT 
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'confirmed' AND appointment_date >= CURDATE() THEN 1 ELSE 0 END) as upcoming_confirmed,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as total_completed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_requests
       FROM bookings 
       WHERE expert_id = ?`,
      [expert_id]
    );

    res.json({
      success: true,
      data: stats[0]
    });

  } catch (error) {
    console.error('Error fetching expert stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch expert statistics' 
    });
  }
});

// Get session request details for a booking
router.get('/:id/session-request', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = req.app.locals.db;

    // First check if the booking exists and user has access
    const [bookingResult] = await pool.query(
      `SELECT b.*, sr.id as session_request_id
       FROM bookings b
       LEFT JOIN session_requests sr ON b.session_request_id = sr.id
       WHERE b.id = ? AND (b.expert_id = ? OR b.seeker_id = ?)`,
      [id, req.user.user_id, req.user.user_id]
    );

    if (bookingResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found or unauthorized' });
    }

    const booking = bookingResult[0];
    let sessionRequest = null;

    if (booking.session_request_id) {
      // Fetch the session request details
      const [requests] = await pool.query(
        `SELECT sr.*, u.name as seeker_name
         FROM session_requests sr
         JOIN users u ON sr.seeker_id = u.id
         WHERE sr.id = ?`,
        [booking.session_request_id]
      );
      if (requests.length > 0) sessionRequest = requests[0];
    } else {
      // Fallback: fetch latest pending session request for this seeker
      const [requests] = await pool.query(
        `SELECT sr.*, u.name as seeker_name
         FROM session_requests sr
         JOIN users u ON sr.seeker_id = u.id
         WHERE sr.seeker_id = ? AND sr.status = 'pending' ORDER BY sr.created_at DESC LIMIT 1`,
        [booking.seeker_id]
      );
      if (requests.length > 0) sessionRequest = requests[0];
    }

    if (!sessionRequest) {
      return res.status(404).json({ success: false, message: 'No session request found for this booking' });
    }

    res.json({ success: true, data: sessionRequest });
  } catch (error) {
    console.error('Error fetching session request for booking:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch session request details' });
  }
});

// Add this new route for draft bookings
router.post('/draft', authenticateToken, async (req, res) => {
  try {
    // Get seeker_id from token or request body
    let userId = getSeekerIdFromToken(req);
    if (!userId && req.body.seeker_id) {
      userId = req.body.seeker_id;
    }
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid or missing token' });
    }

    const { 
      expert_id, 
      seeker_name, // This might be added in your updated code
      date, 
      start_time, 
      end_time, 
      session_type, 
      amount, 
      notes = '',
      session_request_id,
      // Add this line to extract status from request body:
      status = 'draft'  // Default to 'draft' if not provided
    } = req.body;

    // Use the userId as seeker_id
    const seeker_id = userId;

    if (!expert_id || !date || !start_time || !end_time || !session_type) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const pool = req.app.locals.db;

    // Convert time format for database storage
    const dbStartTime = convertTo24HourFormat(start_time);
    const dbEndTime = convertTo24HourFormat(end_time);

    // Check for overlapping bookings
    const [overlappingBookings] = await pool.query(
      `SELECT * FROM bookings 
       WHERE expert_id = ? 
       AND appointment_date = ?
       AND status IN ('pending', 'confirmed')  
       AND (
         (start_time <= ? AND end_time > ?) OR
         (start_time < ? AND end_time >= ?) OR
         (? <= start_time AND ? >= end_time)
       )`,
      [expert_id, date, dbStartTime, dbStartTime, dbEndTime, dbEndTime, dbStartTime, dbEndTime]
    );

    if (overlappingBookings.length > 0) {
      const overlappingBooking = overlappingBookings[0];
      return res.status(409).json({
        success: false,
        message: `This time slot overlaps with an existing ${overlappingBooking.session_type} session (${overlappingBooking.start_time} - ${overlappingBooking.end_time})`
      });
    }

    const bookingId = generateBookingId();

    // Get seeker name for reference
    const [seekerResult] = await pool.query(
      'SELECT name FROM users WHERE id = ?',
      [seeker_id]
    );
    const seekerName = seekerResult.length > 0 ? seekerResult[0].name : 'A seeker';

    // Get expert name for the booking record
    const [expertResult] = await pool.query(
      'SELECT name FROM users WHERE id = ?',
      [expert_id]
    );
    const expertName = expertResult.length > 0 ? expertResult[0].name : 'Expert';

    console.log(`Creating draft booking: seeker=${seeker_id} (${seekerName}), expert=${expert_id} (${expertName})`);

    // If no session_request_id provided, try to find the latest pending session request for this seeker
    let finalSessionRequestId = session_request_id;
    if (!finalSessionRequestId) {
      const [pendingRequests] = await pool.query(
        `SELECT id FROM session_requests 
         WHERE seeker_id = ? AND status = 'pending' 
         ORDER BY created_at DESC LIMIT 1`,
        [seeker_id]
      );
      
      if (pendingRequests.length > 0) {
        finalSessionRequestId = pendingRequests[0].id;
        console.log(`Auto-linked session request ${finalSessionRequestId} with draft booking ${bookingId}`);
      }
    }

    // Insert booking with 'draft' status
    await pool.query(
      `INSERT INTO bookings (id, expert_id, seeker_id, session_request_id, appointment_date, start_time, end_time,
        session_type, status, amount, notes, created_at, payment_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, NOW(), 'PENDING')`,
      [bookingId, expert_id, seeker_id, finalSessionRequestId || null, date, dbStartTime, dbEndTime, session_type, amount || 0, notes || '']
    );

    console.log(`Draft booking created successfully: ID=${bookingId}`);

    // No notifications for draft bookings - we'll create them after payment

    res.status(201).json({
      success: true,
      message: 'Draft booking created successfully',
      data: {
        id: bookingId,
        expert_id,
        expert_name: expertName,
        seeker_id,
        seeker_name: seekerName,
        session_request_id: finalSessionRequestId || null,
        date,
        start_time,
        end_time,
        session_type,
        status: 'draft',
        payment_status: 'PENDING',
        amount: amount || 0,
        notes: notes || '',
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating draft booking:', error);
    res.status(500).json({ success: false, message: 'Failed to create draft booking' });
  }
});

// Add this to your booking routes file
router.put('/bookings/:bookingId/status', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, payment_status, transactionId } = req.body;
    
    const pool = req.app.locals.db;
    
    // Validate the booking exists
    const [bookings] = await pool.query(
      'SELECT * FROM bookings WHERE id = ?',
      [bookingId]
    );
    
    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Update booking status and payment status
    await pool.query(
      'UPDATE bookings SET status = ?, payment_status = ? WHERE id = ?',
      [status, payment_status, bookingId]
    );
    
    // If transaction ID provided, link it to the payment_transactions table
    if (transactionId) {
      // Check if transaction already exists
      const [existingTxns] = await pool.query(
        'SELECT * FROM payment_transactions WHERE merchant_transaction_id = ?',
        [transactionId]
      );
      
      if (existingTxns.length === 0) {
        // Create transaction record if not exists
        await pool.query(
          `INSERT INTO payment_transactions 
           (booking_id, merchant_transaction_id, amount, status, payment_type)
           VALUES (?, ?, ?, ?, ?)`,
          [
            bookingId,
            transactionId,
            bookings[0].amount,
            payment_status === 'PAID' ? 'success' : 'failed',
            'booking'
          ]
        );
      } else {
        // Update existing transaction
        await pool.query(
          `UPDATE payment_transactions 
           SET status = ?, booking_id = ?
           WHERE merchant_transaction_id = ?`,
          [
            payment_status === 'PAID' ? 'success' : 'failed',
            bookingId,
            transactionId
          ]
        );
      }
    }
    
    return res.json({
      success: true,
      message: `Booking status updated to ${status}`
    });
    
  } catch (error) {
    console.error('Error updating booking status:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating booking status'
    });
  }
});

// Add this route to update draft to pending after payment
router.put('/:id/payment-confirm', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionId } = req.body;

    if (!id || !transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: booking ID or transaction ID'
      });
    }

    const pool = req.app.locals.db;
    
    // Verify the booking exists and is in draft status
    const [bookingResult] = await pool.query(
      'SELECT * FROM bookings WHERE id = ?',
      [id]
    );
    
    if (bookingResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    const booking = bookingResult[0];
    
    // Update booking status from draft to pending and set payment status to PAID
    await pool.query(
      'UPDATE bookings SET status = ?, payment_status = ? WHERE id = ?',
      ['pending', 'PAID', id]
    );
    
    // Link the transaction
    await pool.query(
      `INSERT INTO payment_transactions (booking_id, merchant_transaction_id, amount, status, payment_type)
       VALUES (?, ?, ?, 'success', 'booking')
       ON DUPLICATE KEY UPDATE status = 'success'`,
      [id, transactionId, booking.amount]
    );

    // Now create notifications since payment is confirmed and status is pending
    // Get seeker name for notification
    const [seekerResult] = await pool.query(
      'SELECT name FROM users WHERE id = ?',
      [booking.seeker_id]
    );
    const seekerName = seekerResult.length > 0 ? seekerResult[0].name : 'A seeker';

    // Create notification for expert
    await createNotification(
      pool,
      booking.expert_id,
      'booking',
      `${seekerName} has booked a ${booking.session_type} session with you on ${booking.appointment_date} at ${booking.start_time}`,
      id
    );

    // Create notification for seeker too
    const [expertResult] = await pool.query(
      'SELECT name FROM users WHERE id = ?',
      [booking.expert_id]
    );
    const expertName = expertResult.length > 0 ? expertResult[0].name : 'Expert';
    
    await createNotification(
      pool,
      booking.seeker_id,
      'booking',
      `You have booked a ${booking.session_type} session with ${expertName} on ${booking.appointment_date} at ${booking.start_time}`,
      id
    );

    // Send email notification to expert
    try {
      await sendNewBookingEmail(booking.expert_id, id);
      console.log(`Email sent to expert ${booking.expert_id} for new booking ${id}`);
    } catch (emailError) {
      console.error('Failed to send email to expert:', emailError);
    }

    res.json({
      success: true,
      message: 'Booking updated from draft to pending after payment',
      data: {
        id,
        status: 'pending',
        payment_status: 'PAID',
        transactionId
      }
    });
  } catch (error) {
    console.error('Error confirming booking payment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to confirm booking payment' 
    });
  }
});

module.exports = router;

// Debug endpoint to check table structure
router.get('/debug/table-structure', async (req, res) => {
  try {
    const pool = req.app.locals.db;
    
    // Check if the required columns exist
    const [columns] = await pool.query(
      "SHOW COLUMNS FROM bookings LIKE '%joined%'"
    );
    
    // Also check for real_start_time column
    const [timeColumns] = await pool.query(
      "SHOW COLUMNS FROM bookings LIKE '%real_%'"
    );
    
    // Get a sample booking to see current data
    const [sampleBooking] = await pool.query(
      'SELECT id, expert_joined, seeker_joined, real_start_time FROM bookings LIMIT 1'
    );
    
    res.json({
      success: true,
      joined_columns: columns,
      time_columns: timeColumns,
      sample_booking: sampleBooking[0] || null
    });
  } catch (error) {
    console.error('Error checking table structure:', error);
    res.status(500).json({ success: false, message: 'Failed to check table structure', error: error.message });
  }
});