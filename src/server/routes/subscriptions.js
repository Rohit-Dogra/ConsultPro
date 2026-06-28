const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pool = require('../config/database');
// const { csrfProtection, getCSRFToken } = require('../middleware/csrf');
const { createResponse } = require('../utils/response.utils');
const { safeLog } = require('../utils/logger');
// Middleware imports commented out for now
// const { 
//   subscriptionRateLimit, 
//   validatePlanUpdate, 
//   validateFeatureAccess, 
//   validateUserOwnership 
// } = require('../middleware/subscriptionSecurity');

// Get CSRF token
// router.get('/csrf-token', auth, getCSRFToken);

// Get comparison data for all plans and features
router.get('/compare', async (req, res) => {
  try {
    const [plans] = await req.app.locals.db.query(`
      SELECT sp.id, sp.plan_name, sp.plan_key, sp.price, sp.original_price,
             sp.discount_percentage, sp.is_most_popular, sp.sort_order,
             sp.validity_months, sp.validity_display
      FROM subscription_plans sp
      ORDER BY sp.sort_order
    `);

    const [features] = await req.app.locals.db.query(`
      SELECT sf.id, sf.feature_key, sf.feature_name, sf.feature_type
      FROM subscription_features sf
      ORDER BY sf.id
    `);

    const [planFeatures] = await req.app.locals.db.query(`
      SELECT pf.plan_id, pf.feature_id, pf.feature_value, pf.is_enabled,
             sp.plan_key, sf.feature_key
      FROM plan_features pf
      JOIN subscription_plans sp ON pf.plan_id = sp.id
      JOIN subscription_features sf ON pf.feature_id = sf.id
    `);

    // Structure the data for frontend consumption
    const comparisonData = {
      plans: plans.map(plan => ({
        ...plan,
        features: planFeatures
          .filter(pf => pf.plan_id === plan.id)
          .reduce((acc, pf) => {
            acc[pf.feature_key] = {
              value: pf.feature_value,
              enabled: Boolean(pf.is_enabled)
            };
            return acc;
          }, {})
      })),
      features: features
    };

    res.json(createResponse(true, comparisonData, 'Comparison data retrieved successfully'));
  } catch (error) {
    safeLog.error('Error fetching comparison data', error);
    res.status(500).json(createResponse(false, null, 'Failed to fetch comparison data'));
  }
});

