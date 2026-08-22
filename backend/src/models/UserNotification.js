const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserNotification = sequelize.define('UserNotification', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  notification_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'notifications',
      key: 'id'
    }
  },
  is_read: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  }
}, {
  tableName: 'user_notifications',
  timestamps: false
});

module.exports = UserNotification;
