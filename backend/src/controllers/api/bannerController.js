const { Banner } = require('../../models');

const getActiveBanners = async (req, res) => {
  try {
    const banners = await Banner.findAll({
      where: { status: 1 },
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      banners
    });
  } catch (error) {
    console.error('getActiveBanners API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving homepage banners.'
    });
  }
};

module.exports = {
  getActiveBanners
};
