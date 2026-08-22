const express = require('express');
const router = express.Router();
const withdrawalController = require('../../controllers/api/withdrawalController');
const authMiddleware = require('../../middlewares/authMiddleware');
const upload = require('../../middlewares/uploadMiddleware');

router.get('/', authMiddleware, withdrawalController.getWithdrawals);
router.get('/commissions', authMiddleware, withdrawalController.getUserCommissions);
router.post('/', authMiddleware, upload.single('qr_code_image'), withdrawalController.createWithdrawal);

module.exports = router;
