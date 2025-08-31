const express = require('express');
const oauthController = require('../controllers/oauthController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Microsoft OAuth2 routes
router.get('/microsoft', oauthController.microsoftLogin);
router.get('/microsoft/callback', oauthController.microsoftCallback);

// Authentication status and user info routes
router.get('/me', protect, oauthController.getCurrentUser);
router.get('/check', oauthController.checkAuth);
router.post('/logout', oauthController.logout);

module.exports = router;
