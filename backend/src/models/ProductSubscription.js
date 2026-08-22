const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductSubscription = sequelize.define('ProductSubscription', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'orders',
            key: 'id'
        }
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'products',
            key: 'id'
        }
    },
    razorpay_subscription_id: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    razorpay_plan_id: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    initial_payment_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.00
    },
    recurring_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.00
    },
    currency: {
        type: DataTypes.STRING(10),
        defaultValue: 'INR'
    },
    trial_days: {
        type: DataTypes.INTEGER,
        defaultValue: 7
    },
    trial_start_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    trial_end_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    first_charge_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    next_charge_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'trialing', 'active', 'paused', 'cancelled', 'completed', 'failed', 'expired'),
        defaultValue: 'pending'
    },
    subscription_start_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    subscription_end_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    cancelled_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    cancel_reason: {
        type: DataTypes.STRING(255),
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
    tableName: 'product_subscriptions',
    timestamps: false
});

module.exports = ProductSubscription;
