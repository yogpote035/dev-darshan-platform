const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Advertisement = sequelize.define('Advertisement', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  redirect_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  display_after_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  display_after_videos: {
    type: DataTypes.INTEGER,
    defaultValue: 2
  },
  status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 1
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'advertisements',
  timestamps: false
});

module.exports = Advertisement;
