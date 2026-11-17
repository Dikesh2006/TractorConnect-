const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const bookingService = require('../services/bookingService');

/**
 * @route   POST /api/v1/bookings
 * @desc    Customer creates a new booking
 * @access  Private (Customer & Admin)
 */
const createBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.createBooking(req.user._id, req.body);
  return sendSuccess(res, { booking }, 'Booking request submitted successfully', 201);
});

/**
 * @route   GET /api/v1/bookings/my
 * @desc    Customer views their booking history
 * @access  Private
 */
const getMyBookings = asyncHandler(async (req, res) => {
  const result = await bookingService.getMyBookings(req.user._id, req.query);
  return sendSuccess(res, result, 'My bookings retrieved');
});

/**
 * @route   GET /api/v1/bookings/my/:id
 * @desc    Customer views single booking details
 * @access  Private
 */
const getMyBookingById = asyncHandler(async (req, res) => {
  const booking = await bookingService.getMyBookingById(req.user._id, req.params.id);
  return sendSuccess(res, { booking }, 'Booking details retrieved');
});

/**
 * @route   PATCH /api/v1/bookings/my/:id/cancel
 * @desc    Customer cancels their booking
 * @access  Private
 */
const customerCancelBooking = asyncHandler(async (req, res) => {
  const { cancellationReason } = req.body;
  const booking = await bookingService.customerCancelBooking(
    req.user._id,
    req.params.id,
    cancellationReason || 'Cancelled by customer'
  );
  return sendSuccess(res, { booking }, 'Booking cancelled successfully');
});

/**
 * @route   GET /api/v1/bookings/admin/all
 * @desc    Admin / Owner: View bookings with filters (scoped to owner if role === 'owner')
 * @access  Private (Admin or Owner)
 */
const getAllBookingsAdmin = asyncHandler(async (req, res) => {
  const result = await bookingService.getAllBookingsAdmin(req.query, req.user);
  return sendSuccess(res, result, 'All bookings retrieved');
});

/**
 * @route   GET /api/v1/bookings/admin/:id
 * @desc    Admin / Owner: View single booking details
 * @access  Private (Admin or Owner)
 */
const getBookingByIdAdmin = asyncHandler(async (req, res) => {
  const booking = await bookingService.getBookingByIdAdmin(req.params.id, req.user);
  return sendSuccess(res, { booking }, 'Booking details retrieved');
});

/**
 * @route   PATCH /api/v1/bookings/admin/:id/accept
 * @desc    Admin: Accept booking
 * @access  Private (Admin only)
 */
const acceptBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.acceptBooking(req.params.id, req.user, req.body.adminNotes);
  return sendSuccess(res, { booking }, 'Booking accepted');
});

/**
 * @route   PATCH /api/v1/bookings/admin/:id/reject
 * @desc    Admin: Reject booking
 * @access  Private (Admin only)
 */
const rejectBooking = asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body;
  const booking = await bookingService.rejectBooking(req.params.id, rejectionReason, req.user);
  return sendSuccess(res, { booking }, 'Booking rejected');
});

/**
 * @route   PATCH /api/v1/bookings/admin/:id/schedule
 * @desc    Admin: Schedule booking with tractor assignment
 * @access  Private (Admin only)
 */
const scheduleBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.scheduleBooking(req.params.id, req.body, req.user);
  return sendSuccess(res, { booking }, 'Booking scheduled with tractor assignment');
});

/**
 * @route   PATCH /api/v1/bookings/admin/:id/start
 * @desc    Admin: Start work
 * @access  Private (Admin only)
 */
const startWorkBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.startWorkBooking(req.params.id, req.user);
  return sendSuccess(res, { booking }, 'Work started for booking');
});

/**
 * @route   PATCH /api/v1/bookings/admin/:id/cancel
 * @desc    Admin: Cancel booking
 * @access  Private (Admin only)
 */
const adminCancelBooking = asyncHandler(async (req, res) => {
  const { cancellationReason } = req.body;
  const booking = await bookingService.adminCancelBooking(
    req.params.id,
    cancellationReason || 'Cancelled by admin',
    req.user
  );
  return sendSuccess(res, { booking }, 'Booking cancelled by admin');
});

module.exports = {
  createBooking,
  getMyBookings,
  getMyBookingById,
  customerCancelBooking,
  getAllBookingsAdmin,
  getBookingByIdAdmin,
  acceptBooking,
  rejectBooking,
  scheduleBooking,
  startWorkBooking,
  adminCancelBooking
};

