const express = require('express');
const router = express.Router();
const homeController = require('../../controllers/api/homeController');

router.get('/feed', homeController.getHomeFeed);

module.exports = router;
