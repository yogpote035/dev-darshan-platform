const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PaymentWebhookEvent = sequelize.define('PaymentWebhookEvent', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    event_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
    },
    event_type: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    payload_hash: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    processed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    processed_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    error: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'payment_webhook_events',
    timestamps: false
});

module.exports = PaymentWebhookEvent;
