const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const controller = require('../../controllers/api/productSubscriptionController');

/**
 * @openapi
 * /api/product-subscriptions:
 *   get:
 *     summary: List authenticated user's product subscriptions
 *     tags: [Product subscriptions]
 *     security: [{ bearerAuth: [] }]
 * /api/product-subscriptions/verify:
 *   post:
 *     summary: Verify Razorpay recurring subscription authorization
 *     tags: [Product subscriptions]
 *     security: [{ bearerAuth: [] }]
 * /api/product-subscriptions/{id}/cancel:
 *   post:
 *     summary: Cancel a product subscription owned by the authenticated user
 *     tags: [Product subscriptions]
 *     security: [{ bearerAuth: [] }]
 */

router.use(authMiddleware);
router.get('/', controller.listSubscriptions);
router.post('/verify', controller.verifySubscription);
router.post('/:id/cancel', controller.cancelSubscription);

module.exports = router;
