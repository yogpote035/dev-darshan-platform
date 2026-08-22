const express = require('express');
const router = express.Router();
const favoriteController = require('../../controllers/api/favoriteController');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware); // All favorites routes require JWT authentication

router.get('/', favoriteController.getFavorites);
router.post('/toggle', favoriteController.toggleFavorite);

module.exports = router;
