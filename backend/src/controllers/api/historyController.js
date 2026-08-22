const { WatchHistory, Video, Category } = require('../../models');

const getHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const history = await WatchHistory.findAll({
      where: { user_id: userId },
      order: [['watched_at', 'DESC']],
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
      history
    });
  } catch (error) {
    console.error('getHistory error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving watch history.' });
  }
};

const addHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { video_id, watch_time } = req.body;

    if (!video_id) {
      return res.status(400).json({ success: false, message: 'Video ID is required.' });
    }

    const video = await Video.findByPk(video_id);
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found.' });
    }

    // Check if record already exists for this user and video
    let historyItem = await WatchHistory.findOne({
      where: { user_id: userId, video_id }
    });

    if (historyItem) {
      historyItem.watch_time = watch_time ? parseInt(watch_time) : historyItem.watch_time;
      historyItem.watched_at = new Date(); // Update watch time
      await historyItem.save();
    } else {
      historyItem = await WatchHistory.create({
        user_id: userId,
        video_id,
        watch_time: watch_time ? parseInt(watch_time) : 0,
        watched_at: new Date()
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Watch history saved successfully.',
      history: historyItem
    });
  } catch (error) {
    console.error('addHistory error:', error);
    return res.status(500).json({ success: false, message: 'Server error saving watch history.' });
  }
};

module.exports = {
  getHistory,
  addHistory
};
