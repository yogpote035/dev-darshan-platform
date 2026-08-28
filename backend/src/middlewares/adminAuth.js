const { Admin } = require('../models');
const { getAllowedOrigins, normalizeOrigin, getRequiredSecret } = require('../config/security');
const jwt = require('jsonwebtoken');

module.exports = async (req, res, next) => {
  try {
    const origin = req.get('origin');
    const fetchSite = req.get('sec-fetch-site');
    const allowedOrigins = getAllowedOrigins();
    // A request from the public site to the API host is cross-site by browser
    // classification, but is safe when its explicit Origin is allowlisted.
    // A cross-site navigation has no Origin, so it must not receive the
    // service-worker Bearer token for destructive legacy GET routes.
    if (process.env.NODE_ENV === 'production' && (
      (origin && !allowedOrigins.includes(normalizeOrigin(origin)))
      || (!origin && fetchSite === 'cross-site')
    )) {
      return res.status(403).send('Cross-site admin request blocked.');
    }

    const authHeader = req.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return res.redirect('/admin/login?reason=signin');
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, getRequiredSecret('JWT_SECRET'));
    if (decoded.type !== 'admin') return res.status(401).send('Invalid admin token.');

    // Double check status in DB
    const admin = await Admin.findByPk(decoded.id);
    if (!admin || admin.status !== 1) {
      return res.redirect('/admin/login?reason=expired');
    }

    req.admin = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    };

    // Make admin data available to all templates
    res.locals.admin = req.admin;
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.redirect('/admin/login?reason=expired');
  }
};
