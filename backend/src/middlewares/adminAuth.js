const { Admin } = require('../models');

module.exports = async (req, res, next) => {
  try {
    if (!req.session || !req.session.admin) {
      return res.redirect('/admin/login');
    }

    // Double check status in DB
    const admin = await Admin.findByPk(req.session.admin.id);
    if (!admin || admin.status !== 1) {
      req.session.destroy();
      return res.redirect('/admin/login');
    }

    // Refresh session details
    req.session.admin = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    };

    // Make admin data available to all templates
    res.locals.admin = req.session.admin;
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.redirect('/admin/login');
  }
};
