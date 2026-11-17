const express = require('express');
const router = express.Router();

const paymentController = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { recordPaymentSchema, voidPaymentSchema } = require('../validators/paymentValidators');

// Customer dues check
router.get('/dues/my', authenticate, paymentController.getMyDues);

// Payments for a work record
router.get('/work-record/:workRecordId', authenticate, paymentController.getPaymentsForWorkRecord);

// Admin & Owner payment operations
router.get('/admin/all', authenticate, authorize('admin', 'owner'), paymentController.getAllPaymentsAdmin);
router.get('/dues/customer/:customerId', authenticate, authorize('admin', 'owner'), paymentController.getCustomerDues);
router.post('/', authenticate, authorize('admin', 'owner'), validate(recordPaymentSchema), paymentController.recordPayment);
router.patch('/:id/void', authenticate, authorize('admin', 'owner'), validate(voidPaymentSchema), paymentController.voidPayment);

module.exports = router;

