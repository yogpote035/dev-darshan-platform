const express = require('express');
const router = express.Router();
const productCategoryController = require('../../controllers/admin/productCategoryController');
const upload = require('../../middlewares/uploadMiddleware');

router.get('/', productCategoryController.getProductCategories);
router.get('/add', productCategoryController.getAddProductCategory);
router.post('/add', upload.single('image'), productCategoryController.postAddProductCategory);
router.get('/:id/edit', productCategoryController.getEditProductCategory);
router.post('/:id/edit', upload.single('image'), productCategoryController.postEditProductCategory);
router.get('/:id/toggle', productCategoryController.toggleStatus);
router.get('/:id/delete', productCategoryController.deleteProductCategory);

module.exports = router;
