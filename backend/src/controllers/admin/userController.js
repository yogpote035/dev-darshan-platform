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

module.exports = {
  getUsers,
  blockUser,
  activateUser,
  deleteUser
};
