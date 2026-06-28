const crypto = require('crypto');

const csrfTokens = new Map();

const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const csrfProtection = (req, res, next) => {
  if (req.method === 'GET') {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionId = req.headers.authorization?.replace('Bearer ', '');

  if (!token || !sessionId) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token required'
    });
  }

  const storedToken = csrfTokens.get(sessionId);
  if (!storedToken || storedToken !== token) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token'
    });
  }

  next();
};

const getCSRFToken = (req, res) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  if (!sessionId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const token = generateCSRFToken();
  csrfTokens.set(sessionId, token);
  
  res.json({
    success: true,
    csrfToken: token
  });
};

module.exports = { csrfProtection, getCSRFToken };