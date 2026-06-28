const checkExpiredSubscriptions = async (req, res, next) => {
  try {
    if (req.app.locals.db) {
      await req.app.locals.db.query(`
        UPDATE users 
        SET subscription_status = 'expired'
        WHERE subscription_end_date < NOW() 
        AND subscription_status IN ('trial', 'active')
      `);
    }
  } catch (error) {
    console.error('Error checking expired subscriptions:', error);
  }
  next();
};

module.exports = { checkExpiredSubscriptions };