// Get all subscription plans
router.get('/plans', async (req, res) => {
  try {
    const [plans] = await req.app.locals.db.query(`
      SELECT sp.id, sp.plan_name, sp.plan_key, sp.price, sp.original_price, 
             sp.discount_percentage, sp.is_most_popular, sp.sort_order, sp.created_at,
             sp.validity_months, sp.validity_display,
             JSON_ARRAYAGG(
               JSON_OBJECT(
                 'feature_key', sf.feature_key,
                 'feature_name', sf.feature_name,
                 'feature_type', sf.feature_type,
                 'feature_value', pf.feature_value,
                 'is_enabled', pf.is_enabled
               )
             ) as features
      FROM subscription_plans sp
      LEFT JOIN plan_features pf ON sp.id = pf.plan_id
      LEFT JOIN subscription_features sf ON pf.feature_id = sf.id
      GROUP BY sp.id
      ORDER BY sp.sort_order
    `);

    // If no plans found, return hardcoded data
    if (plans.length === 0) {
      const defaultPlans = [
        {
          id: 1,
          plan_name: 'Silver',
          plan_key: 'silver',
          price: 10000,
          original_price: 50000,
          discount_percentage: 80,
          is_most_popular: false,
          sort_order: 1,
          validity_months: 3,
          validity_display: '3 Months',
          features: [
            { feature_key: 'core_services', feature_name: 'Core Services', feature_value: 'true', is_enabled: true },
            { feature_key: 'lms', feature_name: 'LMS Access', feature_value: 'true', is_enabled: true },
            { feature_key: 'expert_consultations', feature_name: 'Expert Consultations', feature_value: '3 × 15 min', is_enabled: true }
          ]
        },
        {
          id: 2,
          plan_name: 'Gold',
          plan_key: 'gold',
          price: 25000,
          original_price: 100000,
          discount_percentage: 75,
          is_most_popular: true,
          sort_order: 2,
          validity_months: 6,
          validity_display: '6 Months',
          features: [
            { feature_key: 'core_services', feature_name: 'Core Services', feature_value: 'true', is_enabled: true },
            { feature_key: 'lms', feature_name: 'LMS Access', feature_value: 'true', is_enabled: true },
            { feature_key: 'expert_consultations', feature_name: 'Expert Consultations', feature_value: '90 min', is_enabled: true },
            { feature_key: 'crm_access', feature_name: 'CRM Access', feature_value: 'true', is_enabled: true }
          ]
        },
        {
          id: 3,
          plan_name: 'Platinum',
          plan_key: 'platinum',
          price: 100000,
          original_price: 200000,
          discount_percentage: 50,
          is_most_popular: false,
          sort_order: 3,
          validity_months: 12,
          validity_display: '1 Year',
          features: [
            { feature_key: 'core_services', feature_name: 'Core Services', feature_value: 'true', is_enabled: true },
            { feature_key: 'lms', feature_name: 'LMS Access', feature_value: 'true', is_enabled: true },
            { feature_key: 'expert_consultations', feature_name: 'Expert Consultations', feature_value: 'Unlimited', is_enabled: true },
            { feature_key: 'crm_access', feature_name: 'CRM Access', feature_value: 'true', is_enabled: true },
            { feature_key: 'daily_monitoring', feature_name: 'Daily Monitoring', feature_value: 'true', is_enabled: true }
          ]
        },
        {
          id: 4,
          plan_name: 'Diamond',
          plan_key: 'diamond',
          price: 0,
          original_price: 0,
          discount_percentage: 0,
          is_most_popular: false,
          sort_order: 4,
          validity_months: null,
          validity_display: 'Custom',
          features: [
            { feature_key: 'all_features', feature_name: 'All Features', feature_value: 'true', is_enabled: true }
          ]
        }
      ];
      return res.json(createResponse(true, defaultPlans, 'Plans retrieved successfully (default data)'));
    }

    res.json(createResponse(true, plans, 'Plans retrieved successfully'));
  } catch (error) {
    safeLog.error('Error fetching plans', error);
    res.status(500).json(createResponse(false, null, 'Failed to fetch plans'));
  }
});

// Get user's current subscription
const { checkExpiredSubscriptions } = require('../middleware/subscriptionExpiry');
router.get('/current', auth, checkExpiredSubscriptions, async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const [userSub] = await req.app.locals.db.query(`
      SELECT u.current_plan_id, u.subscription_status, u.subscription_start_date, u.subscription_end_date,
             u.trial_used, sp.plan_name, sp.plan_key, sp.price, sp.original_price, sp.validity_display
      FROM users u
      LEFT JOIN subscription_plans sp ON u.current_plan_id = sp.id
      WHERE u.id = ?
    `, [userId]);

    if (userSub.length === 0) {
      return res.status(404).json(createResponse(false, null, 'User not found'));
    }

    const result = {
      ...userSub[0],
      usage: {} // Simplified for now
    };

    res.json(createResponse(true, result, 'Subscription retrieved successfully'));
  } catch (error) {
    safeLog.error('Error fetching user subscription', error);
    res.status(500).json(createResponse(false, null, 'Failed to fetch subscription'));
  }
});

// Validate feature access
router.post('/validate', auth, checkExpiredSubscriptions, async (req, res) => {
  try {
    const { featureKey, amount = 1 } = req.body;
    const userId = req.user.user_id;

    if (!featureKey) {
      return res.status(400).json(createResponse(false, null, 'Feature key is required'));
    }

    const SubscriptionValidator = require('../middleware/subscriptionValidator');
    const validator = new SubscriptionValidator();
    validator.setDatabase(req.app.locals.db);

    const validation = await validator.checkFeatureUsage(userId, featureKey, amount);
    
    res.json(createResponse(true, validation, 'Feature validation completed'));
  } catch (error) {
    safeLog.error('Error validating feature', error);
    res.status(500).json(createResponse(false, null, 'Feature validation failed'));
  }
});

