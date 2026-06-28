const { createResponse } = require('../utils/response.utils');

class SubscriptionValidator {
  constructor() {
    this.db = null;
  }

  setDatabase(db) {
    this.db = db;
  }

  validateFeatureAccess(featureKey, usageAmount = 1) {
    return async (req, res, next) => {
      try {
        const userId = req.user.user_id;
        const validation = await this.checkFeatureUsage(userId, featureKey, usageAmount);
        
        if (!validation.allowed) {
          return res.status(403).json({
            error: 'Feature access denied',
            reason: validation.reason,
            upgradeRequired: true,
            suggestedPlans: validation.suggestedPlans,
            currentUsage: validation.currentUsage,
            usageLimit: validation.usageLimit
          });
        }
        
        // Store usage info for the route to use
        req.featureUsage = validation;
        next();
      } catch (error) {
        console.error('Subscription validation error:', error);
        return res.status(500).json({
          error: 'Subscription validation failed',
          message: error.message
        });
      }
    };
  }

  async checkFeatureUsage(userId, featureKey, requestedAmount) {
    try {
      // Input validation
      if (!userId || !featureKey || requestedAmount < 0) {
        throw new Error('Invalid parameters for feature usage check');
      }

      // Get user's current plan with subscription expiry check
      const [userRows] = await this.db.query(`
        SELECT u.current_plan_id, u.subscription_status, u.subscription_end_date,
               sp.plan_key, sp.plan_name
        FROM users u
        LEFT JOIN subscription_plans sp ON u.current_plan_id = sp.id
        WHERE u.id = ? AND u.id > 0
      `, [userId]);

      const user = userRows[0];
      if (!user) {
        throw new Error('User not found');
      }

      // If no plan or trial, only allow basic features
      if (!user.current_plan_id || user.subscription_status === 'trial') {
        return this.handleTrialUser(featureKey, requestedAmount, userId);
      }

      // Check if subscription is active and not expired
      const now = new Date();
      const endDate = user.subscription_end_date ? new Date(user.subscription_end_date) : null;
      
      if (user.subscription_status !== 'active' || (endDate && endDate < now)) {
        // Auto-expire subscription if end date passed
        if (endDate && endDate < now) {
          await this.expireSubscription(userId);
        }
        
        return {
          allowed: false,
          reason: 'Subscription expired or canceled',
          suggestedPlans: await this.getSuggestedPlans(featureKey)
        };
      }

      // Get feature limits for user's plan
      const [featureRows] = await this.db.query(`
        SELECT pf.feature_value, pf.is_enabled, sf.feature_type
        FROM plan_features pf
        JOIN subscription_features sf ON pf.feature_id = sf.id
        JOIN subscription_plans sp ON pf.plan_id = sp.id
        WHERE sp.id = ? AND sf.feature_key = ?
      `, [user.current_plan_id, featureKey]);

      if (featureRows.length === 0) {
        return {
          allowed: false,
          reason: 'Feature not available in current plan',
          suggestedPlans: await this.getSuggestedPlans(featureKey)
        };
      }

      const feature = featureRows[0];
      if (!feature.is_enabled) {
        return {
          allowed: false,
          reason: 'Feature not enabled in current plan',
          suggestedPlans: await this.getSuggestedPlans(featureKey)
        };
      }

      // Parse feature value to get limits
      const limits = this.parseFeatureValue(feature.feature_value, feature.feature_type);
      
      // Check current usage
      const currentPeriod = new Date().toISOString().slice(0, 7) + '-01'; // YYYY-MM-01
      const [usageRows] = await this.db.query(`
        SELECT current_usage, usage_limit
        FROM user_feature_usage
        WHERE user_id = ? AND feature_key = ? AND usage_period = ?
      `, [userId, featureKey, currentPeriod]);

      let currentUsage = 0;
      if (usageRows.length > 0) {
        currentUsage = usageRows[0].current_usage;
      }

      // Check if unlimited
      if (limits.unlimited) {
        return {
          allowed: true,
          unlimited: true,
          currentUsage,
          usageLimit: -1
        };
      }

      // Check if usage would exceed limit
      if (currentUsage + requestedAmount > limits.limit) {
        return {
          allowed: false,
          reason: `Usage limit exceeded. Current: ${currentUsage}, Limit: ${limits.limit}`,
          currentUsage,
          usageLimit: limits.limit,
          suggestedPlans: await this.getSuggestedPlans(featureKey)
        };
      }

      return {
        allowed: true,
        currentUsage,
        usageLimit: limits.limit,
        remainingUsage: limits.limit - currentUsage
      };

    } catch (error) {
      console.error('Error checking feature usage:', error);
      throw error;
    }
  }

