const express = require('express');
const router = express.Router();
const settingController = require('../../controllers/api/settingController');

router.get('/', settingController.getPublicSettings);

module.exports = router;
