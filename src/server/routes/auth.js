const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../server');  // Import pool from server.js
const { sendEmail } = require('../models/email');  // Import sendEmail
const auth = require('../middleware/auth'); // Import auth middleware

function generateUserId() {
    // Generates a random 5-digit number as a string
    return Math.floor(10000 + Math.random() * 90000).toString();
}

// Add validation helpers
const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
};

const validateMobileNumber = (number) => {
    // Remove all non-digit characters
    const cleanNumber = number.replace(/\D/g, '');
    
    // Check for Indian mobile number patterns
    // 10 digits starting with 6-9
    if (/^[6-9]\d{9}$/.test(cleanNumber)) {
        return true;
    }
    
    // 11 digits starting with 0 (with country code)
    if (/^0[6-9]\d{9}$/.test(cleanNumber)) {
        return true;
    }
    
    // 12 digits starting with 91 (India country code)
    if (/^91[6-9]\d{9}$/.test(cleanNumber)) {
        return true;
    }
    
    // 13 digits starting with +91
    if (/^\+91[6-9]\d{9}$/.test(number)) {
        return true;
    }
    
    return false;
};

const normalizePhoneNumber = (number) => {
    // Remove all non-digit characters except +
    let cleanNumber = number.replace(/[^\d+]/g, '');
    
    // Remove + if present
    cleanNumber = cleanNumber.replace(/\+/g, '');
    
    // Convert to standard 10-digit format
    if (cleanNumber.length === 10 && /^[6-9]/.test(cleanNumber)) {
        return cleanNumber;
    }
    
    if (cleanNumber.length === 11 && cleanNumber.startsWith('0')) {
        return cleanNumber.substring(1);
    }
    
    if (cleanNumber.length === 12 && cleanNumber.startsWith('91')) {
        return cleanNumber.substring(2);
    }
    
    return cleanNumber;
};

const validatePassword = (password) => {
    return password.length >= 8;
};

const validateSeekerFields = (data) => {
    const errors = [];
    
    if (!data.name?.trim()) errors.push('Name is required');
    if (!data.email?.trim()) errors.push('Email is required');
    if (!data.password?.trim()) errors.push('Password is required');
    if (!data.mobile_number?.trim()) errors.push('Mobile number is required');
    
    if (!validateEmail(data.email)) errors.push('Invalid email format');
    if (!validateMobileNumber(data.mobile_number)) errors.push('Invalid mobile number format');
    if (!validatePassword(data.password)) errors.push('Password must be at least 8 characters');
    
    return errors;
};

// Update expert validation to remove functionality requirement
const validateExpertFields = (data) => {
    const errors = [];
    
    if (!data.name?.trim()) errors.push('Name is required');
    if (!data.email?.trim()) errors.push('Email is required');
    if (!data.password?.trim()) errors.push('Password is required');
    
    // Remove functionality validation since it's moved to profile
    // if (!data.functionality?.trim()) errors.push('Functionality/Expertise is required');
    
    if (!validateEmail(data.email)) errors.push('Invalid email format');
    if (!validatePassword(data.password)) errors.push('Password must be at least 8 characters');
    
    return errors;
};

