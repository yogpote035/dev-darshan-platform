const { Op, fn, col } = require('sequelize');
const { User, Video, Category, Payment, SubscriptionPlan } = require('../../models');

const getDashboard = async (req, res) => {
  try {
    // 1. Core counters
    const totalUsers = await User.count();
    
    // Premium plan is any plan other than 'Free' (plan_id = 1 is Free)
    const premiumUsers = await User.count({
      where: {
        plan_id: { [Op.gt]: 1 }
      }
    });

    const rawRevenue = await Payment.sum('amount', {
      where: { payment_status: 'success' }
    });
    const totalRevenue = rawRevenue ? parseFloat(rawRevenue) : 0;

    const totalVideos = await Video.count();
    const totalCategories = await Category.count();

    // 2. Recent lists
    const recentPayments = await Payment.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [
        { model: User, attributes: ['full_name', 'phone'] }
      ]
    });

    const recentUsers = await User.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [
        { model: SubscriptionPlan, as: 'Plan', attributes: ['plan_name'] }
      ]
    });

    // 3. Chart data (Monthly signups and revenue for last 6 months)
    // We will do a robust lookup, and map the outputs.
    const monthLabels = [];
    const signupData = [];
    const revenueData = [];

    // Let's generate the last 6 months list dynamically
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthName = d.toLocaleString('default', { month: 'short' });
      monthLabels.push(`${monthName} ${d.getFullYear()}`);
      
      // Query count of signups in this month
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const signups = await User.count({
        where: {
          created_at: {
            [Op.between]: [startOfMonth, endOfMonth]
          }
        }
      });
      signupData.push(signups);

      const revenueSum = await Payment.sum('amount', {
        where: {
          payment_status: 'success',
          created_at: {
            [Op.between]: [startOfMonth, endOfMonth]
          }
        }
      });
      revenueData.push(revenueSum ? parseFloat(revenueSum) : 0);
    }

    res.render('dashboard', {
      activePage: 'dashboard',
      stats: {
        totalUsers,
        premiumUsers,
        totalRevenue,
        totalVideos,
        totalCategories
      },
      recentPayments,
      recentUsers,
      chart: {
        labels: monthLabels,
        signups: signupData,
        revenue: revenueData
      }
    });
  } catch (error) {
    console.error('Dashboard controller error:', error);
    res.status(500).send('Error loading dashboard');
  }
};

module.exports = {
  getDashboard
};
