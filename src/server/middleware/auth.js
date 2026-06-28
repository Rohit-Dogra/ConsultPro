const jwt = require('jsonwebtoken');

// Add debug logs to check what's happening in the auth middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided',
        code: 'NO_TOKEN'
      });
    }

    try {
      // Clean token and log it (masked for security)
      const cleanToken = token.trim();
      console.log(`Auth: Token received (first 10 chars): ${cleanToken.substring(0, 10)}...`);
      
      // Verify token
      const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
      console.log(`Auth: Token verified for user: ${decoded.id || decoded.user_id}`);
      
      // Set user info on request object - IMPORTANT: Check the ID property here
      req.user = {
        id: decoded.id || decoded.user_id, // Make sure we extract the right ID
        role: decoded.role
      };
      // Also set user_id for compatibility with routes that expect this property
      req.user.user_id = req.user.id;
      
      next();
    } catch (error) {
      console.log('Token verification error:', error.name, error.message);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired',
          code: 'TOKEN_EXPIRED'
        });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token format',
          code: 'INVALID_TOKEN'
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

// Export both as default and named export for flexibility
module.exports = auth;
module.exports.authenticateToken = auth;