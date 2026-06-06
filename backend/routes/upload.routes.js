const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// All mapped registered users can post file fragments
router.post('/upload', uploadController.uploadAttachment);

module.exports = router;
