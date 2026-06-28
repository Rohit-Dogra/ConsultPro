const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { pool } = require('../server');

// Create a new session request
router.post('/', authenticateToken, async (req, res) => {
  let connection;
  try {
    const { 
      problem_statement, 
      desired_solution, 
      functionality,
      functionality_id,
      is_custom_functionality,
      selected_objectives // Add this line
    } = req.body;
    const seeker_id = req.user.user_id;

    // Log the received data for debugging
    console.log('Creating session request:', {
      seeker_id,
      functionality,
      functionality_id,
      is_custom_functionality,
      selected_objectives_count: selected_objectives?.length || 0
    });

    // Validate required fields
    if (!problem_statement || !desired_solution || !functionality) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();
    const requestId = await generateUniqueRequestId(connection);

    // Validate functionality if not custom
    if (functionality_id && !is_custom_functionality) {
      const [functionalities] = await connection.execute(
        'SELECT id FROM expert_functionality_options WHERE id = ?',
        [functionality_id]
      );
      
      if (functionalities.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid functionality selected'
        });
      }
    }

    // Insert request with functionality_id and selected_objectives_json
    await connection.execute(
      `INSERT INTO session_requests 
       (id, seeker_id, problem_statement, desired_solution, functionality, functionality_id, is_custom_functionality, selected_objectives_json, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [requestId, seeker_id, problem_statement, desired_solution, functionality, functionality_id, is_custom_functionality ? 1 : 0, JSON.stringify(selected_objectives || [])]
    );

    // Log selected objectives for debugging
    if (selected_objectives && selected_objectives.length > 0) {
      console.log(`✅ Session request ${requestId} created with ${selected_objectives.length} objectives:`, selected_objectives);
    }

    // Auto-link with any pending bookings for this seeker that don't have a session_request_id
    const [pendingBookings] = await connection.execute(
      `SELECT id FROM bookings 
       WHERE seeker_id = ? AND session_request_id IS NULL AND status = 'pending'`,
      [seeker_id]
    );

    if (pendingBookings.length > 0) {
      // Link the oldest pending booking with this session request
      const oldestBooking = pendingBookings[0];
      await connection.execute(
        `UPDATE bookings SET session_request_id = ? WHERE id = ?`,
        [requestId, oldestBooking.id]
      );
      console.log(`Auto-linked session request ${requestId} with booking ${oldestBooking.id}`);
    }

    await connection.commit();

    // Fetch created request with functionality name
    const [request] = await connection.execute(
      `SELECT sr.*, efo.display_name as functionality_name
       FROM session_requests sr
       LEFT JOIN expert_functionality_options efo ON sr.functionality_id = efo.id
       WHERE sr.id = ?`,
      [requestId]
    );

    // Parse selected_objectives_json and add to response data
    const requestData = request[0];
    const selectedObjectivesJson = requestData.selected_objectives_json;
    let selectedObjectives = [];
    
    if (selectedObjectivesJson) {
      try {
        console.log('Raw selected_objectives_json:', selectedObjectivesJson);
        selectedObjectives = JSON.parse(selectedObjectivesJson);
      } catch (parseError) {
        console.error('Error parsing selected_objectives_json:', parseError.message);
        selectedObjectives = [];
      }
    }

    const responseData = {
      ...requestData,
      selected_objectives: selectedObjectives,
      objectives_count: selectedObjectives.length
    };

    res.status(201).json({
      success: true,
      message: 'Session request created successfully',
      data: responseData
    });

  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    console.error('Error creating session request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create session request'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Get all session requests for a user
router.get('/', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const userId = req.user.user_id;
    const status = req.query.status;

    let query = `
      SELECT sr.*, efo.display_name as functionality_name
      FROM session_requests sr
      LEFT JOIN expert_functionality_options efo ON sr.functionality_id = efo.id
      WHERE sr.seeker_id = ?
    `;
    const params = [userId];

    if (status) {
      query += ' AND sr.status = ?';
      params.push(status);
    }

    query += ' ORDER BY sr.created_at DESC';

    const [requests] = await connection.execute(query, params);

    // Process selected_objectives_json for each request
    const processedRequests = requests.map(request => {
      let selectedObjectives = [];
      
      const rawObjectives = request.selected_objectives_json;

      if (rawObjectives) {
        if (typeof rawObjectives === 'string') {
          try {
            selectedObjectives = JSON.parse(rawObjectives);
          } catch (parseError) {
            console.error('Error parsing selected_objectives_json:', parseError.message);
            selectedObjectives = [];
          }
        } else if (Array.isArray(rawObjectives)) {
          selectedObjectives = rawObjectives;
        }
      }

      return {
        ...request,
        selected_objectives: selectedObjectives,
        objectives_count: selectedObjectives.length
      };
    });

    res.json({
      success: true,
      data: processedRequests
    });

  } catch (error) {
    console.error('Error fetching session requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session requests'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Get a specific session request
router.get('/:id', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const { id } = req.params;
    const userId = req.user.user_id;

    // Fetch request with user verification and functionality name
    const [requests] = await connection.execute(
      `SELECT sr.*, efo.display_name as functionality_name
       FROM session_requests sr
       LEFT JOIN expert_functionality_options efo ON sr.functionality_id = efo.id
       WHERE sr.id = ? AND sr.seeker_id = ?`,
      [id, userId]
    );

    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session request not found'
      });
    }

    // Parse selected_objectives_json
    const requestData = requests[0];
    let selectedObjectives = [];

    const rawObjectives = requestData.selected_objectives_json;

    if (rawObjectives) {
      if (typeof rawObjectives === 'string') {
        try {
          selectedObjectives = JSON.parse(rawObjectives);
        } catch (parseError) {
          console.error('Error parsing selected_objectives_json:', parseError.message);
          selectedObjectives = [];
        }
      } else if (Array.isArray(rawObjectives)) {
        selectedObjectives = rawObjectives;
      }
    }

    const responseData = {
      ...requestData,
      selected_objectives: selectedObjectives,
      objectives_count: selectedObjectives.length
    };

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching session request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session request'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Get session request details by booking ID
router.get('/booking/:bookingId', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const { bookingId } = req.params;
    const userId = req.user.user_id;

    // First verify the booking exists and user has access
    const [bookings] = await connection.execute(
      `SELECT b.*, sr.id as session_request_id
       FROM bookings b
       LEFT JOIN session_requests sr ON b.session_request_id = sr.id
       WHERE b.id = ? AND (b.expert_id = ? OR b.seeker_id = ?)`,
      [bookingId, userId, userId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found or unauthorized' });
    }

    const booking = bookings[0];
    let sessionRequestId = booking.session_request_id;
    let sessionRequest = null;

    if (sessionRequestId) {
      // Fetch the session request details with functionality name
      const [requests] = await connection.execute(
        `SELECT sr.*, u.name as seeker_name, efo.display_name as functionality_name
         FROM session_requests sr
         JOIN users u ON sr.seeker_id = u.id
         LEFT JOIN expert_functionality_options efo ON sr.functionality_id = efo.id
         WHERE sr.id = ?`,
        [sessionRequestId]
      );
      
      if (requests.length > 0) {
        sessionRequest = requests[0];
        
        // Parse selected_objectives_json
        let selectedObjectives = [];
        if (sessionRequest.selected_objectives_json) {
          let selectedObjectives = [];
  
          const rawObjectives = sessionRequest.selected_objectives_json;
  
          if (rawObjectives) {
            if (typeof rawObjectives === 'string') {
              try {
                selectedObjectives = JSON.parse(rawObjectives);
              } catch (parseError) {
                console.error('Error parsing selected_objectives_json:', parseError.message);
                selectedObjectives = [];
              }
            } else if (Array.isArray(rawObjectives)) {
              selectedObjectives = rawObjectives;
            }
          }
  
          sessionRequest.selected_objectives = selectedObjectives;
          sessionRequest.objectives_count = selectedObjectives.length;
        }
      }
    } else {
      // Fallback: fetch latest pending session request for this seeker
      const [requests] = await connection.execute(
        `SELECT sr.*, u.name as seeker_name, efo.display_name as functionality_name
         FROM session_requests sr
         JOIN users u ON sr.seeker_id = u.id
         LEFT JOIN expert_functionality_options efo ON sr.functionality_id = efo.id
         WHERE sr.seeker_id = ? AND sr.status = 'pending' ORDER BY sr.created_at DESC LIMIT 1`,
        [booking.seeker_id]
      );
      if (requests.length > 0) {
        sessionRequest = requests[0];
        
        // Parse selected_objectives_json
        let selectedObjectives = [];
        if (sessionRequest.selected_objectives_json) {
          let selectedObjectives = [];
  
          const rawObjectives = sessionRequest.selected_objectives_json;
  
          if (rawObjectives) {
            if (typeof rawObjectives === 'string') {
              try {
                selectedObjectives = JSON.parse(rawObjectives);
              } catch (parseError) {
                console.error('Error parsing selected_objectives_json:', parseError.message);
                selectedObjectives = [];
              }
            } else if (Array.isArray(rawObjectives)) {
              selectedObjectives = rawObjectives;
            }
          }
  
          sessionRequest.selected_objectives = selectedObjectives;
          sessionRequest.objectives_count = selectedObjectives.length;
        }
      }
    }

    if (!sessionRequest) {
      return res.status(404).json({ success: false, message: 'No session request found for this booking' });
    }

    res.json({ success: true, data: sessionRequest });
  } catch (error) {
    console.error('Error fetching session request by booking:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch session request details' });
  } finally {
    if (connection) connection.release();
  }
});

// Update session request status
router.put('/:id/status', authenticateToken, async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.user_id;

    if (!['pending', 'matched', 'scheduled', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    connection = await pool.getConnection();

    // Check if session request exists and user has access
    const [requests] = await connection.execute(
      `SELECT * FROM session_requests WHERE id = ? AND seeker_id = ?`,
      [id, userId]
    );

    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session request not found or unauthorized'
      });
    }

    // Update status
    await connection.execute(
      `UPDATE session_requests SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, id]
    );

    res.json({
      success: true,
      message: 'Session request status updated successfully',
      data: { id, status }
    });

  } catch (error) {
    console.error('Error updating session request status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update session request status'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Update session request filter result
router.put('/:id/filter-result', authenticateToken, async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { expert_filter_result, functionality_id } = req.body;
    
    // Validate input
    if (!expert_filter_result || !['found', 'not_found'].includes(expert_filter_result)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filter result value. Must be "found" or "not_found".'
      });
    }
    
    connection = await req.app.locals.db.getConnection();
    
    // Verify the session request exists and belongs to the authenticated user
    const [sessionRequests] = await connection.execute(
      'SELECT * FROM session_requests WHERE id = ? AND seeker_id = ?',
      [id, req.user.id]
    );
    
    if (sessionRequests.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session request not found or you do not have permission to update it'
      });
    }
    
    // Update the session request with the filter result
    await connection.execute(
      `UPDATE session_requests 
       SET expert_filter_result = ?,
           expert_filter_date = NOW(),
           functionality_id = ?
       WHERE id = ?`,
      [expert_filter_result, functionality_id || null, id]
    );
    
    res.json({
      success: true,
      message: 'Session request filter result updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating session request filter result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update session request filter result',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

async function generateUniqueRequestId(connection) {
  const maxAttempts = 10;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const requestId = Math.floor(10000 + Math.random() * 90000).toString();
    
    try {
      const [existing] = await connection.execute(
        'SELECT id FROM session_requests WHERE id = ?',
        [requestId]
      );
      
      if (existing.length === 0) {
        return requestId;
      }
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error.message);
      if (attempt === maxAttempts - 1) throw error;
    }
  }
  
  // Fallback: use timestamp + random
  return `${Date.now()}${Math.floor(Math.random() * 100)}`;
}

module.exports = router;