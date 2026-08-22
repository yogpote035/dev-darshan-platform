const express = require('express');
const router = express.Router();
const cartController = require('../../controllers/api/cartController');
const authMiddleware = require('../../middlewares/authMiddleware');

/**
 * @openapi
 * /api/cart:
 *   get:
 *     summary: Get the authenticated user's cart
 *     tags: [Cart]
 *     security: [{ bearerAuth: [] }]
 *   post:
 *     summary: Add a product to cart
 *     tags: [Cart]
 *     security: [{ bearerAuth: [] }]
 */

router.use(authMiddleware);

router.get('/', cartController.getCart);
router.post('/', cartController.addToCart);
router.put('/:itemId', cartController.updateCartItem);
router.delete('/:itemId', cartController.removeCartItem);
router.delete('/', cartController.clearCart);

module.exports = router;
