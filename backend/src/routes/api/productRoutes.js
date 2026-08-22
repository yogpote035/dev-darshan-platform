const express = require('express');
const router = express.Router();
const productController = require('../../controllers/api/productController');

/**
 * @openapi
 * /api/products:
 *   get:
 *     summary: List active store products
 *     tags: [Products]
 * /api/products/{id}:
 *   get:
 *     summary: Get an active product and its disclosed offer details
 *     tags: [Products]
 */

router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

module.exports = router;
