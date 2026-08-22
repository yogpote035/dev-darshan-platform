const { Setting } = require('../models');

let cachedSettings = null;

const loadSettings = async (req, res, next) => {
  try {
    if (!cachedSettings) {
      let setting = await Setting.findOne();
      if (!setting) {
        // Fallback to default setting seeding
        setting = await Setting.create({
          site_name: 'Dev Darshan Live',
          logo: '/images/logo-placeholder.png',
          support_email: 'support@devdarshanlive.com',
          support_phone: '+919876543210',
          razorpay_key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key',
          razorpay_secret: process.env.RAZORPAY_SECRET || 'rzp_test_placeholder_secret',
          free_user_ads_enabled: 1,
          maintenance_mode: 0
        });
      }
      cachedSettings = setting;
    }

    // Attach to request and express template contexts
    req.settings = cachedSettings;
    res.locals.settings = cachedSettings;

    // Check maintenance mode on user API routes (but not on admin routes or auth pages)
    const isApiRequest = req.originalUrl.startsWith('/api');
    const isAuthRoute = req.originalUrl.includes('/auth') || req.originalUrl.includes('/login');
    const isAdminRoute = req.originalUrl.startsWith('/admin');

    if (cachedSettings.maintenance_mode === 1 && isApiRequest && !isAdminRoute) {
      return res.status(503).json({
        success: false,
        message: 'System is currently undergoing maintenance. Please try again later.'
      });
    }

    next();
  } catch (error) {
    console.error('Settings middleware error:', error);
    next();
  }
};

/**
 * Clear cached settings (call this when settings are updated in the admin panel)
 */
const clearSettingsCache = () => {
  cachedSettings = null;
};

module.exports = {
  loadSettings,
  clearSettingsCache
};
