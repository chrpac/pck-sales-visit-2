const express = require('express');
const { protect } = require('../middleware/auth');
const uploadController = require('../controllers/uploadController');

const router = express.Router();

router.use(protect);

router.post('/presign', uploadController.presign);
router.get('/proxy', uploadController.proxy);

module.exports = router;

