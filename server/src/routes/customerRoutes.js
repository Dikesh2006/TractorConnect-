const express = require('express');
const router = express.Router();

const customerController = require('../controllers/customerController');
const { authenticate, authorize } = require('../middleware/auth');

// Customer management routes
router.get('/', authenticate, authorize('admin', 'owner'), customerController.getAllCustomers);
router.get('/:id', authenticate, authorize('admin', 'owner'), customerController.getCustomerDetails);
router.patch('/:id/status', authenticate, authorize('admin'), customerController.toggleCustomerStatus);

module.exports = router;

