const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Setting = sequelize.define('Setting', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  site_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  logo: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  support_email: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  support_phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  razorpay_key_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  razorpay_secret: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  razorpay_webhook_secret: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  free_user_ads_enabled: {
    type: DataTypes.TINYINT(1),
    defaultValue: 1
  },
  maintenance_mode: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  commission_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 10.00
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'settings',
  timestamps: false
});

module.exports = Setting;
