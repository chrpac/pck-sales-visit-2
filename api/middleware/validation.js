const Joi = require('joi');
const logger = require('../config/logger');

// Generic validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      logger.warn(`Validation error: ${errorMessage}`);
      
      return res.status(400).json({
        status: 'fail',
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    next();
  };
};

// User validation schemas
const userSchemas = {
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().max(50).required(),
    lastName: Joi.string().max(50).required(),
    role: Joi.string().valid('admin', 'manager', 'sales', 'user').default('user')
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  updateProfile: Joi.object({
    firstName: Joi.string().max(50),
    lastName: Joi.string().max(50),
    email: Joi.string().email()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
  })
};

// Visit validation schemas (example for sales visit system)
const visitSchemas = {
  create: Joi.object({
    customerId: Joi.string().required(),
    visitDate: Joi.date().required(),
    purpose: Joi.string().required(),
    notes: Joi.string().allow(''),
    location: Joi.object({
      address: Joi.string().required(),
      latitude: Joi.number(),
      longitude: Joi.number()
    }),
    status: Joi.string().valid('planned', 'in-progress', 'completed', 'cancelled').default('planned')
  }),

  update: Joi.object({
    visitDate: Joi.date(),
    purpose: Joi.string(),
    notes: Joi.string().allow(''),
    location: Joi.object({
      address: Joi.string(),
      latitude: Joi.number(),
      longitude: Joi.number()
    }),
    status: Joi.string().valid('planned', 'in-progress', 'completed', 'cancelled')
  })
};

// Validation middleware functions
const validateUserRegistration = validate(userSchemas.register);
const validateUserLogin = validate(userSchemas.login);
const validateUserUpdate = validate(userSchemas.updateProfile);
const validatePasswordChange = validate(userSchemas.changePassword);
const validateVisitCreation = validate(visitSchemas.create);
const validateVisitUpdate = validate(visitSchemas.update);

module.exports = {
  validate,
  userSchemas,
  visitSchemas,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validatePasswordChange,
  validateVisitCreation,
  validateVisitUpdate
};
