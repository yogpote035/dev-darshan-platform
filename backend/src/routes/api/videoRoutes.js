const express = require('express');
const router = express.Router();
const videoController = require('../../controllers/api/videoController');

router.get('/', videoController.getVideos);
router.get('/:id', videoController.getVideoById);

module.exports = router;
