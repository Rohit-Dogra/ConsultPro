const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google OAuth verification and user creation/login
router.post('/verify', async (req, res) => {
  let connection;
  try {
    const { credential, google_id, email, name, picture, role } = req.body;
    
    let googleId, userEmail, userName, userPicture;
    
    if (credential) {
      // Handle JWT credential from Google Identity Services
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      
      const payload = ticket.getPayload();
      googleId = payload.sub;
      userEmail = payload.email;
      userName = payload.name;
      userPicture = payload.picture;
    } else if (google_id && email && name) {
      // Handle direct user data from OAuth callback
      googleId = google_id;
      userEmail = email;
      userName = name;
      userPicture = picture;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Google credential or user data is required'
      });
    }

    const pool = req.app.locals.db;
    connection = await pool.getConnection();

    // Check if user already exists
    const [existingUsers] = await connection.execute(
      'SELECT id, name, email, google_id, profile_picture, role, profile_completed FROM users WHERE email = ? OR google_id = ?',
      [userEmail.toLowerCase(), googleId]
    );

    let user;
    let isNewUser = false;

    if (existingUsers.length > 0) {
      // User exists, update Google ID if not set
      user = existingUsers[0];
      console.log('Backend Debug - Existing user from DB:', user);
      console.log('Backend Debug - profile_completed value:', user.profile_completed, 'type:', typeof user.profile_completed);
      
      if (!user.google_id) {
        await connection.execute(
          'UPDATE users SET google_id = ?, profile_picture = ? WHERE id = ?',
          [googleId, userPicture, user.id]
        );
        
        // Re-fetch user data after update to get the latest values
        const [updatedUsers] = await connection.execute(
          'SELECT id, name, email, google_id, profile_picture, role, profile_completed FROM users WHERE id = ?',
          [user.id]
        );
        user = updatedUsers[0];
        console.log('Backend Debug - Updated user from DB:', user);
      }
    } else {
      // Create new user
      isNewUser = true;
      const userId = Math.floor(10000 + Math.random() * 90000).toString();
      // Default to 'solution_seeker' if no role provided or role is not 'expert'
      const userRole = role === 'expert' ? 'expert' : 'solution_seeker';
      
      await connection.execute(
        `INSERT INTO users (id, name, email, google_id, profile_picture, role, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [userId, userName, userEmail.toLowerCase(), googleId, userPicture, userRole]
      );

      user = {
        id: userId,
        name: userName,
        email: userEmail.toLowerCase(),
        google_id: googleId,
        profile_picture: userPicture,
        role: userRole,
        profile_completed: 0
      };
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        user_id: user.id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Ensure profile_completed is a number
    const profileCompleted = user.profile_completed !== undefined ? Number(user.profile_completed) : 0;
    
    const responseData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profile_picture: user.profile_picture,
      profile_completed: profileCompleted,
      token,
      is_new_user: isNewUser
    };
    
    console.log('Backend Debug - Final response data:', responseData);
    console.log('Backend Debug - profile_completed after conversion:', profileCompleted, 'type:', typeof profileCompleted);
    
    res.json({
      success: true,
      message: isNewUser ? 'User created successfully' : 'Login successful',
      data: responseData
    });

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Update user phone number
router.post('/update-phone', async (req, res) => {
  let connection;
  try {
    const { userId, phone } = req.body;
    
    if (!userId || !phone) {
      return res.status(400).json({
        success: false,
        message: 'User ID and phone number are required'
      });
    }

    const pool = req.app.locals.db;
    connection = await pool.getConnection();
    
    await connection.execute(
      'UPDATE users SET mobile_number = ? WHERE id = ?',
      [phone, userId]
    );

    res.json({
      success: true,
      message: 'Phone number updated successfully'
    });

  } catch (error) {
    console.error('Phone update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update phone number'
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;