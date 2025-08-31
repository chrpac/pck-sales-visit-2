const microsoftAuth = require('../config/microsoftAuth');
const User = require('../models/User');
const { createSendToken, createTokenCookie } = require('../middleware/auth');
const logger = require('../config/logger');

// Initiate Microsoft OAuth login
const microsoftLogin = (req, res) => {
  try {
    logger.info('Initiating Microsoft OAuth login');
    const authUrl = microsoftAuth.getAuthUrl();
    res.redirect(authUrl);
  } catch (error) {
    logger.error('Failed to initiate Microsoft login:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=server_error`);
  }
};

// Handle Microsoft OAuth callback
const microsoftCallback = async (req, res) => {
  try {
    const { code, error, error_description } = req.query;

    // Handle OAuth errors
    if (error) {
      logger.error('Microsoft OAuth error:', { error, error_description });
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`);
    }

    if (!code) {
      logger.error('No authorization code received');
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`);
    }

    // Get user profile from Microsoft
    const microsoftProfile = await microsoftAuth.validateAndGetUser(code);

    // Find or create user in database
    const user = await User.findOrCreateFromMicrosoft(microsoftProfile);

    if (!user) {
      logger.warn(`Login attempt from unauthorized user: ${microsoftProfile.mail}`);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=unauthorized`);
    }

    if (!user.isActive) {
      logger.warn(`Login attempt from inactive user: ${user.email}`);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=inactive`);
    }

    // Store user in session
    req.session.user = user;

    // Create JWT token cookie (without sending JSON response)
    createTokenCookie(user, res);

    logger.info(`User logged in successfully: ${user.email}`);
    
    // Redirect to frontend dashboard
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`);

  } catch (error) {
    logger.error('Microsoft OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=server_error`);
  }
};

// Get current authenticated user
const getCurrentUser = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Not authenticated'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    next(error);
  }
};

// Logout user
const logout = (req, res) => {
  try {
    // Clear JWT cookie
    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    // Clear session user
    if (req.session) {
      req.session.user = null;
      
      // Destroy session
      req.session.destroy((err) => {
        if (err) {
          logger.error('Session destroy error:', err);
          return res.status(500).json({
            status: 'error',
            message: 'Failed to logout'
          });
        }
        
        logger.info('User logged out successfully');
        res.status(200).json({
          status: 'success',
          message: 'Logged out successfully'
        });
      });
    } else {
      // No session, just clear cookie
      logger.info('User logged out successfully (no session)');
      res.status(200).json({
        status: 'success',
        message: 'Logged out successfully'
      });
    }
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to logout'
    });
  }
};

// Check authentication status
const checkAuth = async (req, res) => {
  try {
    // Check session user first
    if (req.session.user) {
      return res.status(200).json({
        status: 'success',
        authenticated: true,
        data: {
          user: req.session.user
        }
      });
    }

    // Check JWT user
    if (req.user) {
      return res.status(200).json({
        status: 'success',
        authenticated: true,
        data: {
          user: req.user
        }
      });
    }

    res.status(401).json({
      status: 'fail',
      authenticated: false,
      message: 'Not authenticated'
    });
  } catch (error) {
    logger.error('Check auth error:', error);
    res.status(500).json({
      status: 'error',
      authenticated: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  microsoftLogin,
  microsoftCallback,
  getCurrentUser,
  logout,
  checkAuth
};
