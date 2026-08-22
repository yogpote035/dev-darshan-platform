const path = require('path');
const fs = require('fs');
const { Notification, UserNotification, User } = require('../../models');

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({ order: [['created_at', 'DESC']] });
    res.render('notifications/list', {
      activePage: 'notifications',
      notifications,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (error) {
    console.error('getNotifications error:', error);
    res.status(500).send('Error loading notifications');
  }
};

const getAddNotification = (req, res) => {
  res.render('notifications/add', { activePage: 'notifications', error: null });
};

const postAddNotification = async (req, res) => {
  try {
    const { title, message } = req.body;
    let imagePath = null;

    if (req.file) {
      imagePath = `/uploads/notifications/${req.file.filename}`;
    }

    if (!title || !message) {
      return res.render('notifications/add', {
        activePage: 'notifications',
        error: 'Title and Message are required.'
      });
    }

    // 1. Create global notification
    const notification = await Notification.create({
      title,
      message,
      image: imagePath,
      status: 1
    });

    // 2. Query all active users
    const users = await User.findAll({ where: { status: 'active' }, attributes: ['id'] });

    // 3. Send notification to all users (insert user_notifications mapping)
    if (users.length > 0) {
      const userNotificationRecords = users.map(user => ({
        user_id: user.id,
        notification_id: notification.id,
        is_read: 0
      }));

      await UserNotification.bulkCreate(userNotificationRecords);
    }

    res.redirect('/admin/notifications?success=Notification+dispatched+successfully+to+' + users.length + '+users');
  } catch (error) {
    console.error('postAddNotification error:', error);
    res.render('notifications/add', { activePage: 'notifications', error: 'Error sending notification.' });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByPk(id);
    if (!notification) {
      return res.redirect('/admin/notifications?error=Notification+not+found');
    }

    // Delete image if local
    if (notification.image) {
      const imgPath = path.join(__dirname, '..', 'public', notification.image);
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }
    }

    await notification.destroy();
    res.redirect('/admin/notifications?success=Notification+deleted+successfully');
  } catch (error) {
    console.error('deleteNotification error:', error);
    res.redirect('/admin/notifications?error=Error+deleting+notification');
  }
};

module.exports = {
  getNotifications,
  getAddNotification,
  postAddNotification,
  deleteNotification
};
