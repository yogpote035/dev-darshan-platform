const path = require('path');
const fs = require('fs');
const { Setting } = require('../../models');
const { clearSettingsCache } = require('../../middlewares/settingsMiddleware');

const getSettings = async (req, res) => {
  try {
    const setting = await Setting.findOne();
    res.render('settings', {
      activePage: 'settings',
      setting,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (error) {
    console.error('getSettings error:', error);
    res.status(500).send('Error loading settings');
  }
};

const postSettings = async (req, res) => {
  try {
    const {
      site_name,
      support_email,
      support_phone,
      razorpay_key_id,
      razorpay_secret,
      free_user_ads_enabled,
      maintenance_mode,
      commission_percentage
    } = req.body;

    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create({});
    }

    let logoPath = setting.logo;
    if (req.file) {
      // Delete old logo file
      if (setting.logo && setting.logo.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, '..', 'public', setting.logo);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      logoPath = `/uploads/settings/${req.file.filename}`;
    }

    // Save configurations
    setting.site_name = site_name;
    setting.logo = logoPath;
    setting.support_email = support_email;
    setting.support_phone = support_phone;
    setting.razorpay_key_id = razorpay_key_id;
    setting.razorpay_secret = razorpay_secret;
    setting.free_user_ads_enabled = free_user_ads_enabled === '1' ? 1 : 0;
    setting.maintenance_mode = maintenance_mode === '1' ? 1 : 0;
    const parsedCommission = Number.parseFloat(commission_percentage);
    setting.commission_percentage = Number.isFinite(parsedCommission) ? parsedCommission : 10.00;
    await setting.save();

    // Clear dynamic middleware cache
    clearSettingsCache();

    res.redirect('/admin/settings?success=Settings+updated+successfully');
  } catch (error) {
    console.error('postSettings error:', error);
    res.redirect('/admin/settings?error=Error+updating+settings');
  }
};

module.exports = {
  getSettings,
  postSettings
};
// Ensure public/uploads/settings folder exists when uploading setting logo
const settingsUploadDir = path.join(__dirname, '..', 'public', 'uploads', 'settings');
if (!fs.existsSync(settingsUploadDir)) {
  fs.mkdirSync(settingsUploadDir, { recursive: true });
}
