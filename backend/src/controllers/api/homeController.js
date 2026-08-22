const { Video, Category, Banner, Advertisement, SubscriptionPlan } = require('../../models');

const getHomeFeed = async (req, res) => {
  try {
    // 1. Fetch active banners
    const banners = await Banner.findAll({
      where: { status: 1 },
      limit: 5,
      order: [['created_at', 'DESC']]
    });

    // 2. Fetch active categories
    const categories = await Category.findAll({
      where: { status: 1 },
      limit: 12,
      order: [['category_name', 'ASC']]
    });

    // 3. Fetch live streams (is_live = 1)
    const liveStreams = await Video.findAll({
      where: { status: 1, is_live: 1 },
      limit: 6,
      order: [['created_at', 'DESC']],
      include: [{ model: Category, attributes: ['category_name'] }]
    });

    // 4. Fetch featured videos (featured = 1, is_live = 0)
    const featuredVideos = await Video.findAll({
      where: { status: 1, featured: 1, is_live: 0 },
      limit: 6,
      order: [['created_at', 'DESC']],
      include: [{ model: Category, attributes: ['category_name'] }]
    });

    // 5. Fetch latest recorded videos (is_live = 0)
    const latestVideos = await Video.findAll({
      where: { status: 1, is_live: 0 },
      limit: 10,
      order: [['created_at', 'DESC']],
      include: [{ model: Category, attributes: ['category_name'] }]
    });

    // 6. Fetch ads config (first active campaign)
    const advertisement = await Advertisement.findOne({
      where: { status: 1 },
      order: [['created_at', 'DESC']]
    });

    // 7. Get plans for subscription page references
    const plans = await SubscriptionPlan.findAll({
      where: { status: 1 },
      order: [['price', 'ASC']]
    });

    return res.status(200).json({
      success: true,
      banners,
      categories,
      liveStreams,
      featuredVideos,
      latestVideos,
      advertisement,
      plans
    });
  } catch (error) {
    console.error('getHomeFeed API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error compiling home feed.'
    });
  }
};

module.exports = {
  getHomeFeed
};
