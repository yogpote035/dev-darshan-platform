const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
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
    order_number: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true
    },
    subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    discount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    payment_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.00
    },
    payment_mode: {
        type: DataTypes.ENUM('one_time', 'subscription_offer'),
        allowNull: true
    },
    order_type: {
        type: DataTypes.ENUM('normal_purchase', 'one_rupee_offer'),
        allowNull: true
    },
    payment_status: {
        type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded', 'partially_refunded'),
        defaultValue: 'pending'
    },
    order_status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'),
        defaultValue: 'pending'
    },
    razorpay_order_id: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    razorpay_payment_id: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    razorpay_signature: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    razorpay_subscription_id: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    shipping_name: {
        type: DataTypes.STRING(150),
        allowNull: true
    },
    shipping_mobile: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    shipping_address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    shipping_city: {
        type: DataTypes.STRING(120),
        allowNull: true
    },
    shipping_state: {
        type: DataTypes.STRING(120),
        allowNull: true
    },
    shipping_pincode: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    shipping_country: {
        type: DataTypes.STRING(120),
        allowNull: true
    },
    notes: {
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
    tableName: 'orders',
    timestamps: false
});

module.exports = Order;
