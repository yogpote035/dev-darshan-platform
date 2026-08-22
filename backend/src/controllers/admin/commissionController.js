const { Commission, User, Payment } = require('../../models');

const getCommissions = async (req, res) => {
  try {
    const commissions = await Commission.findAll({
      order: [['created_at', 'DESC']],
      include: [
        { model: User, as: 'Referrer', attributes: ['id', 'full_name', 'phone'] },
        { model: User, as: 'ReferredUser', attributes: ['id', 'full_name', 'phone'] },
        { model: Payment, attributes: ['id', 'amount', 'razorpay_order_id', 'payment_status'] }
      ]
    });

    res.render('commissions/list', {
      activePage: 'commissions',
      commissions,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (error) {
    console.error('getCommissions error:', error);
    res.status(500).send('Error loading commissions list');
  }
};

module.exports = {
  getCommissions
};
