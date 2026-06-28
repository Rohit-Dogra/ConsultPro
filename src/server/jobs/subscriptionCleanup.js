const cron = require('node-cron');

const startSubscriptionCleanup = (db) => {
  // Run every hour to check for expired subscriptions
  cron.schedule('0 * * * *', async () => {
    try {
      const [result] = await db.query(`
        UPDATE users 
        SET subscription_status = 'expired'
        WHERE subscription_end_date < NOW() 
        AND subscription_status IN ('trial', 'active')
      `);
      
      if (result.affectedRows > 0) {
        console.log(`Expired ${result.affectedRows} subscriptions`);
      }
    } catch (error) {
      console.error('Subscription cleanup error:', error);
    }
  });
};

module.exports = { startSubscriptionCleanup };