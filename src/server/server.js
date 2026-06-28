// Initialize console shim early to suppress all console output while keeping statements in code
require('./console-shim');
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const cron = require('node-cron');
const notificationsRouter = require('./routes/notifications');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const contactRouter = require('./routes/contact');
const PaymentService = require('./services');
const path = require('path');
const fs = require('fs');

if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env' });
} else {
  dotenv.config();
}  

// Console suppression is handled by console-shim.js
// All console statements remain in code but produce no output

const logger = require('./logger');
const { 
  securityMiddleware, 
  notFoundHandler, 
  errorHandler, 
  blockMetadataPaths,
  ALLOWED_ORIGINS 
} = require('./middleware/security');

const app = express();

// Disable X-Powered-By header globally
app.disable('x-powered-by');

// Enforce HTTPS in production only (redirect HTTP -> HTTPS).
if (process.env.NODE_ENV === 'production') {
  app.enable('trust proxy');
  app.use((req, res, next) => {
    // If request is already secure, continue. Honor X-Forwarded-Proto when behind proxies.
    if (req.secure || req.get('x-forwarded-proto') === 'https') return next();
    const host = req.get('host');
    return res.redirect(301, `https://${host}${req.originalUrl}`);
  });
}
// Ensure uploads directory exists with proper permissions
const uploadsDir = path.join(__dirname, '../uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o755 });
    console.log('✅ Uploads directory created:', uploadsDir);
  }
  // Test write permissions
  fs.accessSync(uploadsDir, fs.constants.W_OK);
  console.log('✅ Uploads directory writable:', uploadsDir);
} catch (error) {
  console.error('❌ Uploads directory error:', error.message);
}

// Serve static files from uploads directory with proper headers
// Serve uploads with conservative headers; avoid exposing uploads to any origin
app.use('/uploads', express.static(uploadsDir, {
  maxAge: '1d',
  etag: false,
  setHeaders: (res, path) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

console.log('JWT_SECRET environment variable:', process.env.JWT_SECRET);

// CORS middleware - must be before routes
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://www.expertisestation.com',
      'https://expertisestation.com',
      'https://api.expertisestation.com',
      'http://localhost:5173',
      'https://accounts.google.com',
      'https://mercury-uat.phonepe.com',
      'https://mercury.phonepe.com',
      'https://api-preprod.phonepe.com',
      'https://api.phonepe.com'
    ];
    
    console.log('CORS check - Origin:', origin, 'Allowed:', allowedOrigins.includes(origin));
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      if (process.env.SHOW_CORS_LOGS === 'true') {
        logger.warn('CORS blocked origin:', origin);
      }
      // Allow in development
      return callback(null, process.env.NODE_ENV !== 'production');
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-CSRF-Token',
    'X-User-Id',
    'x-response-encrypt'
  ],
  optionsSuccessStatus: 200
}));

// Handle preflight requests
app.options('*', cors());

// Apply security middleware early
app.use(securityMiddleware);

// Block suspicious metadata paths
app.use(blockMetadataPaths);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add security headers middleware (moved before routes)
app.use((req, res, next) => {
  // Set CORS headers explicitly
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://www.expertisestation.com',
    'https://expertisestation.com',
    'https://api.expertisestation.com',
    'http://localhost:5173'
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all for debugging
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token, X-User-Id');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  next();
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Test deals endpoint
app.get('/api/deals-test', (req, res) => {
  res.json({ message: 'Deals endpoint working!', data: [{ id: '1', title: 'Test Deal', company_name: 'Test Company' }] });
});

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || '',
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  idleTimeout: 60000   
});

app.locals.db = pool;

// Test database connection and create tables if needed
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
    
    // Run Google OAuth migration
    // try {
    //   const { addGoogleOAuthColumns } = require('./migrations/add-google-oauth-columns');
    //   await addGoogleOAuthColumns();
    // } catch (migrationError) {
    //   console.error('Migration error:', migrationError);
    // }
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

testConnection();

// Export pool before routes to avoid circular dependency
module.exports = { pool };

app.locals.db = pool;

// Google OAuth routes
app.get('/auth/google', (req, res) => {
  const googleAuthUrl = `https://accounts.google.com/oauth/authorize?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(req.protocol + '://' + req.get('host') + '/auth/google/callback')}&response_type=code&scope=openid%20email%20profile`;
  res.redirect(googleAuthUrl);
});

