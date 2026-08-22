const express = require('express');
const router = express.Router();

// Middlewares
const adminAuth = require('../../middlewares/adminAuth');
const upload = require('../../middlewares/uploadMiddleware');

// Controllers
const authController = require('../../controllers/admin/authController');
const dashboardController = require('../../controllers/admin/dashboardController');
const userController = require('../../controllers/admin/userController');
const categoryController = require('../../controllers/admin/categoryController');
const videoController = require('../../controllers/admin/videoController');
const planController = require('../../controllers/admin/planController');
const productRoutes = require('./productRoutes');
const productCategoryRoutes = require('./productCategoryRoutes');
const bannerController = require('../../controllers/admin/bannerController');
const adController = require('../../controllers/admin/adController');
const notificationController = require('../../controllers/admin/notificationController');
const enquiryController = require('../../controllers/admin/enquiryController');
const settingController = require('../../controllers/admin/settingController');
const commissionController = require('../../controllers/admin/commissionController');
const reportController = require('../../controllers/admin/reportController');
const withdrawalController = require('../../controllers/admin/withdrawalController');

// ==========================
// PUBLIC ADMIN ROUTES
// ==========================
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.get('/logout', authController.logout);

// ==========================
// PROTECTED ADMIN ROUTES (SESSION REQD)
// ==========================
router.use(adminAuth);

// Dashboard
router.get('/dashboard', dashboardController.getDashboard);

// User Management
router.get('/users', userController.getUsers);
router.get('/users/:id/block', userController.blockUser);
router.get('/users/:id/activate', userController.activateUser);
router.get('/users/:id/delete', userController.deleteUser);

// Categories
router.get('/categories', categoryController.getCategories);
router.get('/categories/add', categoryController.getAddCategory);
router.post('/categories/add', upload.single('image'), categoryController.postAddCategory);
router.get('/categories/:id/edit', categoryController.getEditCategory);
router.post('/categories/:id/edit', upload.single('image'), categoryController.postEditCategory);
router.get('/categories/:id/toggle', categoryController.toggleStatus);
router.get('/categories/:id/delete', categoryController.deleteCategory);

// Videos
router.get('/videos', videoController.getVideos);
router.get('/videos/add', videoController.getAddVideo);
router.post('/videos/add', upload.single('thumbnail'), videoController.postAddVideo);
router.get('/videos/:id/edit', videoController.getEditVideo);
router.post('/videos/:id/edit', upload.single('thumbnail'), videoController.postEditVideo);
router.get('/videos/:id/toggle', videoController.toggleStatus);
router.get('/videos/:id/delete', videoController.deleteVideo);

// Subscription Plans
router.get('/plans', planController.getPlans);
router.get('/plans/add', planController.getAddPlan);
router.post('/plans/add', planController.postAddPlan);
router.get('/plans/:id/edit', planController.getEditPlan);
router.post('/plans/:id/edit', planController.postEditPlan);
router.get('/plans/:id/toggle', planController.toggleStatus);
router.get('/plans/:id/delete', planController.deletePlan);

// Products
router.use('/products', productRoutes);
router.use('/product-categories', productCategoryRoutes);

// Banners
router.get('/banners', bannerController.getBanners);
router.get('/banners/add', bannerController.getAddBanner);
router.post('/banners/add', upload.single('image'), bannerController.postAddBanner);
router.get('/banners/:id/edit', bannerController.getEditBanner);
router.post('/banners/:id/edit', upload.single('image'), bannerController.postEditBanner);
router.get('/banners/:id/toggle', bannerController.toggleStatus);
router.get('/banners/:id/delete', bannerController.deleteBanner);

// Advertisements
router.get('/ads', adController.getAds);
router.get('/ads/add', adController.getAddAd);
router.post('/ads/add', upload.single('image'), adController.postAddAd);
router.get('/ads/:id/edit', adController.getEditAd);
router.post('/ads/:id/edit', upload.single('image'), adController.postEditAd);
router.get('/ads/:id/toggle', adController.toggleStatus);
router.get('/ads/:id/delete', adController.deleteAd);

// Notifications
router.get('/notifications', notificationController.getNotifications);
router.get('/notifications/add', notificationController.getAddNotification);
router.post('/notifications/add', upload.single('image'), notificationController.postAddNotification);
router.get('/notifications/:id/delete', notificationController.deleteNotification);

// Contact Enquiries
router.get('/enquiries', enquiryController.getEnquiries);
router.get('/enquiries/:id/delete', enquiryController.deleteEnquiry);

// Settings
router.get('/settings', settingController.getSettings);
router.post('/settings', upload.single('logo'), settingController.postSettings);

// Commissions
router.get('/commissions', commissionController.getCommissions);

// Downloadable commission reports
router.get('/reports', reportController.getReports);
router.get('/reports/commissions/download', reportController.downloadAllCommissions);
router.get('/reports/commissions/user/:userId/download', reportController.downloadUserCommission);

// Withdrawals
router.get('/withdrawals', withdrawalController.getWithdrawals);
router.post('/withdrawals/:id/approve', withdrawalController.approveWithdrawal);
router.post('/withdrawals/:id/reject', withdrawalController.rejectWithdrawal);

module.exports = router;
