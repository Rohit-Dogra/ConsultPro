const logger = require('../logger');

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://www.expertisestation.com',
  'https://expertisestation.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

/**
 * Security middleware implementing all required security headers and policies
 */
const securityMiddleware = (req, res, next) => {
  const origin = req.headers.origin;

  // 1. Content Security Policy (CSP) - Restrictive for API
  res.setHeader('Content-Security-Policy', 
    "default-src 'none'; frame-ancestors 'none'; form-action 'self'"
  );

  // 2. CORS Configuration - Tighten origin control
  if (process.env.NODE_ENV === 'production') {
    // Production: Only allow specific origins
    if (ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    // If origin not allowed, don't set CORS headers (will be blocked by browser)
  } else {
    // Development: Allow localhost
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 
    'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token, X-User-Id'
  );

  // 3. Restrictive Permissions-Policy
  res.setHeader('Permissions-Policy', 
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  );

  // 4. Remove X-Powered-By header (framework disclosure)
  res.removeHeader('X-Powered-By');

  // 5. Additional security headers
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY'); // Changed from SAMEORIGIN to DENY for API
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 6. Cache control for sensitive endpoints
  if (req.path.includes('/api/auth') || 
      req.path.includes('/api/users') || 
      req.path.includes('/api/profiles') ||
      req.path.includes('/api/sessions') ||
      req.path.includes('/api/payments')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  } else {
    // Public endpoints can have limited caching
    res.setHeader('Cache-Control', 'public, max-age=300');
  }

  next();
};

/**
 * Enhanced 404 handler with consistent JSON response
 */
const notFoundHandler = (req, res) => {
  res.status(404)
     .type('application/json')
     .json({
       error: 'Not Found',
       status: 404
     });
};

/**
 * Enhanced error handler with secure error responses
 */
const errorHandler = (err, req, res, next) => {
  // Log error details server-side
  logger.error('API Error:', {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Send minimal error response to client
  const status = err.status || err.statusCode || 500;
  
  res.status(status)
     .type('application/json')
     .json({
       error: status === 500 ? 'Internal Server Error' : err.message || 'An error occurred',
       status: status
     });
};

/**
 * Middleware to block suspicious metadata paths
 */
const blockMetadataPaths = (req, res, next) => {
  const suspiciousPaths = [
    '/actuator/health',
    '/computeMetadata/v1/',
    '/latest/meta-data/',
    '/metadata/instance',
    '/opc/v1/instance/',
    '/1956098289930323897'
  ];

  if (suspiciousPaths.some(path => req.path.startsWith(path))) {
    return res.status(404)
              .type('application/json')
              .json({
                error: 'Not Found',
                status: 404
              });
  }

  next();
};

module.exports = {
  securityMiddleware,
  notFoundHandler,
  errorHandler,
  blockMetadataPaths,
  ALLOWED_ORIGINS
};