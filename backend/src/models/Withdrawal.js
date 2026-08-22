const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Withdrawal = sequelize.define('Withdrawal', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  payment_method: {
    type: DataTypes.ENUM('qr_code', 'bank_details'),
    allowNull: false
  },
  qr_code_image: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  bank_name: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  account_number: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  ifsc_code: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  account_holder_name: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  admin_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'withdrawals',
  timestamps: false
});

module.exports = Withdrawal;
