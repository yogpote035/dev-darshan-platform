const { Setting } = require('../../models');

const getPublicSettings = async (req, res) => {
  try {
    const setting = await Setting.findOne();
    if (!setting) {
      return res.status(404).json({ success: false, message: 'Settings not found.' });
    }

    // Explicitly exclude Razorpay Secret from the API response
    return res.status(200).json({
      success: true,
      settings: {
        site_name: setting.site_name,
        logo: setting.logo,
        support_email: setting.support_email,
        support_phone: setting.support_phone,
        razorpay_key_id: setting.razorpay_key_id,
        free_user_ads_enabled: setting.free_user_ads_enabled,
        maintenance_mode: setting.maintenance_mode
      }
    });
  } catch (error) {
    console.error('getPublicSettings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving settings.'
    });
  }
};

module.exports = {
  getPublicSettings
};
