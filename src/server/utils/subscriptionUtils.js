const { safeLog } = require('./logger');

class SubscriptionUtils {
  static validatePlanData(planData) {
    const errors = [];
    
    if (!planData.plan_name || planData.plan_name.length < 2) {
      errors.push('Plan name must be at least 2 characters');
    }
    
    if (!planData.plan_key || !/^[a-z_]+$/.test(planData.plan_key)) {
      errors.push('Plan key must contain only lowercase letters and underscores');
    }
    
    if (planData.price < 0) {
      errors.push('Price cannot be negative');
    }
    
    if (planData.validity_months && (planData.validity_months < 1 || planData.validity_months > 60)) {
      errors.push('Validity must be between 1 and 60 months');
    }
    
    return errors;
  }

  static sanitizeUserInput(input) {
    if (typeof input === 'string') {
      return input.trim().replace(/[<>]/g, '');
    }
    return input;
  }

  static async validateSubscriptionIntegrity(db, userId) {
    try {
      const [user] = await db.query(`
        SELECT u.current_plan_id, u.subscription_status, u.subscription_end_date,
               sp.id as plan_exists
        FROM users u
        LEFT JOIN subscription_plans sp ON u.current_plan_id = sp.id
        WHERE u.id = ?
      `, [userId]);

      if (!user.length) {
        return { valid: false, reason: 'User not found' };
      }

      const userData = user[0];
      
      // Check if plan exists when user has active subscription
      if (userData.current_plan_id && !userData.plan_exists) {
        return { valid: false, reason: 'Invalid plan reference' };
      }

      // Check subscription expiry
      if (userData.subscription_end_date) {
        const endDate = new Date(userData.subscription_end_date);
        const now = new Date();
        
        if (endDate < now && userData.subscription_status === 'active') {
          return { valid: false, reason: 'Subscription expired but status not updated' };
        }
      }

      return { valid: true };
    } catch (error) {
      safeLog.error('Subscription integrity check failed', error);
      return { valid: false, reason: 'Integrity check failed' };
    }
  }

  static calculateSubscriptionEndDate(startDate, validityMonths) {
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + validityMonths);
    return endDate;
  }

  static isSubscriptionActive(subscriptionStatus, endDate) {
    if (subscriptionStatus !== 'active') return false;
    if (!endDate) return true; // Unlimited subscription
    
    return new Date(endDate) > new Date();
  }

  static getFeatureUsagePeriod(date = new Date()) {
    return date.toISOString().slice(0, 7) + '-01'; // YYYY-MM-01
  }
}

module.exports = SubscriptionUtils;