// Separate routes for expert and seeker registration
router.post('/register/expert', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const { name, email, password } = req.body;

        // Validate expert fields
        const validationErrors = validateExpertFields({ 
            name, 
            email, 
            password
        });

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        // Check for existing expert
        const [existingUser] = await connection.execute(
            'SELECT id, email FROM users WHERE email = ?',
            [email.toLowerCase()]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // const userId = uuidv4();
        const userId = generateUserId();

        const hashedPassword = await bcrypt.hash(password, 10);

        await connection.execute(
            `INSERT INTO users (
                id,
                name,
                email,
                password,
                role,
                created_at,
                profile_completed
            ) VALUES (?, ?, ?, ?, 'expert', NOW(), 0)`,
            [
                userId,
                name.trim(),
                email.toLowerCase(),
                hashedPassword
            ]
        );

        // Send welcome email
        try {
            await sendEmail({
                templateType: 'Expert Signup',
                userId: userId,
                password: password // Send the plain password for the welcome email
            });
        } catch (emailError) {
            console.error('Error sending welcome email:', emailError);
            // Don't fail the registration if email fails
        }

        const token = jwt.sign(
            { 
                user_id: userId,
                role: 'expert',
                email: email.toLowerCase()
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'Expert registration successful',
            data: {
                id: userId,
                name: name.trim(),
                email: email.toLowerCase(),
                role: 'expert',
                token,
                profile_completed: false
            }
        });

    } catch (error) {
        console.error('Expert registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
});

router.post('/register/seeker', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { name, email, password, mobile_number } = req.body;

        // Validate fields
        const validationErrors = validateSeekerFields(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        // Check if user already exists
        const [existingUsers] = await connection.execute(
            'SELECT * FROM users WHERE email = ?',
            [email.toLowerCase()]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate UUID for user
        // const userId = uuidv4();
        const userId = generateUserId();

        // Insert new user
        await connection.execute(
            'INSERT INTO users (id, name, email, password, mobile_number, role) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, name.trim(), email.toLowerCase(), hashedPassword, mobile_number, 'solution_seeker']
        );

        // Send welcome email
        try {
            await sendEmail({
                templateType: 'Seeker Signup',
                userId: userId,
                password: password // Send the plain password for the welcome email
            });
        } catch (emailError) {
            console.error('Error sending welcome email:', emailError);
            // Don't fail the registration if email fails
        }

        const token = jwt.sign(
            { 
                user_id: userId,
                role: 'solution_seeker',
                email: email.toLowerCase()
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'Solution seeker registration successful',
            data: {
                id: userId,
                name: name.trim(),
                email: email.toLowerCase(),
                mobile_number,
                role: 'solution_seeker',
                token,
                profile_completed: false
            }
        });

    } catch (error) {
        console.error('Seeker registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
});

// Expert login
// Update the expert login route to match seeker login response format
router.post('/login/expert', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const { email, password } = req.body;

        console.log('Expert login attempt:', { email });

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Query expert with profile status
        const [experts] = await connection.execute(
            `SELECT 
                u.id,
                u.name, 
                u.email, 
                u.password,
                u.role,
                CASE 
                    WHEN ep.user_id IS NOT NULL THEN true 
                    ELSE false 
                END as profile_completed
            FROM users u
            LEFT JOIN expert_profiles ep ON u.id = ep.user_id
            WHERE u.email = ? AND u.role = 'expert'`,
            [email.toLowerCase()]
        );

        if (experts.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid expert credentials'
            });
        }

        const expert = experts[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, expert.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid expert credentials'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                user_id: expert.id,
                role: expert.role,
                email: expert.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Remove password from response
        delete expert.password;

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                ...expert,
                token
            }
        });

    } catch (error) {
        console.error('Expert login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during login',
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
});

// Solution Seeker login
router.post('/login/seeker', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Query solution seeker user
        const [users] = await connection.execute(
            `SELECT 
                u.id as user_id, 
                u.name, 
                u.email, 
                u.password, 
                u.role
            FROM users u
            WHERE u.email = ? AND u.role = 'solution_seeker'`,
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid solution seeker credentials'
            });
        }

        const user = users[0];
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid solution seeker credentials'
            });
        }

        const token = jwt.sign(
            { user_id: user.user_id, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        // Store token in database
        const tokenId = uuidv4();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await connection.execute(
            'INSERT INTO auth_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
            [tokenId, user.user_id, token, expiresAt]
        );

        delete user.password;

        res.json({
            success: true,
            message: 'Solution seeker login successful',
            data: {
                ...user,
                token
            }
        });

    } catch (error) {
        console.error('Solution seeker login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in as solution seeker'
        });
    } finally {
        if (connection) connection.release();
    }
});

// Add this route after your existing routes
router.get('/expert/:user_id', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const { user_id } = req.params;

        // Get the token from the request header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token required'
            });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        if (decoded.user_id !== user_id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Fetch expert profile data
        const [experts] = await connection.execute(
            `SELECT 
                u.id as user_id,
                u.name,
                u.email,
                u.role,
                ep.*
            FROM users u
            LEFT JOIN expert_profiles ep ON u.id = ep.user_id
            WHERE u.id = ? AND u.role = 'expert'`,
            [user_id]
        );

        if (experts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expert profile not found'
            });
        }

        // Remove sensitive data
        const expertData = experts[0];
        delete expertData.password;

        res.json({
            success: true,
            message: 'Expert profile retrieved successfully',
            data: expertData
        });

    } catch (error) {
        console.error('Expert profile fetch error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error fetching expert profile'
        });
    } finally {
        if (connection) connection.release();
    }
});

// Modify the seeker profile check route
router.get('/profiles/seeker/:user_id', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const { user_id } = req.params;

        // Get the token from the request header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token required'
            });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Fetch seeker profile data
        const [seekers] = await connection.execute(
            `SELECT 
                u.id as user_id,
                u.name,
                u.email,
                u.role,
                u.mobile_number,
                CASE 
                    WHEN sp.user_id IS NOT NULL THEN true 
                    ELSE false 
                END as profile_completed
            FROM users u
            LEFT JOIN seeker_profiles sp ON u.id = sp.user_id
            WHERE u.id = ? AND u.role = 'solution_seeker'`,
            [user_id]
        );

        if (seekers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Remove sensitive data
        const seekerData = seekers[0];
        delete seekerData.password;

        // If no profile exists yet
        if (!seekerData.profile_completed) {
            return res.status(404).json({
                success: false,
                message: 'Profile not completed',
                data: {
                    user_id: seekerData.user_id,
                    profile_completed: false
                }
            });
        }

        res.json({
            success: true,
            message: 'Profile retrieved successfully',
            data: seekerData
        });

    } catch (error) {
        console.error('Profile fetch error:', error);
        
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error fetching profile'
        });
    } finally {
        if (connection) connection.release();
    }
});

