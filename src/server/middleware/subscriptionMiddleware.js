const SubscriptionService = require('../services/SubscriptionService');

const validateSubscription = (featureKey, amount = 1) => {
  return async (req, res, next) => {
    try {
      const subscriptionService = new SubscriptionService(req.app.locals.db);
      const userId = req.user.user_id;
      
      const validation = await subscriptionService.validateFeatureAccess(userId, featureKey, amount);
      
      if (!validation.allowed) {
        return res.status(403).json({
          success: false,
          error: 'Subscription limit reached',
          reason: validation.reason,
          upgradeRequired: true,
          currentUsage: validation.currentUsage,
          limit: validation.limit
        });
      }
      
      req.subscriptionService = subscriptionService;
      req.featureValidation = validation;
      next();
    } catch (error) {
      console.error('Subscription middleware error:', error);
      next(); // Continue on error
    }
  };
};

module.exports = { validateSubscription };