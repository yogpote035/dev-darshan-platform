const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/api/orderController');
const authMiddleware = require('../../middlewares/authMiddleware');

/**
 * @openapi
 * /api/orders/preview:
 *   post:
 *     summary: Calculate server-authoritative cart totals and payment options
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 * /api/orders/create:
 *   post:
 *     summary: Create a pending product order and Razorpay one-time payment order
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 * /api/orders/payment/verify:
 *   post:
 *     summary: Verify a product payment and confirm the order idempotently
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 */

router.use(authMiddleware);

router.get('/', orderController.listUserOrders);
router.get('/:id', orderController.getUserOrder);
router.post('/:id/subscription/setup', orderController.setupProductSubscription);
router.post('/preview', orderController.previewOrder);
router.post('/create', orderController.createOrderForPayment);
router.post('/payment/verify', orderController.verifyOrderPayment);

module.exports = router;