// Update user subscription (for free plans only - paid plans should use activate-payment)
router.post('/update', auth, async (req, res) => {
  try {
    const { planId, customEndDate } = req.body;
    const userId = req.user.user_id;

    console.log('Subscription update request:', { planId, userId, customEndDate });

    if (!planId) {
      return res.status(400).json(createResponse(false, null, 'Plan ID is required'));
    }

    // Verify plan exists and get validity
    const [plan] = await req.app.locals.db.query(`
      SELECT id, plan_key, validity_months, price FROM subscription_plans WHERE id = ?
    `, [planId]);

    console.log('Plan lookup result:', plan);

    if (plan.length === 0) {
      return res.status(404).json(createResponse(false, null, 'Plan not found'));
    }

    const planData = plan[0];
    
    // SECURITY: Only allow free plans through this endpoint
    if (planData.price > 0) {
      console.log('❌ Attempted to update to paid plan without payment verification:', { planId, price: planData.price });
      return res.status(400).json(createResponse(false, null, 'Paid plans require payment verification. Use activate-payment endpoint.'));
    }
    
    console.log('✅ Free plan update allowed:', { planId, price: planData.price });
    const startDate = new Date();
    let endDate;

    // Calculate end date based on plan validity
    if (planData.plan_key === 'diamond') {
      if (!customEndDate) {
        return res.status(400).json(createResponse(false, null, 'Custom end date required for Diamond plan'));
      }
      endDate = new Date(customEndDate);
    } else if (planData.validity_months) {
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + planData.validity_months);
    } else {
      // Default to 1 month if no validity specified
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
    }

    console.log('Calculated dates:', { 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString() 
    });

    // Update user subscription in users table
    const [updateResult] = await req.app.locals.db.query(`
      UPDATE users 
      SET current_plan_id = ?, 
          subscription_status = 'active',
          subscription_start_date = ?, 
          subscription_end_date = ?
      WHERE id = ?
    `, [planId, startDate, endDate, userId]);

    console.log('Update result:', { 
      affectedRows: updateResult.affectedRows,
      changedRows: updateResult.changedRows 
    });

    if (updateResult.affectedRows === 0) {
      return res.status(404).json(createResponse(false, null, 'User not found'));
    }

    // Verify the update by querying the user
    const [verifyUser] = await req.app.locals.db.query(`
      SELECT current_plan_id, subscription_status, subscription_start_date, subscription_end_date 
      FROM users WHERE id = ?
    `, [userId]);

    console.log('Verification query result:', verifyUser[0]);

    res.json(createResponse(true, { 
      planId, 
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: 'active',
      verification: verifyUser[0]
    }, 'Subscription updated successfully'));
  } catch (error) {
    console.error('Error updating subscription:', error);
    safeLog.error('Error updating subscription', error);
    res.status(500).json(createResponse(false, null, 'Failed to update subscription'));
  }
});

// Get feature usage for current month
router.get('/usage', auth, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const currentPeriod = new Date().toISOString().slice(0, 7) + '-01';

    const [usage] = await req.app.locals.db.query(`
      SELECT ufu.feature_key, ufu.current_usage, ufu.usage_limit,
             sf.feature_name, sf.feature_type
      FROM user_feature_usage ufu
      JOIN subscription_features sf ON ufu.feature_key = sf.feature_key
      WHERE ufu.user_id = ? AND ufu.usage_period = ?
    `, [userId, currentPeriod]);

    res.json(createResponse(true, usage, 'Usage retrieved successfully'));
  } catch (error) {
    safeLog.error('Error fetching usage', error);
    res.status(500).json(createResponse(false, null, 'Failed to fetch usage'));
  }
});

// Add route to set user status to inactive
router.post('/deactivate', auth, async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [updateResult] = await req.app.locals.db.query(`
      UPDATE users 
      SET subscription_status = 'inactive',
          current_plan_id = NULL,
          subscription_start_date = NULL,
          subscription_end_date = NULL
      WHERE id = ?
    `, [userId]);

    if (updateResult.affectedRows === 0) {
      return res.status(404).json(createResponse(false, null, 'User not found'));
    }

    res.json(createResponse(true, { status: 'inactive' }, 'Subscription deactivated successfully'));
  } catch (error) {
    safeLog.error('Error deactivating subscription', error);
    res.status(500).json(createResponse(false, null, 'Failed to deactivate subscription'));
  }
});

