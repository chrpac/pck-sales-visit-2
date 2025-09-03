const Customer = require('../models/Customer');
const logger = require('../config/logger');

// Search/list customers
const listCustomers = async (req, res, next) => {
  try {
    const { search, limit = 10, page = 1 } = req.query;
    const filter = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const q = Customer.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(parseInt(limit));
    const [items, total] = await Promise.all([q, Customer.countDocuments(filter)]);

    res.status(200).json({
      status: 'success',
      pagination: { page: parseInt(page), limit: parseInt(limit), total },
      data: items
    });
  } catch (error) {
    logger.error('List customers error:', error);
    next(error);
  }
};

// Create customer
const createCustomer = async (req, res, next) => {
  try {
    const payload = req.body;
    payload.createdBy = req.user._id;
    payload.updatedBy = req.user._id;
    const customer = await Customer.create(payload);
    res.status(201).json({ status: 'success', data: customer });
  } catch (error) {
    logger.error('Create customer error:', error);
    next(error);
  }
};

// Get customer by id
const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ status: 'fail', message: 'Customer not found' });
    res.status(200).json({ status: 'success', data: customer });
  } catch (error) {
    logger.error('Get customer error:', error);
    next(error);
  }
};

module.exports = {
  listCustomers,
  createCustomer,
  getCustomerById,
};

// Update customer
module.exports.updateCustomer = async (req, res, next) => {
  try {
    const payload = { ...req.body, updatedBy: req.user._id };
    const customer = await Customer.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });
    if (!customer) return res.status(404).json({ status: 'fail', message: 'Customer not found' });
    res.status(200).json({ status: 'success', data: customer });
  } catch (error) {
    logger.error('Update customer error:', error);
    next(error);
  }
};

// Delete customer
module.exports.deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ status: 'fail', message: 'Customer not found' });
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    logger.error('Delete customer error:', error);
    next(error);
  }
};
