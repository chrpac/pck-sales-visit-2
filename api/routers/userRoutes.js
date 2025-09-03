const express = require('express');
const userController = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');
const { validateUserUpdate, validateAdminUserUpdate, validateAdminUserCreate } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Public (authenticated) utility route for sales dropdown
router.get('/sales', userController.getSalesUsers);

// Routes that require admin role
router.use(restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(validateAdminUserCreate, userController.createUser);

router
  .route('/:id')
  .get(userController.getUserById)
  .patch(validateAdminUserUpdate, userController.updateUser)
  .delete(userController.deleteUser);

router.patch('/:id/deactivate', userController.deactivateUser);
router.patch('/:id/activate', userController.activateUser);

module.exports = router;
