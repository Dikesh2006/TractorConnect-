const express = require('express');
const router = express.Router();

const bookingController = require('../controllers/bookingController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createBookingSchema,
  rejectBookingSchema,
  cancelBookingSchema,
  scheduleBookingSchema
} = require('../validators/bookingValidators');

// Customer routes
router.post('/', authenticate, validate(createBookingSchema), bookingController.createBooking);
router.get('/my', authenticate, bookingController.getMyBookings);
router.get('/my/:id', authenticate, bookingController.getMyBookingById);
router.patch('/my/:id/cancel', authenticate, validate(cancelBookingSchema), bookingController.customerCancelBooking);

// Admin & Owner management routes (supports /admin/*, /owner/*, and standard /:id/*)
router.get('/admin/all', authenticate, authorize('admin', 'owner'), bookingController.getAllBookingsAdmin);
router.get('/admin/:id', authenticate, authorize('admin', 'owner'), bookingController.getBookingByIdAdmin);
router.patch('/admin/:id/accept', authenticate, authorize('admin', 'owner'), bookingController.acceptBooking);
router.patch('/admin/:id/reject', authenticate, authorize('admin', 'owner'), validate(rejectBookingSchema), bookingController.rejectBooking);
router.patch('/admin/:id/schedule', authenticate, authorize('admin', 'owner'), validate(scheduleBookingSchema), bookingController.scheduleBooking);
router.patch('/admin/:id/start', authenticate, authorize('admin', 'owner'), bookingController.startWorkBooking);
router.patch('/admin/:id/cancel', authenticate, authorize('admin', 'owner'), validate(cancelBookingSchema), bookingController.adminCancelBooking);

router.get('/owner/all', authenticate, authorize('admin', 'owner'), bookingController.getAllBookingsAdmin);
router.get('/owner/:id', authenticate, authorize('admin', 'owner'), bookingController.getBookingByIdAdmin);
router.patch('/owner/:id/accept', authenticate, authorize('admin', 'owner'), bookingController.acceptBooking);
router.patch('/owner/:id/reject', authenticate, authorize('admin', 'owner'), validate(rejectBookingSchema), bookingController.rejectBooking);
router.patch('/owner/:id/schedule', authenticate, authorize('admin', 'owner'), validate(scheduleBookingSchema), bookingController.scheduleBooking);
router.patch('/owner/:id/start', authenticate, authorize('admin', 'owner'), bookingController.startWorkBooking);
router.patch('/owner/:id/cancel', authenticate, authorize('admin', 'owner'), validate(cancelBookingSchema), bookingController.adminCancelBooking);

router.get('/', authenticate, authorize('admin', 'owner'), bookingController.getAllBookingsAdmin);
router.get('/:id', authenticate, authorize('admin', 'owner'), bookingController.getBookingByIdAdmin);
router.patch('/:id/accept', authenticate, authorize('admin', 'owner'), bookingController.acceptBooking);
router.patch('/:id/reject', authenticate, authorize('admin', 'owner'), validate(rejectBookingSchema), bookingController.rejectBooking);
router.patch('/:id/schedule', authenticate, authorize('admin', 'owner'), validate(scheduleBookingSchema), bookingController.scheduleBooking);
router.patch('/:id/start', authenticate, authorize('admin', 'owner'), bookingController.startWorkBooking);
router.patch('/:id/cancel', authenticate, authorize('admin', 'owner'), validate(cancelBookingSchema), bookingController.adminCancelBooking);

module.exports = router;

