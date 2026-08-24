const jwt = require('jsonwebtoken');
const { User, SubscriptionPlan } = require('../models');
const { getRequiredSecret } = require('../config/security');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.live_darshan_auth;
    if (!cookieToken && (!authHeader || !authHeader.startsWith('Bearer '))) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = cookieToken || authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }
    const decoded = jwt.verify(token, getRequiredSecret('JWT_SECRET'));

    const user = await User.findByPk(decoded.id, {
      include: [{ model: SubscriptionPlan, as: 'Plan' }]
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    if (user.password_changed_at && decoded.iat * 1000 < new Date(user.password_changed_at).getTime()) {
      return res.status(401).json({ success: false, message: 'Your session has expired. Please sign in again.' });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ success: false, message: 'Your account has been blocked. Please contact support.' });
    }

    // Attach user information to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token has expired.' });
    }
    return res.status(400).json({ success: false, message: 'Invalid token.' });
  }
};
