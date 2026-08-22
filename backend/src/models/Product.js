const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    slug: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    short_description: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    offer_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null
    },
    image: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    category_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'product_categories',
            key: 'id'
        }
    },
    brand: {
        type: DataTypes.STRING(150),
        allowNull: true
    },
    sku: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    featured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    allow_one_rupee_offer: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    one_rupee_price: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 1.00
    },
    subscription_plan_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'subscription_plans',
            key: 'id'
        }
    },
    razorpay_plan_id: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    subscription_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null
    },
    subscription_trial_days: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 7
    },
    subscription_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
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
    tableName: 'products',
    timestamps: false
});

module.exports = Product;
