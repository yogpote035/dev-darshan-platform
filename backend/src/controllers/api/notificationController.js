const { UserNotification, Notification } = require('../../models');

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await UserNotification.findAll({
      where: { user_id: userId },
      order: [['id', 'DESC']],
      include: [
        {
          model: Notification,
          where: { status: 1 }
        }
      ]
    });

    return res.status(200).json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('getNotifications API error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving notifications.' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params; // ID of the UserNotification record

    const userNotification = await UserNotification.findOne({
      where: { id, user_id: userId }
    });

    if (!userNotification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    userNotification.is_read = 1;
    await userNotification.save();

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      notification: userNotification
    });
  } catch (error) {
    console.error('markAsRead API error:', error);
    return res.status(500).json({ success: false, message: 'Server error marking notification as read.' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await UserNotification.update(
      { is_read: 1 },
      { where: { user_id: userId, is_read: 0 } }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    console.error('markAllAsRead API error:', error);
    return res.status(500).json({ success: false, message: 'Server error marking all notifications as read.' });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
