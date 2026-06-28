const rateLimit = require('express-rate-limit');
const { body, param, validationResult } = require('express-validator');

// Rate limiting for subscription operations
const subscriptionRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many subscription requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Input validation rules
const validatePlanUpdate = [
  body('planId').isInt({ min: 1 }).withMessage('Valid plan ID required'),
  body('customEndDate').optional().isISO8601().withMessage('Valid date required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
        message: 'Validation failed'
      });
    }
    next();
  }
];

const validateFeatureAccess = [
  body('featureKey').isAlphanumeric().withMessage('Valid feature key required'),
  body('amount').optional().isInt({ min: 1, max: 100 }).withMessage('Amount must be 1-100'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
        message: 'Validation failed'
      });
    }
    next();
  }
];

// User ownership validation
const validateUserOwnership = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const requestedUserId = req.params.userId || req.body.userId;
    
    if (requestedUserId && parseInt(requestedUserId) !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Cannot modify other user data'
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authorization check failed'
    });
  }
};

module.exports = {
  subscriptionRateLimit,
  validatePlanUpdate,
  validateFeatureAccess,
  validateUserOwnership
};