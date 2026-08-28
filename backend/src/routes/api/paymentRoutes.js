const express = require('express');
const router = express.Router();
const paymentController = require('../../controllers/api/paymentController');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware); // All payment routes require JWT authentication

// Membership plans are recurring-only. Keep the old routes unavailable so a
// caller cannot bypass the mandatory Razorpay Autopay mandate with a one-time
// order. Product checkout uses the separate /orders routes.
const legacyMembershipCheckoutRemoved = (_req, res) => res.status(410).json({
  success: false,
  message: 'One-time membership payments are no longer available. Start Autopay to activate Premium.'
});
router.post('/create-order', legacyMembershipCheckoutRemoved);
router.post('/verify', legacyMembershipCheckoutRemoved);
router.post('/recover', legacyMembershipCheckoutRemoved);
router.post('/create-subscription', paymentController.createSubscription);
router.post('/verify-subscription', paymentController.verifySubscription);
router.post('/subscriptions/:id/cancel', paymentController.cancelSubscription);
router.get('/subscriptions/current', paymentController.getMyAutoPaySubscription);

module.exports = router;
