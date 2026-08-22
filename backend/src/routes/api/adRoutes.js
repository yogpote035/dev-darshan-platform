const express = require('express');
const router = express.Router();
const adController = require('../../controllers/api/adController');

router.get('/', adController.getActiveAds);

module.exports = router;
