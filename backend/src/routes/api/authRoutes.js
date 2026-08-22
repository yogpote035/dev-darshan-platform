const express = require('express');
const router = express.Router();
const authController = require('../../controllers/api/authController');
const { registerValidator, loginValidator } = require('../../validators/authValidator');
const authMiddleware = require('../../middlewares/authMiddleware');

router.post('/register', registerValidator, authController.register);
router.post('/login', loginValidator, authController.login);
router.post('/forgot-password', authController.requestPasswordReset);
router.post('/reset-password', authController.confirmPasswordReset);
router.get('/profile', authMiddleware, authController.profile);

module.exports = router;
