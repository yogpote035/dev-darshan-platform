const express = require('express');
const router = express.Router();
const { handleRazorpayWebhook } = require('../../controllers/api/webhookController');

/**
 * @openapi
 * /api/webhooks/razorpay:
 *   post:
 *     summary: Razorpay payment and subscription webhook endpoint
 *     tags: [Webhooks]
 */

router.post('/razorpay', handleRazorpayWebhook);

module.exports = router;
