const { safeLog } = require('../utils/logger');

class CallTracker {
  constructor(db) {
    this.db = db;
  }

  async trackCall(userId, featureKey, sessionDuration = 0) {
    try {
      const period = new Date().toISOString().slice(0, 7) + '-01';
      
      // Create table if not exists
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS user_feature_usage (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          feature_key VARCHAR(100) NOT NULL,
          usage_period DATE NOT NULL,
          current_usage INT DEFAULT 0,
          session_count INT DEFAULT 0,
          total_duration INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_user_feature_period (user_id, feature_key, usage_period)
        )
      `);
      
      await this.db.query(`
        INSERT INTO user_feature_usage (user_id, feature_key, usage_period, current_usage, session_count, total_duration)
        VALUES (?, ?, ?, 1, 1, ?)
        ON DUPLICATE KEY UPDATE 
        current_usage = current_usage + 1,
        session_count = session_count + 1,
        total_duration = total_duration + ?
      `, [userId, featureKey, period, sessionDuration, sessionDuration]);
      
      return true;
    } catch (error) {
      safeLog.error('Call tracking failed', error);
      return false;
    }
  }

  async checkCallLimit(userId, featureKey) {
    try {
      const [user] = await this.db.query(`
        SELECT sp.plan_key FROM users u 
        JOIN subscription_plans sp ON u.current_plan_id = sp.id 
        WHERE u.id = ? AND u.subscription_status = 'active'
      `, [userId]);

      if (!user.length) return { allowed: false, reason: 'No active subscription' };

      const [feature] = await this.db.query(`
        SELECT pf.feature_value FROM plan_features pf
        JOIN subscription_features sf ON pf.feature_id = sf.id
        JOIN subscription_plans sp ON pf.plan_id = sp.id
        WHERE sp.plan_key = ? AND sf.feature_key = ? AND pf.is_enabled = 1
      `, [user[0].plan_key, featureKey]);

      if (!feature.length) return { allowed: false, reason: 'Feature not available' };

      const limit = this.parseLimit(feature[0].feature_value);
      if (limit === -1) return { allowed: true, unlimited: true };

      const period = new Date().toISOString().slice(0, 7) + '-01';
      const [usage] = await this.db.query(`
        SELECT session_count FROM user_feature_usage 
        WHERE user_id = ? AND feature_key = ? AND usage_period = ?
      `, [userId, featureKey, period]);

      const currentCount = usage.length ? usage[0].session_count : 0;
      
      return {
        allowed: currentCount < limit,
        currentCount,
        limit,
        remaining: limit - currentCount
      };
    } catch (error) {
      safeLog.error('Call limit check failed', error);
      return { allowed: false, reason: 'Check failed' };
    }
  }

  parseLimit(featureValue) {
    if (featureValue.toLowerCase().includes('unlimited')) return -1;
    const match = featureValue.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }
}

const validateCallAccess = (featureKey) => {
  return async (req, res, next) => {
    try {
      const tracker = new CallTracker(req.app.locals.db);
      const result = await tracker.checkCallLimit(req.user.user_id, featureKey);
      
      if (!result.allowed) {
        return res.status(403).json({
          success: false,
          message: 'Call limit exceeded',
          reason: result.reason,
          currentCount: result.currentCount,
          limit: result.limit
        });
      }
      
      req.callInfo = result;
      next();
    } catch (error) {
      res.status(500).json({ success: false, message: 'Validation failed' });
    }
  };
};

module.exports = { CallTracker, validateCallAccess };