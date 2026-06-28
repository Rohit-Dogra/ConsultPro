// Update session status
router.put('/:bookingId/status', async (req, res) => {
  const { bookingId } = req.params;
  const { status, reason } = req.body;
  const userId = req.user.id; // Assuming you have user info in req.user

  try {
    // Get booking details
    const bookingResult = await pool.query(
      `SELECT b.*, e.user_id as expert_id, s.user_id as seeker_id 
       FROM bookings b 
       JOIN experts e ON b.expert_id = e.id 
       JOIN seekers s ON b.seeker_id = s.id 
       WHERE b.id = $1`,
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];
    const isExpert = booking.expert_id === userId;

    // Verify user has permission to update status
    if (!isExpert && booking.seeker_id !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this booking' });
    }

    // Update booking status
    const result = await pool.query(
      `UPDATE bookings 
       SET status = $1, 
           updated_at = CURRENT_TIMESTAMP,
           ${isExpert ? 'expert_reason' : 'seeker_reason'} = $2
       WHERE id = $3 
       RETURNING *`,
      [status, reason, bookingId]
    );

    const updatedBooking = result.rows[0];

    // Determine notification details based on status and who made the change
    let notificationType, notificationMessage, statusColor, recipientId;

    if (isExpert) {
      recipientId = booking.seeker_id;
      switch (status) {
        case 'accepted':
          notificationType = 'session_accepted';
          notificationMessage = `Your session with ${booking.expert_name} has been accepted`;
          statusColor = 'success';
          break;
        case 'rejected':
          notificationType = 'session_rejected';
          notificationMessage = `Your session with ${booking.expert_name} has been rejected${reason ? `: ${reason}` : ''}`;
          statusColor = 'error';
          break;
        case 'rescheduled':
          notificationType = 'session_rescheduled';
          notificationMessage = `Your session with ${booking.expert_name} has been rescheduled${reason ? `: ${reason}` : ''}`;
          statusColor = 'warning';
          break;
      }
    } else {
      recipientId = booking.expert_id;
      switch (status) {
        case 'cancelled':
          notificationType = 'session_cancelled';
          notificationMessage = `Your session with ${booking.seeker_name} has been cancelled${reason ? `: ${reason}` : ''}`;
          statusColor = 'error';
          break;
        case 'rescheduled':
          notificationType = 'session_rescheduled';
          notificationMessage = `Your session with ${booking.seeker_name} has been rescheduled${reason ? `: ${reason}` : ''}`;
          statusColor = 'warning';
          break;
      }
    }

    // Create notification
    if (notificationType && recipientId) {
      await pool.query(
        `INSERT INTO notifications 
         (user_id, type, message, related_id, status_color) 
         VALUES ($1, $2, $3, $4, $5)`,
        [recipientId, notificationType, notificationMessage, bookingId, statusColor]
      );

      // Get recipient's notification token
      const userResult = await pool.query(
        'SELECT notification_token FROM users WHERE id = $1',
        [recipientId]
      );

      const notificationToken = userResult.rows[0]?.notification_token;

      // Send push notification if token exists
      if (notificationToken) {
        const message = {
          notification: {
            title: notificationType.split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' '),
            body: notificationMessage
          },
          data: {
            type: notificationType,
            related_id: bookingId,
            status_color: statusColor
          },
          token: notificationToken
        };

        try {
          await admin.messaging().send(message);
          console.log('Successfully sent notification:', notificationToken);
        } catch (error) {
          console.error('Error sending notification:', error);
          // Don't fail the request if push notification fails
        }
      }
    }

    res.json({ success: true, data: updatedBooking });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ success: false, error: 'Failed to update booking status' });
  }
}); 