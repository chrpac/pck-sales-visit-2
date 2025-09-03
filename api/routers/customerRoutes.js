const express = require('express');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { customerSchemas } = require('../middleware/validation');
const customerController = require('../controllers/customerController');

const router = express.Router();

// All endpoints require authentication
router.use(protect);

router.get('/', customerController.listCustomers);
router.post('/', validate(customerSchemas.create), customerController.createCustomer);
router.get('/:id', customerController.getCustomerById);
router.patch('/:id', validate(customerSchemas.update), customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;