  async incrementUsage(userId, featureKey, amount = 1) {
    try {
      const currentPeriod = new Date().toISOString().slice(0, 7) + '-01';
      
      await this.db.query(`
        INSERT INTO user_feature_usage (user_id, feature_key, usage_period, current_usage)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        current_usage = current_usage + ?,
        updated_at = CURRENT_TIMESTAMP
      `, [userId, featureKey, currentPeriod, amount, amount]);

    } catch (error) {
      console.error('Error incrementing usage:', error);
      throw error;
    }
  }

  parseFeatureValue(featureValue, featureType) {
    if (featureValue.toLowerCase().includes('unlimited')) {
      return { unlimited: true, limit: -1 };
    }

    if (featureType === 'boolean') {
      return { unlimited: false, limit: featureValue === 'true' ? 1 : 0 };
    }

    // Extract numeric values from strings like "3 × 15 min (Fixed)" or "90 min (Flexible)"
    const numericMatch = featureValue.match(/(\d+)/);
    if (numericMatch) {
      return { unlimited: false, limit: parseInt(numericMatch[1]) };
    }

    return { unlimited: false, limit: 0 };
  }

  async handleTrialUser(featureKey, requestedAmount, userId) {
    // Trial users get limited access to basic features
    const trialLimits = {
      'intro_call_with_expert': 3,
      'expert_profile_search': 10,
      'expert_detailed_profile_view': 5,
      'business_analysis_report_limited': 1,
      'lms': 1
    };

    const limit = trialLimits[featureKey] || 0;
    
    // Get current usage for trial user
    const currentPeriod = new Date().toISOString().slice(0, 7) + '-01';
    const [usageRows] = await this.db.query(`
      SELECT current_usage FROM user_feature_usage
      WHERE user_id = ? AND feature_key = ? AND usage_period = ?
    `, [userId, featureKey, currentPeriod]);
    
    const currentUsage = usageRows.length ? usageRows[0].current_usage : 0;
    
    if (limit === 0) {
      return {
        allowed: false,
        reason: 'Feature not available in trial',
        suggestedPlans: await this.getSuggestedPlans(featureKey)
      };
    }

    return {
      allowed: currentUsage + requestedAmount <= limit,
      reason: currentUsage + requestedAmount > limit ? 'Trial limit exceeded' : null,
      currentUsage,
      usageLimit: limit,
      suggestedPlans: currentUsage + requestedAmount > limit ? await this.getSuggestedPlans(featureKey) : null
    };
  }

  async expireSubscription(userId) {
    try {
      await this.db.query(`
        UPDATE users 
        SET subscription_status = 'expired'
        WHERE id = ? AND subscription_end_date < NOW()
      `, [userId]);
    } catch (error) {
      console.error('Error expiring subscription:', error);
    }
  }

  async getSuggestedPlans(featureKey) {
    try {
      const [plans] = await this.db.query(`
        SELECT DISTINCT sp.id, sp.plan_name, sp.plan_key, sp.price, sp.original_price, sp.is_most_popular
        FROM subscription_plans sp
        JOIN plan_features pf ON sp.id = pf.plan_id
        JOIN subscription_features sf ON pf.feature_id = sf.id
        WHERE sf.feature_key = ? AND pf.is_enabled = TRUE
        ORDER BY sp.sort_order
      `, [featureKey]);

      return plans;
    } catch (error) {
      console.error('Error getting suggested plans:', error);
      return [];
    }
  }
}

module.exports = SubscriptionValidator;