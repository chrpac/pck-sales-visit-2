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

// Admin-only user update schema
userSchemas.adminUpdate = Joi.object({
  firstName: Joi.string().max(50),
  lastName: Joi.string().max(50),
  email: Joi.string().email(),
  role: Joi.string().valid('admin', 'manager', 'sales'),
  isActive: Joi.boolean(),
});

// Admin-only create user schema
userSchemas.adminCreate = Joi.object({
  email: Joi.string().email().required(),
  firstName: Joi.string().max(50).required(),
  lastName: Joi.string().max(50).required(),
  displayName: Joi.string().max(100).allow(''),
  role: Joi.string().valid('admin', 'manager', 'sales').required(),
  isActive: Joi.boolean().default(true),
});

// Customer validation schemas
const customerSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(200).required(),
    province: Joi.string().allow(''),
    contacts: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        phone: Joi.string().allow(''),
        position: Joi.string().allow(''),
        isDecisionMaker: Joi.boolean().default(false)
      })
    ).default([]),
    businessCard: Joi.object({
      url: Joi.string().uri().allow(''),
      provider: Joi.string().allow(''),
      key: Joi.string().allow('')
    }).optional(),
    currentProviderBrand: Joi.string().allow(''),
    notes: Joi.string().max(2000).allow(''),
  }),
  update: Joi.object({
    name: Joi.string().min(2).max(200),
    province: Joi.string().allow(''),
    contacts: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        phone: Joi.string().allow(''),
        position: Joi.string().allow(''),
        isDecisionMaker: Joi.boolean().default(false)
      })
    ),
    businessCard: Joi.object({
      url: Joi.string().uri().allow(''),
      provider: Joi.string().allow(''),
      key: Joi.string().allow('')
    }).allow(null),
    currentProviderBrand: Joi.string().allow(''),
    notes: Joi.string().max(2000).allow(''),
  })
};

// Visit validation schemas (sales visit system)
const visitSchemas = {
  create: Joi.object({
    // Sales
    salesUser: Joi.string().hex().length(24),
    salesNameManual: Joi.string().max(100),
    brand: Joi.string().valid('PCKem', 'Watreat').required(),
    visitAt: Joi.date().required(),

    // Customer link only
    customer: Joi.string().hex().length(24),

    // Offering
    jobType: Joi.string().valid('Chemical Service', 'Project', 'Maintenance', 'Trading'),
    budgetTHB: Joi.number().min(0),
    purpose: Joi.string().valid(
      'แนะนำบริษัท/สินค้า/เก็บข้อมูล',
      'เสนอสินค้า/บริการ',
      'สำรวจ/เก็บข้อมูลเพิ่มเติม',
      'สรุปปิดการขาย/ต่อรองราคา',
      'ติดตามใบเสนอราคา/ข้อเสนอ',
      'เข้าพบเพื่อสร้างความสัมพันธ์',
      'พูดคุยปัญหา สินค้า/บริการ'
    ),

    // Result
    productPresented: Joi.string().max(2000).allow(''),
    details: Joi.string().max(4000).allow(''),
    needHelp: Joi.string().max(1000).allow(''),
    winReason: Joi.string().max(1000).allow(''),
    evaluationScore: Joi.number().integer().min(-5).max(5),
    nextActionPlan: Joi.string().max(1000).allow(''),
    nextVisitAt: Joi.date().allow(null),
    photos: Joi.array().max(3).items(
      Joi.object({
        url: Joi.string().uri().allow(''),
        provider: Joi.string().allow(''),
        key: Joi.string().allow('')
      })
    ).default([]),

    status: Joi.string().valid('planned', 'in-progress', 'completed', 'cancelled', 'pending').default('completed'),

    // Option to create or update customer inline
    newCustomer: customerSchemas.create.optional(),
    customerUpdate: customerSchemas.update.optional(),
  }).custom((value, helpers) => {
    // Require either salesUser or salesNameManual
    if (!value.salesUser && !value.salesNameManual) {
      return helpers.error('any.custom', { message: 'Either salesUser or salesNameManual is required' });
    }
    // Require either customer or newCustomer
    if (!value.customer && !value.newCustomer) {
      return helpers.error('any.custom', { message: 'Customer selection or creation is required' });
    }
    return value;
  }, 'Visit creation rule'),

  update: Joi.object({
    salesUser: Joi.string().hex().length(24),
    salesNameManual: Joi.string().max(100),
    brand: Joi.string().valid('PCKem', 'Watreat'),
    visitAt: Joi.date(),
    customer: Joi.string().hex().length(24),
    customerUpdate: customerSchemas.update.optional(),
    jobType: Joi.string().valid('Chemical Service', 'Project', 'Maintenance', 'Trading'),
    budgetTHB: Joi.number().min(0),
    purpose: Joi.string().valid(
      'แนะนำบริษัท/สินค้า/เก็บข้อมูล',
      'เสนอสินค้า/บริการ',
      'สำรวจ/เก็บข้อมูลเพิ่มเติม',
      'สรุปปิดการขาย/ต่อรองราคา',
      'ติดตามใบเสนอราคา/ข้อเสนอ',
      'เข้าพบเพื่อสร้างความสัมพันธ์',
      'พูดคุยปัญหา สินค้า/บริการ'
    ),
    productPresented: Joi.string().max(2000).allow(''),
    details: Joi.string().max(4000).allow(''),
    needHelp: Joi.string().max(1000).allow(''),
    winReason: Joi.string().max(1000).allow(''),
    evaluationScore: Joi.number().integer().min(-5).max(5),
    nextActionPlan: Joi.string().max(1000).allow(''),
    nextVisitAt: Joi.date().allow(null),
    photos: Joi.array().max(3).items(
      Joi.object({ url: Joi.string().uri().allow(''), provider: Joi.string().allow(''), key: Joi.string().allow('') })
    ),
    status: Joi.string().valid('planned', 'in-progress', 'completed', 'cancelled', 'pending')
  })
};

// Validation middleware functions
const validateUserRegistration = validate(userSchemas.register);
const validateUserLogin = validate(userSchemas.login);
const validateUserUpdate = validate(userSchemas.updateProfile);
const validatePasswordChange = validate(userSchemas.changePassword);
const validateAdminUserUpdate = validate(userSchemas.adminUpdate);
const validateAdminUserCreate = validate(userSchemas.adminCreate);
const validateVisitCreation = validate(visitSchemas.create);
const validateVisitUpdate = validate(visitSchemas.update);

module.exports = {
  validate,
  userSchemas,
  customerSchemas,
  visitSchemas,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateAdminUserUpdate,
  validateAdminUserCreate,
  validatePasswordChange,
  validateVisitCreation,
  validateVisitUpdate
};
