const express = require('express');
const router = express.Router();
const contactController = require('../../controllers/api/contactController');

router.post('/', contactController.submitEnquiry);

module.exports = router;
