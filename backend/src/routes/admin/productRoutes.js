const express = require('express');
const router = express.Router();
const productController = require('../../controllers/admin/productController');
const upload = require('../../middlewares/uploadMiddleware');

router.get('/', productController.getProducts);
router.get('/add', productController.getAddProduct);
router.post('/add', upload.single('image'), productController.postAddProduct);
router.get('/:id/edit', productController.getEditProduct);
router.post('/:id/edit', upload.single('image'), productController.postEditProduct);
router.get('/:id/toggle', productController.toggleStatus);
router.get('/:id/delete', productController.deleteProduct);

module.exports = router;
