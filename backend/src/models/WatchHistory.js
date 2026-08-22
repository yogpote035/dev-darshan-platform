const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WatchHistory = sequelize.define('WatchHistory', {
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
  video_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'videos',
      key: 'id'
    }
  },
  watch_time: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  watched_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'watch_history',
  timestamps: false
});

module.exports = WatchHistory;
