const cron = require('node-cron');
const { Op } = require('sequelize');
const { User, Subscription, SubscriptionPlan } = require('../models');

// Run every day at midnight (00:00)
const startSubscriptionCron = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] Running daily check for expired subscriptions...');
    try {
      const now = new Date();

      // Find all subscriptions that have ended but are still marked active
      const expiredSubscriptions = await Subscription.findAll({
        where: {
          status: 'active',
          end_date: {
            [Op.lt]: now
          }
        }
      });

      console.log(`[Cron] Found ${expiredSubscriptions.length} subscriptions to expire.`);

      // Get Free plan ID
      const freePlan = await SubscriptionPlan.findOne({ where: { plan_name: 'Free' } });
      const freePlanId = freePlan ? freePlan.id : 1;

      for (const sub of expiredSubscriptions) {
        // 1. Mark subscription as expired
        sub.status = 'expired';
        await sub.save();

        // 2. Downgrade user's current plan in users table
        const user = await User.findByPk(sub.user_id);
        if (user && user.plan_id === sub.plan_id) {
          user.plan_id = freePlanId;
          // Set user's expiry to a default far-future or null
          const farFuture = new Date();
          farFuture.setDate(farFuture.getDate() + 3650); // Free plan duration
          user.subscription_expiry = farFuture;
          await user.save();
          console.log(`[Cron] User ID ${user.id} has been downgraded to Free plan.`);
        }
      }
      
      console.log('[Cron] Daily subscriptions expiration sweep completed successfully.');
    } catch (error) {
      console.error('[Cron] Error running subscription cron:', error);
    }
  });
};

module.exports = {
  startSubscriptionCron
};
