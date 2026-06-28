class SubscriptionService {
  constructor(db) {
    this.db = db;
  }

  async validateFeatureAccess(userId, featureKey, requestedAmount = 1) {
    console.log(`SubscriptionService: Validating feature access for user ${userId}, feature ${featureKey}`);
    
    const [userPlan] = await this.db.query(`
      SELECT u.current_plan_id, u.subscription_status, sp.plan_key
      FROM users u
      LEFT JOIN subscription_plans sp ON u.current_plan_id = sp.id
      WHERE u.id = ?
    `, [userId]);

    console.log(`SubscriptionService: User plan data:`, userPlan[0]);

    if (!userPlan[0]?.current_plan_id) {
      console.log(`SubscriptionService: No active subscription for user ${userId}`);
      return { allowed: false, reason: 'No active subscription' };
    }

    if (userPlan[0].subscription_status !== 'active' && userPlan[0].subscription_status !== 'trial') {
      console.log(`SubscriptionService: Invalid subscription status: ${userPlan[0].subscription_status}`);
      return { allowed: false, reason: 'Subscription not active or trial' };
    }

    const [featureLimit] = await this.db.query(`
      SELECT pf.feature_value
      FROM plan_features pf
      JOIN subscription_features sf ON pf.feature_id = sf.id
      WHERE pf.plan_id = ? AND sf.feature_key = ? AND pf.is_enabled = 1
    `, [userPlan[0].current_plan_id, featureKey]);

    console.log(`SubscriptionService: Feature limit data:`, featureLimit[0]);

    if (!featureLimit[0]) {
      console.log(`SubscriptionService: Feature ${featureKey} not available for plan ${userPlan[0].current_plan_id}`);
      return { allowed: false, reason: 'Feature not available' };
    }

    if (featureLimit[0].feature_value.toLowerCase().includes('unlimited')) {
      console.log(`SubscriptionService: Unlimited access granted for feature ${featureKey}`);
      return { allowed: true, unlimited: true };
    }

    const limit = parseInt(featureLimit[0].feature_value.match(/(\d+)/)?.[1] || 0);
    const currentPeriod = new Date().toISOString().slice(0, 7) + '-01';
    
    const [usage] = await this.db.query(`
      SELECT current_usage FROM user_feature_usage
      WHERE user_id = ? AND feature_key = ? AND usage_period = ?
    `, [userId, featureKey, currentPeriod]);

    const currentUsage = usage[0]?.current_usage || 0;
    
    console.log(`SubscriptionService: Usage check - Current: ${currentUsage}, Limit: ${limit}, Requested: ${requestedAmount}`);
    
    if (currentUsage + requestedAmount > limit) {
      console.log(`SubscriptionService: Usage limit exceeded for user ${userId}`);
      return { allowed: false, reason: 'Usage limit exceeded', currentUsage, limit };
    }

    console.log(`SubscriptionService: Access granted for user ${userId}`);
    return { allowed: true, currentUsage, limit };
  }

  async incrementUsage(userId, featureKey, amount = 1) {
    const currentPeriod = new Date().toISOString().slice(0, 7) + '-01';
    await this.db.query(`
      INSERT INTO user_feature_usage (user_id, feature_key, usage_period, current_usage)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE current_usage = current_usage + ?
    `, [userId, featureKey, currentPeriod, amount, amount]);
  }
}

module.exports = SubscriptionService;