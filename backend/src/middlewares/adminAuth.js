const { Admin } = require('../models');
const { getAllowedOrigins } = require('../config/security');

module.exports = async (req, res, next) => {
  try {
    const origin = req.get('origin');
    const fetchSite = req.get('sec-fetch-site');
    const allowedOrigins = getAllowedOrigins();
    if ((origin && !allowedOrigins.includes(origin)) || fetchSite === 'cross-site') {
      return res.status(403).send('Cross-site admin request blocked.');
    }

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