// Add these routes to your auth router

// Verify if user exists
router.get('/verify-user/:id', auth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    const [users] = await db.query(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User exists'
    });

  } catch (error) {
    console.error('Error verifying user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify user',
      error: error.message
    });
  }
});

// Create new user
router.post('/create-user', auth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id, email, name, role } = req.body;

    // Validate required fields
    if (!id || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if user already exists
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (existingUsers.length > 0) {
      return res.json({
        success: true,
        message: 'User already exists'
      });
    }

    // Create new user
    await db.query(
      `INSERT INTO users (id, email, name, role, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [id, email, name, role]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully'
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
});

// Forgot Password Route
router.post('/forgot-password', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { email } = req.body;

        if (!email || !validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Valid email is required'
            });
        }

        // Check if user exists
        const [users] = await connection.execute(
            'SELECT id, name, email FROM users WHERE email = ?',
            [email.toLowerCase()]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this email'
            });
        }

        const user = users[0];

        // Generate password reset token
        const resetToken = jwt.sign(
            { 
                user_id: user.id,
                email: user.email,
                purpose: 'password_reset'
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Create reset password link
        const resetPasswordLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        // Send password reset email
        try {
            await sendEmail({
                templateType: 'Forgot Password',
                userId: user.id,
                resetPasswordLink: resetPasswordLink
            });

            res.json({
                success: true,
                message: 'Password reset instructions sent to your email'
            });
        } catch (emailError) {
            console.error('Error sending password reset email:', emailError);
            res.status(500).json({
                success: false,
                message: 'Failed to send password reset email'
            });
        }

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process password reset request'
        });
    } finally {
        if (connection) connection.release();
    }
});

// Reset Password Route
router.post('/reset-password', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token and new password are required'
            });
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.purpose !== 'password_reset') {
                throw new Error('Invalid token purpose');
            }
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await connection.execute(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, decoded.user_id]
        );

        res.json({
            success: true,
            message: 'Password has been reset successfully'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset password'
        });
    } finally {
        if (connection) connection.release();
    }
});

// Update Password Route (for logged-in users)
router.post('/update-password', auth, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user.user_id || req.user.id; // Handle both possible property names

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Old password and new password are required'
            });
        }

        // Validate new password
        if (!validatePassword(newPassword)) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }

        // Get current user password
        const [users] = await connection.execute(
            'SELECT password FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const currentPassword = users[0].password;

        // Verify old password
        const isOldPasswordValid = await bcrypt.compare(oldPassword, currentPassword);
        if (!isOldPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await connection.execute(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, userId]
        );

        res.json({
            success: true,
            message: 'Password updated successfully'
        });

    } catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update password'
        });
    } finally {
        if (connection) connection.release();
    }
});

router.post('/forgot-password-generate', async (req, res) => {
    const { email } = req.body;
    if (!email || !validateEmail(email)) {
        return res.status(400).json({ success: false, message: 'Valid email required.' });
    }
    let connection;
    try {
        connection = await pool.getConnection();
        // Find user by email
        const [users] = await connection.execute('SELECT id, name, email, role FROM users WHERE email = ?', [email.toLowerCase()]);
        if (!users.length) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        const user = users[0];
        // Generate random password
        const newPassword = Math.random().toString(36).slice(-10);
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        // Update password in DB
        await connection.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
        // Send email with new password
        await sendEmail({
            templateType: 'Forgot Password',
            userId: user.id,
            name: user.name,
            email: user.email,
            password: newPassword
        });
        res.json({ success: true, message: 'New password sent to your email.', password: newPassword, name: user.name });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    } finally {
        if (connection) connection.release();
    }
});

// Update phone number route
router.post('/update-phone', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        
        // Ensure users table has required columns
        try {
            await connection.execute(`ALTER TABLE users ADD COLUMN mobile_number VARCHAR(20) NULL`);
        } catch (error) {
            if (error.code !== 'ER_DUP_FIELDNAME') {
                console.log('Mobile number column error:', error.message);
            }
        }
        
        try {
            await connection.execute(`ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
        } catch (error) {
            if (error.code !== 'ER_DUP_FIELDNAME') {
                console.log('Updated at column error:', error.message);
            }
        }
        
        const { email, phone } = req.body;

        if (!email || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Email and phone number are required'
            });
        }

        // Validate phone number
        if (!validateMobileNumber(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid Indian mobile number'
            });
        }

        // Normalize phone number to standard format
        const normalizedPhone = normalizePhoneNumber(phone);

        // Check if user exists
        const [users] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            [email.toLowerCase()]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update phone number in users table
        await connection.execute(
            'UPDATE users SET mobile_number = ?, updated_at = NOW() WHERE email = ?',
            [normalizedPhone, email.toLowerCase()]
        );

        res.json({
            success: true,
            message: 'Phone number updated successfully',
            data: {
                phone: normalizedPhone
            }
        });

    } catch (error) {
        console.error('Update phone error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update phone number'
        });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;