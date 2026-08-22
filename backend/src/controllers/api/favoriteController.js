const { Favorite, Video, Category } = require('../../models');

const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;

    const favorites = await Favorite.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Video,
          where: { status: 1 },
          include: [{ model: Category, attributes: ['category_name'] }]
        }
      ]
    });

    return res.status(200).json({
      success: true,
      favorites
    });
  } catch (error) {
    console.error('getFavorites error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving favorites.' });
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { video_id } = req.body;

    if (!video_id) {
      return res.status(400).json({ success: false, message: 'Video ID is required.' });
    }

    const video = await Video.findByPk(video_id);
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found.' });
    }

    const favorite = await Favorite.findOne({
      where: { user_id: userId, video_id }
    });

    let favorited = false;

    if (favorite) {
      await favorite.destroy();
      favorited = false;
    } else {
      await Favorite.create({
        user_id: userId,
        video_id
      });
      favorited = true;
    }

    return res.status(200).json({
      success: true,
      favorited,
      message: favorited ? 'Added to favorites.' : 'Removed from favorites.'
    });
  } catch (error) {
    console.error('toggleFavorite error:', error);
    return res.status(500).json({ success: false, message: 'Server error toggling favorite status.' });
  }
};

module.exports = {
  getFavorites,
  toggleFavorite
};
