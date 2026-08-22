const express = require('express');
const router = express.Router();

// Import sub-routers
const authRoutes = require('./authRoutes');
const homeRoutes = require('./homeRoutes');
const categoryRoutes = require('./categoryRoutes');
const videoRoutes = require('./videoRoutes');
const historyRoutes = require('./historyRoutes');
const favoriteRoutes = require('./favoriteRoutes');
const paymentRoutes = require('./paymentRoutes');
const settingRoutes = require('./settingRoutes');
const bannerRoutes = require('./bannerRoutes');
const adRoutes = require('./adRoutes');
const contactRoutes = require('./contactRoutes');
const notificationRoutes = require('./notificationRoutes');
const withdrawalRoutes = require('./withdrawalRoutes');
const productRoutes = require('./productRoutes');
const productCategoryRoutes = require('./productCategoryRoutes');
const cartRoutes = require('./cartRoutes');
const orderRoutes = require('./orderRoutes');
const productSubscriptionRoutes = require('./productSubscriptionRoutes');

// Mount sub-routers
router.use('/auth', authRoutes);
router.use('/home', homeRoutes);
router.use('/categories', categoryRoutes);
router.use('/videos', videoRoutes);
router.use('/history', historyRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/payments', paymentRoutes);
router.use('/products', productRoutes);
router.use('/product-categories', productCategoryRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/product-subscriptions', productSubscriptionRoutes);
router.use('/settings', settingRoutes);
router.use('/banners', bannerRoutes);
router.use('/ads', adRoutes);
router.use('/contact', contactRoutes);
router.use('/notifications', notificationRoutes);
router.use('/withdrawals', withdrawalRoutes);

module.exports = router;
