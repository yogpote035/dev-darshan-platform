const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContactEnquiry = sequelize.define('ContactEnquiry', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'contact_enquiries',
  timestamps: false
});

module.exports = ContactEnquiry;
