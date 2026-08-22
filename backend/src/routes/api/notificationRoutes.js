const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/api/notificationController');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware); // All notification routes require JWT authentication

router.get('/', notificationController.getNotifications);
router.post('/:id/read', notificationController.markAsRead);
router.post('/read-all', notificationController.markAllAsRead);

module.exports = router;
