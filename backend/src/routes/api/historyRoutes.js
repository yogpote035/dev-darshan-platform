const express = require('express');
const router = express.Router();
const historyController = require('../../controllers/api/historyController');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware); // All history routes require JWT authentication

router.get('/', historyController.getHistory);
router.post('/', historyController.addHistory);

module.exports = router;
