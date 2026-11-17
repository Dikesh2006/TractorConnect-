const express = require('express');
const router = express.Router();

const workRecordController = require('../controllers/workRecordController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { completeWorkSchema } = require('../validators/workRecordValidators');

// Customer routes
router.get('/my', authenticate, workRecordController.getMyWorkRecords);
router.get('/booking/:bookingId', authenticate, workRecordController.getWorkRecordByBooking);

// Admin & Owner routes
router.get('/admin/all', authenticate, authorize('admin', 'owner'), workRecordController.getAllWorkRecordsAdmin);
router.post(
  '/complete/:bookingId',
  authenticate,
  authorize('admin', 'owner'),
  validate(completeWorkSchema),
  workRecordController.completeWork
);

// Detail view (customer gets ownership check; admin gets access)
router.get('/:id', authenticate, workRecordController.getWorkRecordById);

module.exports = router;

