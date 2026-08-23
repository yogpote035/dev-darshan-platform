const { Op } = require('sequelize');
const { User, SubscriptionPlan } = require('../../models');

const getUsers = async (req, res) => {
  try {
    const { search, status } = req.query;
    
    const whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { full_name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const users = await User.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      include: [
        { model: SubscriptionPlan, as: 'Plan', attributes: ['plan_name'] },
        { model: User, as: 'Referrer', attributes: ['full_name', 'phone'] }
      ]
    });

    res.render('users/list', {
      activePage: 'users',
      users,
      search: search || '',
      statusFilter: status || 'all',
      error: req.query.error || null,
      success: req.query.success || null
    });
  } catch (error) {
    console.error('getUsers error:', error);
    res.status(500).send('Error retrieving users');
  }
};

const blockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.redirect('/admin/users?error=User+not+found');
    }
    user.status = 'blocked';
    await user.save();
    res.redirect('/admin/users?success=User+blocked+successfully');
  } catch (error) {
    console.error('blockUser error:', error);
    res.redirect('/admin/users?error=Error+blocking+user');
  }
};

const activateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.redirect('/admin/users?error=User+not+found');
    }
    user.status = 'active';
    await user.save();
    res.redirect('/admin/users?success=User+activated+successfully');
  } catch (error) {
    console.error('activateUser error:', error);
    res.redirect('/admin/users?error=Error+activating+user');
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.redirect('/admin/users?error=User+not+found');
    }
    await user.destroy();
    res.redirect('/admin/users?success=User+deleted+successfully');
  } catch (error) {
    console.error('deleteUser error:', error);
    res.redirect('/admin/users?error=Error+deleting+user');
  }
};

const getEditUserPlan = async (req, res) => {
  try {
    const [user, plans] = await Promise.all([User.findByPk(req.params.id), SubscriptionPlan.findAll({ where: { status: 1 }, order: [['price', 'ASC']] })]);
    if (!user) return res.redirect('/admin/users?error=User+not+found');
    return res.render('users/plan', { activePage: 'users', user, plans, error: null });
  } catch (error) {
    console.error('getEditUserPlan error:', error);
    return res.redirect('/admin/users?error=Unable+to+open+plan+editor');
  }
};

const postEditUserPlan = async (req, res) => {
  try {
    const [user, plan] = await Promise.all([User.findByPk(req.params.id), SubscriptionPlan.findOne({ where: { id: req.body.plan_id, status: 1 } })]);
    if (!user || !plan) return res.redirect(`/admin/users/${req.params.id}/plan?error=Select+an+active+plan`);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + Number(plan.duration_days || 0));
    user.plan_id = plan.id;
    user.subscription_expiry = endDate;
    await user.save();
    return res.redirect('/admin/users?success=User+plan+updated+successfully');
  } catch (error) {
    console.error('postEditUserPlan error:', error);
    return res.redirect('/admin/users?error=Unable+to+update+user+plan');
  }
};

module.exports = {
  getUsers,
  blockUser,
  activateUser,
  deleteUser,
  getEditUserPlan,
  postEditUserPlan
};