app.get('/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: req.protocol + '://' + req.get('host') + '/auth/google/callback'
      })
    });
    
    const tokens = await tokenResponse.json();
    
    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    
    const userInfo = await userResponse.json();
    
    // Store user info in session/cookie for frontend to access
    const userData = {
      name: userInfo.name,
      email: userInfo.email,
      picture: userInfo.picture,
      google_id: userInfo.id
    };
    
    // Redirect to frontend with user data
    const redirectUrl = `${req.protocol}://${req.get('host').replace(':8080', ':5173')}/auth/seeker?google_auth=success&user=${encodeURIComponent(JSON.stringify(userData))}`;
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect(`${req.protocol}://${req.get('host').replace(':8080', ':5173')}/auth/seeker?error=oauth_failed`);
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/google-auth', require('./routes/google-auth'));
app.use('/api/experts', require('./routes/experts'));
app.use('/api/webinar', require('./routes/webinar'));
app.use('/api/business-plans', require('./routes/businessPlans'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/notifications', notificationsRouter);
app.use('/api/contact', contactRouter);
app.use('/api/consultations', require('./routes/consultations'));
app.use('/api/consultation-requests', require('./routes/consultation-requests'));
app.use('/api/business-objectives', require('./routes/businessObjectives'));

const profilesRouter = require('./routes/profiles');
const expertAvailabilityRouter = require('./routes/ExpertAvailability');
const bookingsRouter = require('./routes/bookings');
const agoraTokenRouter = require('./routes/agora');
const usersRouter = require('./routes/users');
const functionalitiesRouter = require('./routes/functionalities');
const sessionRequestsRouter = require('./routes/session-requests');
const sessionFeedbackRouter = require('./routes/sessionFeedback');
const paymentRouter = require('./routes/payments');
const sessionRemindersRouter = require('./routes/sessionReminders');
const industriesRouter = require('./routes/industries');
const marketReportsRouter = require('./routes/market-reports');
const generateReportRouter = require('./routes/generate-report');
const userPreferencesRouter = require('./routes/user-preferences');
const currenciesRouter = require('./routes/currencies');
const currencySymbolUpdateRouter = require('./routes/currency-symbol-update');
const postsRouter = require('./routes/posts');
const postInquiriesRouter = require('./routes/post-inquiries');
const dealsRouter = require('./routes/deals');
const dealInquiriesRouter = require('./routes/deal-inquiries');
const careersRouter = require('./routes/careers');
const globalCurrencyRouter = require('./routes/global-currency');
const blogsRoutes = require("./routes/blogs");
const caseStudiesRoutes = require("./routes/case-studies");
// const subscriptionsRouter = require('./routes/subscriptions');
// const { initializeSubscriptionJobs } = require('./jobs/subscriptionReset');

app.use('/api/profiles', profilesRouter);
app.use('/api/experts/availability', expertAvailabilityRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/agora', agoraTokenRouter);
app.use('/api/users', usersRouter);
app.use('/api/functionalities', functionalitiesRouter);
app.use('/api/session-requests', sessionRequestsRouter);
app.use('/api/session-feedback', sessionFeedbackRouter);
app.use('/api/payments', paymentRouter);
app.use('/api', industriesRouter);
app.use('/api/market-reports', marketReportsRouter);
app.use('/api/generate-report', generateReportRouter);
app.use('/api/user', userPreferencesRouter);
app.use('/api/currencies', currenciesRouter);
app.use('/api/currency-symbols', currencySymbolUpdateRouter);
app.use('/api/posts', postsRouter);
app.use('/api/post-inquiries', postInquiriesRouter);
app.use('/api/deals', dealsRouter);
app.use('/api/deal-inquiries', dealInquiriesRouter);
app.use('/api/careers', careersRouter);
app.use('/api/global-currency', globalCurrencyRouter);
app.use("/api/blogs", blogsRoutes);
app.use("/api/case-studies", caseStudiesRoutes);
// Subscription routes already registered above
app.use('/api/session-reminders', sessionRemindersRouter);
// Register wallet routes
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/call-tracking', require('./routes/callTracking'));
app.use('/api/seeker', require('./routes/seekerValidation'));
app.use('/api/subscriptions', require('./routes/subscriptions'));


// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initialize subscription cleanup job
  const { startSubscriptionCleanup } = require('./jobs/subscriptionCleanup');
  startSubscriptionCleanup(pool);
});
