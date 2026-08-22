const { Advertisement } = require('../../models');

const getActiveAds = async (req, res) => {
  try {
    const ads = await Advertisement.findAll({
      where: { status: 1 },
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      ads
    });
  } catch (error) {
    console.error('getActiveAds error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving advertisements.'
    });
  }
};

module.exports = {
  getActiveAds
};