// Activate trial subscription (Silver plan for 1 week)
router.post('/activate-trial', auth, async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    console.log('Trial activation request for user:', userId, 'User object:', req.user);

    if (!userId) {
      return res.status(400).json(createResponse(false, null, 'User ID not found'));
    }

    // Create tables if they don't exist
    await req.app.locals.db.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        plan_name VARCHAR(100) NOT NULL,
        plan_key VARCHAR(50) UNIQUE NOT NULL,
        price DECIMAL(10,2) DEFAULT 0,
        validity_months INT NULL,
        validity_display VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert trial plan if not exists
    await req.app.locals.db.query(`
      INSERT IGNORE INTO subscription_plans (plan_name, plan_key, price, validity_months, validity_display)
      VALUES ('Trial', 'trial', 0, NULL, '1 Week')
    `);

    // Check if user exists and trial status
    const [userCheck] = await req.app.locals.db.query(`
      SELECT trial_used, subscription_status FROM users WHERE id = ?
    `, [userId]);

    if (userCheck.length === 0) {
      return res.status(404).json(createResponse(false, null, 'User not found'));
    }

    if (userCheck[0].trial_used) {
      return res.status(400).json(createResponse(false, null, 'Trial already used'));
    }

    // Get trial plan
    const [trialPlan] = await req.app.locals.db.query(`
      SELECT id FROM subscription_plans WHERE plan_key = 'trial'
    `);

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    // Add columns if not exists (MySQL compatible syntax)
    try {
      await req.app.locals.db.query(`
        ALTER TABLE users ADD COLUMN trial_used BOOLEAN DEFAULT FALSE
      `);
    } catch (e) { /* Column exists */ }
    
    try {
      await req.app.locals.db.query(`
        ALTER TABLE users ADD COLUMN current_plan_id INT NULL
      `);
    } catch (e) { /* Column exists */ }
    
    try {
      await req.app.locals.db.query(`
        ALTER TABLE users ADD COLUMN subscription_status VARCHAR(20) DEFAULT 'inactive'
      `);
    } catch (e) { /* Column exists */ }
    
    try {
      await req.app.locals.db.query(`
        ALTER TABLE users ADD COLUMN subscription_start_date DATETIME NULL
      `);
    } catch (e) { /* Column exists */ }
    
    try {
      await req.app.locals.db.query(`
        ALTER TABLE users ADD COLUMN subscription_end_date DATETIME NULL
      `);
    } catch (e) { /* Column exists */ }

    // Activate trial
    const [updateResult] = await req.app.locals.db.query(`
      UPDATE users 
      SET current_plan_id = ?, 
          subscription_status = 'trial',
          subscription_start_date = ?, 
          subscription_end_date = ?,
          trial_used = TRUE
      WHERE id = ?
    `, [trialPlan[0].id, startDate, endDate, userId]);

    res.json(createResponse(true, {
      planId: trialPlan[0].id,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: 'trial',
      duration: '1 week'
    }, 'Trial activated successfully'));

  } catch (error) {
    console.error('Error activating trial:', error);
    res.status(500).json(createResponse(false, null, error.message || 'Failed to activate trial'));
  }
});

// Test endpoint for trial activation (GET version for testing)
router.get('/test-trial', (req, res) => {
  res.json(createResponse(true, {
    message: 'Trial activation endpoint is accessible',
    endpoint: '/api/subscriptions/activate-trial',
    method: 'POST'
  }, 'Trial endpoint test successful'));
});

