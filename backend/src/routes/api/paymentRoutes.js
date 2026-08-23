const express = require('express');
const router = express.Router();
const paymentController = require('../../controllers/api/paymentController');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware); // All payment routes require JWT authentication

router.post('/create-order', paymentController.createOrder);
router.post('/verify', paymentController.verifyPayment);
router.post('/recover', paymentController.recoverPayment);
router.post('/create-subscription', paymentController.createSubscription);
router.post('/verify-subscription', paymentController.verifySubscription);
router.post('/subscriptions/:id/cancel', paymentController.cancelSubscription);
router.get('/subscriptions/current', paymentController.getMyAutoPaySubscription);

module.exports = router;
