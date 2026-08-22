const express = require('express');
const router = express.Router();
const productCategoryController = require('../../controllers/api/productCategoryController');

router.get('/', productCategoryController.getActiveProductCategories);

module.exports = router;