// Activate subscription after payment confirmation
router.post('/activate-payment', auth, async (req, res) => {
  try {
    const { planId, planName, planKey, transactionId } = req.body;
    const userId = req.user.user_id || req.user.id;

    console.log('Subscription activation after payment:', { planId, planName, planKey, transactionId, userId });

    if (!planId || !transactionId) {
      return res.status(400).json(createResponse(false, null, 'Plan ID and transaction ID are required'));
    }

    // CRITICAL: Verify payment was successful before activating subscription
    try {
      const [paymentCheck] = await req.app.locals.db.query(`
        SELECT status, payment_type FROM payment_transactions 
        WHERE merchant_transaction_id = ? AND user_id = ?
      `, [transactionId, userId]);

      if (paymentCheck.length === 0) {
        console.log('❌ Payment transaction not found:', { transactionId, userId });
        return res.status(404).json(createResponse(false, null, 'Payment transaction not found'));
      }

      const paymentStatus = paymentCheck[0].status;
      console.log('💳 Payment status check:', { transactionId, status: paymentStatus });

      if (paymentStatus !== 'COMPLETED') {
        console.log('❌ Payment not completed, cannot activate subscription:', { transactionId, status: paymentStatus });
        return res.status(400).json(createResponse(false, null, `Cannot activate subscription - payment status is ${paymentStatus}`));
      }

      console.log('✅ Payment verified as COMPLETED, proceeding with subscription activation');
    } catch (dbError) {
      console.warn('⚠️ Could not verify payment status (DB issue), proceeding with caution:', dbError.message);
      // In case of DB issues, we could either:
      // 1. Fail safe and reject the activation
      // 2. Allow activation but log the issue
      // For now, we'll fail safe
      return res.status(500).json(createResponse(false, null, 'Could not verify payment status'));
    }

    // Verify plan exists and get validity
    const [plan] = await req.app.locals.db.query(`
      SELECT id, plan_key, plan_name, validity_months FROM subscription_plans WHERE id = ?
    `, [planId]);

    if (plan.length === 0) {
      return res.status(404).json(createResponse(false, null, 'Plan not found'));
    }

    const planData = plan[0];
    const startDate = new Date();
    let endDate;

    // Calculate end date based on plan validity
    if (planData.validity_months) {
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + planData.validity_months);
    } else {
      // Default to 1 month if no validity specified
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Ensure subscription columns exist
    const columnsToAdd = [
      { name: 'subscription_status', definition: "ENUM('inactive', 'trial', 'active', 'canceled', 'expired') DEFAULT 'inactive'" },
      { name: 'plan_name', definition: 'VARCHAR(100) NULL' },
      { name: 'plan_key', definition: 'VARCHAR(50) NULL' },
      { name: 'current_plan_id', definition: 'INT NULL' },
      { name: 'subscription_start_date', definition: 'DATETIME NULL' },
      { name: 'subscription_end_date', definition: 'DATETIME NULL' },
      { name: 'trial_used', definition: 'BOOLEAN DEFAULT FALSE' }
    ];
    
    for (const column of columnsToAdd) {
      try {
        await req.app.locals.db.query(`ALTER TABLE users ADD COLUMN ${column.name} ${column.definition}`);
        console.log(`Added column: ${column.name}`);
      } catch (error) {
        if (error.code !== 'ER_DUP_FIELDNAME') {
          console.log(`Column ${column.name} might already exist or error:`, error.message);
        }
      }
    }

    // Update user subscription in users table
    const [updateResult] = await req.app.locals.db.query(`
      UPDATE users 
      SET current_plan_id = ?, 
          subscription_status = 'active',
          subscription_start_date = ?, 
          subscription_end_date = ?,
          plan_name = ?,
          plan_key = ?
      WHERE id = ?
    `, [planId, startDate, endDate, planName || planData.plan_name, planKey || planData.plan_key, userId]);

    if (updateResult.affectedRows === 0) {
      return res.status(404).json(createResponse(false, null, 'User not found'));
    }

    // Log the subscription activation
    console.log('Subscription activated successfully:', {
      userId,
      planId,
      planName: planName || planData.plan_name,
      planKey: planKey || planData.plan_key,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      transactionId
    });

    res.json(createResponse(true, {
      planId,
      planName: planName || planData.plan_name,
      planKey: planKey || planData.plan_key,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: 'active',
      transactionId
    }, 'Subscription activated successfully after payment'));

  } catch (error) {
    console.error('Error activating subscription after payment:', error);
    res.status(500).json(createResponse(false, null, 'Failed to activate subscription after payment'));
  }
});

// Get subscriptions by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [subscriptions] = await req.app.locals.db.query(`
      SELECT u.current_plan_id, u.subscription_status, u.subscription_start_date, u.subscription_end_date,
             sp.plan_name, sp.plan_key, sp.price
      FROM users u
      LEFT JOIN subscription_plans sp ON u.current_plan_id = sp.id
      WHERE u.id = ? AND u.subscription_status IN ('active', 'trial')
    `, [userId]);
    
    res.json({
      success: true,
      data: subscriptions
    });
    
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions'
    });
  }
});

// Test endpoint to verify subscription routes are working
router.get('/test', (req, res) => {
  res.json(createResponse(true, { 
    message: 'Subscription routes are working',
    availableStatuses: ['inactive', 'trial', 'active', 'canceled', 'expired'],
    defaultStatus: 'inactive'
  }, 'Test successful'));
});

module.exports = router;