const sequelize = require('../config/database');

// Import models
const Admin = require('./Admin');
const User = require('./User');
const Category = require('./Category');
const Video = require('./Video');
const SubscriptionPlan = require('./SubscriptionPlan');
const Subscription = require('./Subscription');
const Payment = require('./Payment');
const Advertisement = require('./Advertisement');
const WatchHistory = require('./WatchHistory');
const Favorite = require('./Favorite');
const Notification = require('./Notification');
const UserNotification = require('./UserNotification');
const Setting = require('./Setting');
const Banner = require('./Banner');
const ContactEnquiry = require('./ContactEnquiry');
const Commission = require('./Commission');
const Withdrawal = require('./Withdrawal');
const ProductCategory = require('./ProductCategory');
const Product = require('./Product');
const CartItem = require('./CartItem');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const ProductSubscription = require('./ProductSubscription');
const PaymentWebhookEvent = require('./PaymentWebhookEvent');

// ==========================
// ASSOCIATIONS
// ==========================

// Category <-> Video
Category.hasMany(Video, { foreignKey: 'category_id', onDelete: 'SET NULL' });
Video.belongsTo(Category, { foreignKey: 'category_id' });

// User <-> SubscriptionPlan (Current plan in user profile)
User.belongsTo(SubscriptionPlan, { foreignKey: 'plan_id', as: 'Plan' });

// User <-> Subscription
User.hasMany(Subscription, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Subscription.belongsTo(User, { foreignKey: 'user_id' });

// SubscriptionPlan <-> Subscription
SubscriptionPlan.hasMany(Subscription, { foreignKey: 'plan_id', onDelete: 'CASCADE' });
Subscription.belongsTo(SubscriptionPlan, { foreignKey: 'plan_id' });

// User <-> Payment
User.hasMany(Payment, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Payment.belongsTo(User, { foreignKey: 'user_id' });

// Subscription <-> Payment (A payment can optionally reference a subscription)
Subscription.hasMany(Payment, { foreignKey: 'subscription_id', onDelete: 'SET NULL' });
Payment.belongsTo(Subscription, { foreignKey: 'subscription_id' });

// WatchHistory associations
User.hasMany(WatchHistory, { foreignKey: 'user_id', onDelete: 'CASCADE' });
WatchHistory.belongsTo(User, { foreignKey: 'user_id' });
Video.hasMany(WatchHistory, { foreignKey: 'video_id', onDelete: 'CASCADE' });
WatchHistory.belongsTo(Video, { foreignKey: 'video_id' });

// Favorite associations
User.hasMany(Favorite, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Favorite.belongsTo(User, { foreignKey: 'user_id' });
Video.hasMany(Favorite, { foreignKey: 'video_id', onDelete: 'CASCADE' });
Favorite.belongsTo(Video, { foreignKey: 'video_id' });

// Notification <-> User via UserNotification
User.hasMany(UserNotification, { foreignKey: 'user_id', onDelete: 'CASCADE' });
UserNotification.belongsTo(User, { foreignKey: 'user_id' });
Notification.hasMany(UserNotification, { foreignKey: 'notification_id', onDelete: 'CASCADE' });
UserNotification.belongsTo(Notification, { foreignKey: 'notification_id' });

// User referral self-association
User.belongsTo(User, { foreignKey: 'referred_by', as: 'Referrer' });
User.hasMany(User, { foreignKey: 'referred_by', as: 'ReferredUsers' });

// User <-> Commission
User.hasMany(Commission, { foreignKey: 'referrer_id', as: 'CommissionsReceived', onDelete: 'CASCADE' });
Commission.belongsTo(User, { foreignKey: 'referrer_id', as: 'Referrer' });
User.hasMany(Commission, { foreignKey: 'referred_id', as: 'CommissionsGenerated', onDelete: 'CASCADE' });
Commission.belongsTo(User, { foreignKey: 'referred_id', as: 'ReferredUser' });

// User <-> Withdrawal
User.hasMany(Withdrawal, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Withdrawal.belongsTo(User, { foreignKey: 'user_id' });

// Payment <-> Commission
Payment.hasMany(Commission, { foreignKey: 'payment_id', onDelete: 'CASCADE' });
Commission.belongsTo(Payment, { foreignKey: 'payment_id' });

// Product store associations
ProductCategory.hasMany(Product, { foreignKey: 'category_id', onDelete: 'SET NULL' });
Product.belongsTo(ProductCategory, { foreignKey: 'category_id', as: 'category' });

User.hasMany(CartItem, { foreignKey: 'user_id', onDelete: 'CASCADE' });
CartItem.belongsTo(User, { foreignKey: 'user_id' });
Product.hasMany(CartItem, { foreignKey: 'product_id', onDelete: 'CASCADE' });
CartItem.belongsTo(Product, { foreignKey: 'product_id' });

User.hasMany(Order, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Order.belongsTo(User, { foreignKey: 'user_id' });
Order.hasMany(OrderItem, { foreignKey: 'order_id', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });
Product.hasMany(OrderItem, { foreignKey: 'product_id', onDelete: 'SET NULL' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id' });

User.hasMany(ProductSubscription, { foreignKey: 'user_id', onDelete: 'CASCADE' });
ProductSubscription.belongsTo(User, { foreignKey: 'user_id' });
Order.hasMany(ProductSubscription, { foreignKey: 'order_id', onDelete: 'CASCADE' });
ProductSubscription.belongsTo(Order, { foreignKey: 'order_id' });
Product.hasMany(ProductSubscription, { foreignKey: 'product_id', onDelete: 'SET NULL' });
ProductSubscription.belongsTo(Product, { foreignKey: 'product_id' });

Payment.hasMany(PaymentWebhookEvent, { foreignKey: 'payment_id', onDelete: 'SET NULL' });

module.exports = {
  sequelize,
  Admin,
  User,
  Category,
  Video,
  SubscriptionPlan,
  Subscription,
  Payment,
  Advertisement,
  WatchHistory,
  Favorite,
  Notification,
  UserNotification,
  Setting,
  Banner,
  ContactEnquiry,
  Commission,
  Withdrawal,
  ProductCategory,
  Product,
  CartItem,
  Order,
  OrderItem,
  ProductSubscription,
  PaymentWebhookEvent
};
