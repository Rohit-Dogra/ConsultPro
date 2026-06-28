const { CallTracker } = require('./callTracker');

const validateSeekerAccess = (featureKey) => {
  return async (req, res, next) => {
    try {
      const tracker = new CallTracker(req.app.locals.db);
      const result = await tracker.checkCallLimit(req.user.user_id, featureKey);
      
      if (!result.allowed) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
          reason: result.reason,
          currentUsage: result.currentCount,
          limit: result.limit,
          upgradeRequired: true
        });
      }
      
      // Track usage
      await tracker.trackCall(req.user.user_id, featureKey);
      req.usageInfo = result;
      next();
    } catch (error) {
      res.status(500).json({ success: false, message: 'Validation failed' });
    }
  };
};

module.exports = { validateSeekerAccess };