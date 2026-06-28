const cron = require('node-cron');
const SubscriptionService = require('../services/SubscriptionService');

function initializeSubscriptionJobs(db) {
  const subscriptionService = new SubscriptionService(db);
  
  // Reset usage at start of each month (1st day, 00:00)
  cron.schedule('0 0 1 * *', async () => {
    try {
      console.log('Running monthly subscription usage reset...');
      await subscriptionService.resetMonthlyUsage();
      console.log('Monthly usage reset completed');
    } catch (error) {
      console.error('Monthly reset failed:', error);
    }
  });
}

module.exports = { initializeSubscriptionJobs };