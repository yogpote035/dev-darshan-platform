const { Op } = require('sequelize');
const { Video, Category } = require('../../models');

const getVideos = async (req, res) => {
  try {
    const { category, type, featured, search, limit, offset } = req.query;

    const whereClause = { status: 1 }; // Only return active videos

    if (category) {
      whereClause.category_id = parseInt(category);
    }

    if (type) {
      if (type === 'live') {
        whereClause.is_live = 1;
      } else if (type === 'recorded') {
        whereClause.is_live = 0;
      }
    }

    if (featured === '1') {
      whereClause.featured = 1;
    }

    if (search) {
      whereClause.title = { [Op.like]: `%${search}%` };
    }

    const itemLimit = limit ? parseInt(limit) : 10;
    const itemOffset = offset ? parseInt(offset) : 0;

    const { count, rows: videos } = await Video.findAndCountAll({
      where: whereClause,
      limit: itemLimit,
      offset: itemOffset,
      order: [
        ['is_live', 'DESC'], // Live streams first
        ['created_at', 'DESC'] // Newest first
      ],
      include: [{ model: Category, attributes: ['category_name'] }]
    });

    return res.status(200).json({
      success: true,
      count,
      videos,
      hasMore: itemOffset + videos.length < count
    });
  } catch (error) {
    console.error('getVideos API error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving videos.' });
  }
};

const getVideoById = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await Video.findOne({
      where: { id, status: 1 },
      include: [{ model: Category, attributes: ['category_name'] }]
    });

    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found.' });
    }

    // Increment view count asynchronously
    video.total_views = video.total_views + 1;
    await video.save();

    return res.status(200).json({
      success: true,
      video
    });
  } catch (error) {
    console.error('getVideoById API error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving video details.' });
  }
};

module.exports = {
  getVideos,
  getVideoById
};
