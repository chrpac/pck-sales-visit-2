const User = require('../models/User');
const logger = require('../config/logger');

// Get all users (admin only)
const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    if (req.query.search) {
      filter.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { username: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: users.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: {
        users
      }
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    next(error);
  }
};

// Get user by ID
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    logger.error('Get user by ID error:', error);
    next(error);
  }
};

// Update user (admin only)
const updateUser = async (req, res, next) => {
  try {
    // Remove password from update data (use separate endpoint for password changes)
    const { password, ...updateData } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    logger.info(`User updated by admin: ${user.email}`);

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    logger.error('Update user error:', error);
    next(error);
  }
};

// Delete user (admin only)
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    logger.info(`User deleted by admin: ${user.email}`);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    next(error);
  }
};

// Deactivate user (admin only)
const deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    logger.info(`User deactivated: ${user.email}`);

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    logger.error('Deactivate user error:', error);
    next(error);
  }
};

// Activate user (admin only)
const activateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    logger.info(`User activated: ${user.email}`);

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    logger.error('Activate user error:', error);
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  deactivateUser,
  activateUser,
  // Added export placeholder; function added below
};

// List sales users (lightweight for dropdown)
// Note: export placed above to not disturb existing usage; add named export here
module.exports.getSalesUsers = async (req, res, next) => {
  try {
    const { search = '', limit = 10 } = req.query;
    const filter = { role: 'sales', isActive: true };
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const users = await User.find(filter)
      .limit(parseInt(limit))
      .sort({ displayName: 1, firstName: 1 })
      .select('displayName firstName lastName email role');

    res.status(200).json({ status: 'success', results: users.length, data: { users } });
  } catch (error) {
    logger.error('Get sales users error:', error);
    next(error);
  }
};

// Create user (admin)
module.exports.createUser = async (req, res, next) => {
  try {
    const { email, firstName, lastName, displayName, role, isActive = true } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ status: 'fail', message: 'Email already exists' });
    }

    const user = await User.create({
      email,
      firstName,
      lastName,
      displayName: displayName || `${firstName} ${lastName}`,
      role,
      isActive,
    });

    logger.info(`Admin created user: ${user.email}`);
    res.status(201).json({ status: 'success', data: { user } });
  } catch (error) {
    logger.error('Create user error:', error);
    next(error);
  }
};
