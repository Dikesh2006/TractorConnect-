const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Tractor = require('../models/Tractor');
const tractorService = require('./tractorService');
const { round2Decimals } = require('../utils/formatters');

/**
 * Valid lifecycle transitions map
 */
const VALID_TRANSITIONS = {
  pending: ['accepted', 'rejected', 'cancelled'],
  accepted: ['scheduled', 'cancelled'],
  scheduled: ['in_progress', 'scheduled', 'cancelled'], // can reschedule
  in_progress: ['completed', 'cancelled'],
  completed: [],
  rejected: [],
  cancelled: []
};

const assertValidTransition = (currentStatus, targetStatus) => {
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    const error = new Error(
      `Invalid booking status transition: cannot change from '${currentStatus}' to '${targetStatus}'.`
    );
    error.statusCode = 400;
    throw error;
  }
};

/**
 * Customer creates a new booking
 * Re-reads live service price and creates snapshot
 * Routes booking to selected tractor owner
 */
const createBooking = async (customerId, data) => {
  const service = await Service.findById(data.serviceId);
  if (!service) {
    const error = new Error('Selected farming service does not exist');
    error.statusCode = 404;
    throw error;
  }

  if (!service.isActive) {
    const error = new Error('This farming service is currently inactive and cannot be booked');
    error.statusCode = 400;
    throw error;
  }

  // Determine tractor owner for this booking
  const User = mongoose.model('User');
  let targetOwnerId = data.ownerId || service.owner;
  if (typeof targetOwnerId === 'object' && targetOwnerId !== null && targetOwnerId._id) {
    targetOwnerId = targetOwnerId._id;
  }
  if (!targetOwnerId) {
    const defaultAdmin = await User.findOne({ role: 'admin' });
    targetOwnerId = defaultAdmin ? defaultAdmin._id : null;
  }

  if (targetOwnerId) {
    const ownerUser = await User.findById(targetOwnerId);
    if (ownerUser && ownerUser.role === 'owner') {
      if (!ownerUser.isApproved || ownerUser.approvalStatus !== 'approved') {
        const error = new Error('Selected tractor owner is not yet approved by platform administration');
        error.statusCode = 400;
        throw error;
      }
      if (!ownerUser.isActive) {
        const error = new Error('Selected tractor owner is currently deactivated');
        error.statusCode = 400;
        throw error;
      }
    }
  }

  const quantity = parseFloat(data.estimatedQuantity);
  const rawCost = service.currentPrice * quantity;
  const estimatedCost = round2Decimals(Math.max(rawCost, service.minimumCharge || 0));

  const booking = new Booking({
    customer: customerId,
    tractorOwner: targetOwnerId,
    service: service._id,
    serviceSnapshot: {
      name: service.name,
      pricingUnit: service.pricingUnit,
      unitPrice: service.currentPrice,
      minimumCharge: service.minimumCharge || 0
    },
    estimatedQuantity: quantity,
    estimatedCost,
    requestedDate: new Date(data.requestedDate),
    requestedTimeSlot: data.requestedTimeSlot || 'morning',
    fieldLocation: {
      latitude: data.fieldLocation.latitude || null,
      longitude: data.fieldLocation.longitude || null,
      village: data.fieldLocation.village.trim(),
      tehsil: data.fieldLocation.tehsil?.trim() || '',
      district: data.fieldLocation.district.trim(),
      state: data.fieldLocation.state?.trim() || 'Madhya Pradesh',
      pincode: data.fieldLocation.pincode?.trim() || '',
      fullAddress: data.fieldLocation.fullAddress?.trim() || '',
      landmark: data.fieldLocation.landmark?.trim() || ''
    },
    cropType: data.cropType?.trim() || '',
    customerNotes: data.customerNotes?.trim() || '',
    status: 'pending',
    statusHistory: [
      {
        status: 'pending',
        changedBy: customerId,
        changedAt: new Date(),
        note: 'Booking requested by farmer'
      }
    ]
  });

  await booking.save();
  return booking.populate([
    { path: 'customer', select: 'name mobile village district' },
    { path: 'service', select: 'name category imageUrl' },
    { path: 'tractorOwner', select: 'name businessName mobile village district' }
  ]);
};

/**
 * List bookings for customer
 */
const getMyBookings = async (customerId, { page = 1, limit = 10, status = '' }) => {
  const query = { customer: customerId };
  if (status) {
    query.status = status;
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('service', 'name category')
      .populate('tractorOwner', 'name businessName mobile village')
      .populate('assignedTractor', 'name model registrationNumber')
      .lean(),
    Booking.countDocuments(query)
  ]);

  return {
    bookings,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

/**
 * Get single customer booking (with ownership check)
 */
const getMyBookingById = async (customerId, bookingId) => {
  const booking = await Booking.findOne({ _id: bookingId, customer: customerId })
    .populate('customer', 'name mobile email village district address')
    .populate('tractorOwner', 'name businessName mobile village district location')
    .populate('service', 'name category description imageUrl currentPrice pricingUnit')
    .populate('assignedTractor', 'name model registrationNumber horsepower')
    .lean();

  if (!booking) {
    const error = new Error('Booking not found or does not belong to you');
    error.statusCode = 404;
    throw error;
  }

  return booking;
};

/**
 * Customer cancels their booking
 */
const customerCancelBooking = async (customerId, bookingId, cancellationReason) => {
  const booking = await Booking.findOne({ _id: bookingId, customer: customerId });
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  if (!['pending', 'accepted', 'scheduled'].includes(booking.status)) {
    const error = new Error(
      `Cannot cancel booking in '${booking.status}' status. Only pending, accepted, or scheduled bookings can be cancelled.`
    );
    error.statusCode = 400;
    throw error;
  }

  booking.status = 'cancelled';
  booking.cancelledBy = customerId;
  booking.cancellationReason = cancellationReason;
  booking.statusHistory.push({
    status: 'cancelled',
    changedBy: customerId,
    changedAt: new Date(),
    note: `Cancelled by customer: ${cancellationReason}`
  });

  await booking.save();
  return booking;
};

/**
 * Admin / Owner: Get all bookings with filtering & pagination
 */
const getAllBookingsAdmin = async (
  {
    page = 1,
    limit = 20,
    status = '',
    village = '',
    service = '',
    customer = '',
    ownerId = '',
    startDate = '',
    endDate = ''
  },
  currentUser = null
) => {
  const query = {};

  // Scope to current tractor owner if user has role 'owner'
  if (currentUser && currentUser.role === 'owner') {
    query.tractorOwner = currentUser._id;
  } else if (ownerId && mongoose.Types.ObjectId.isValid(ownerId)) {
    query.tractorOwner = ownerId;
  }

  if (status) query.status = status;
  if (village) query['fieldLocation.village'] = { $regex: village, $options: 'i' };
  if (service) query.service = service;
  if (customer) query.customer = customer;

  if (startDate || endDate) {
    query.requestedDate = {};
    if (startDate) query.requestedDate.$gte = new Date(startDate);
    if (endDate) query.requestedDate.$lte = new Date(endDate);
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .sort({ requestedDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('customer', 'name mobile village district')
      .populate('service', 'name category pricingUnit currentPrice')
      .populate('tractorOwner', 'name businessName mobile village district')
      .populate('assignedTractor', 'name registrationNumber model')
      .lean(),
    Booking.countDocuments(query)
  ]);

  return {
    bookings,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

/**
 * Admin / Owner: Get single booking
 */
const getBookingByIdAdmin = async (bookingId, currentUser = null) => {
  const booking = await Booking.findById(bookingId)
    .populate('customer', 'name mobile email village district address')
    .populate('service', 'name category currentPrice pricingUnit')
    .populate('tractorOwner', 'name businessName mobile village district location')
    .populate('assignedTractor', 'name model registrationNumber horsepower status')
    .populate('statusHistory.changedBy', 'name role')
    .lean();

  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  // Cross-owner data isolation check
  if (
    currentUser &&
    currentUser.role === 'owner' &&
    booking.tractorOwner &&
    booking.tractorOwner._id &&
    booking.tractorOwner._id.toString() !== currentUser._id.toString()
  ) {
    const error = new Error('Access denied. You can only view bookings routed to your business.');
    error.statusCode = 403;
    throw error;
  }

  return booking;
};

/**
 * Admin / Owner: Accept booking
 */
const acceptBooking = async (bookingId, currentUser, notes = '') => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  if (
    currentUser.role === 'owner' &&
    booking.tractorOwner &&
    !booking.tractorOwner.equals(currentUser._id)
  ) {
    const error = new Error('Access denied. You can only accept bookings assigned to your business.');
    error.statusCode = 403;
    throw error;
  }

  assertValidTransition(booking.status, 'accepted');

  booking.status = 'accepted';
  if (notes) booking.adminNotes = notes;

  booking.statusHistory.push({
    status: 'accepted',
    changedBy: currentUser._id,
    changedAt: new Date(),
    note: notes || `Booking accepted by ${currentUser.role === 'owner' ? 'tractor owner' : 'admin'}`
  });

  await booking.save();
  return booking;
};

/**
 * Admin / Owner: Reject booking
 */
const rejectBooking = async (bookingId, rejectionReason, currentUser) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  if (
    currentUser.role === 'owner' &&
    booking.tractorOwner &&
    !booking.tractorOwner.equals(currentUser._id)
  ) {
    const error = new Error('Access denied. You can only reject bookings assigned to your business.');
    error.statusCode = 403;
    throw error;
  }

  assertValidTransition(booking.status, 'rejected');

  booking.status = 'rejected';
  booking.rejectionReason = rejectionReason;

  booking.statusHistory.push({
    status: 'rejected',
    changedBy: currentUser._id,
    changedAt: new Date(),
    note: `Rejected by ${currentUser.role === 'owner' ? 'tractor owner' : 'admin'}: ${rejectionReason}`
  });

  await booking.save();
  return booking;
};

/**
 * Admin / Owner: Schedule booking (assigns tractor + date/time, checks for conflicts)
 */
const scheduleBooking = async (bookingId, data, currentUser) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  if (
    currentUser.role === 'owner' &&
    booking.tractorOwner &&
    !booking.tractorOwner.equals(currentUser._id)
  ) {
    const error = new Error('Access denied. You can only schedule bookings assigned to your business.');
    error.statusCode = 403;
    throw error;
  }

  assertValidTransition(booking.status, 'scheduled');

  const { tractorId, scheduledStart, scheduledEnd, operatorName, adminNotes } = data;

  // Check tractor availability and detect overlapping assignments
  const availability = await tractorService.checkTractorAvailability(
    tractorId,
    scheduledStart,
    scheduledEnd,
    booking._id,
    currentUser
  );

  if (!availability.available) {
    const error = new Error(`Cannot schedule tractor: ${availability.reason}`);
    error.statusCode = 400;
    error.conflicts = availability.conflicts || null;
    throw error;
  }

  booking.status = 'scheduled';
  booking.assignedTractor = tractorId;
  booking.scheduledStart = new Date(scheduledStart);
  booking.scheduledEnd = new Date(scheduledEnd);
  if (operatorName) booking.assignedOperatorName = operatorName;
  if (adminNotes) booking.adminNotes = adminNotes;

  booking.statusHistory.push({
    status: 'scheduled',
    changedBy: currentUser._id,
    changedAt: new Date(),
    note: `Scheduled with tractor ${availability.tractor.name} (${availability.tractor.registrationNumber}) from ${new Date(scheduledStart).toLocaleString()} to ${new Date(scheduledEnd).toLocaleString()}`
  });

  await booking.save();
  return booking.populate([
    { path: 'assignedTractor', select: 'name model registrationNumber' },
    { path: 'customer', select: 'name mobile' }
  ]);
};

/**
 * Admin / Owner: Start work (in_progress)
 */
const startWorkBooking = async (bookingId, currentUser) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  if (
    currentUser.role === 'owner' &&
    booking.tractorOwner &&
    !booking.tractorOwner.equals(currentUser._id)
  ) {
    const error = new Error('Access denied. You can only start work for your own bookings.');
    error.statusCode = 403;
    throw error;
  }

  assertValidTransition(booking.status, 'in_progress');

  booking.status = 'in_progress';
  booking.statusHistory.push({
    status: 'in_progress',
    changedBy: currentUser._id,
    changedAt: new Date(),
    note: 'Tractor field work started'
  });

  await booking.save();

  // Update tractor status to 'in_use'
  if (booking.assignedTractor) {
    await Tractor.findByIdAndUpdate(booking.assignedTractor, { status: 'in_use' });
  }

  return booking;
};

/**
 * Admin / Owner: Cancel booking
 */
const adminCancelBooking = async (bookingId, cancellationReason, currentUser) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  if (
    currentUser.role === 'owner' &&
    booking.tractorOwner &&
    !booking.tractorOwner.equals(currentUser._id)
  ) {
    const error = new Error('Access denied. You can only cancel your own bookings.');
    error.statusCode = 403;
    throw error;
  }

  if (booking.status === 'completed') {
    const error = new Error('Completed bookings cannot be cancelled');
    error.statusCode = 400;
    throw error;
  }

  booking.status = 'cancelled';
  booking.cancelledBy = currentUser._id;
  booking.cancellationReason = cancellationReason;

  booking.statusHistory.push({
    status: 'cancelled',
    changedBy: currentUser._id,
    changedAt: new Date(),
    note: `Cancelled by ${currentUser.role === 'owner' ? 'tractor owner' : 'admin'}: ${cancellationReason}`
  });

  await booking.save();

  // Free tractor if in_use
  if (booking.assignedTractor) {
    const tractor = await Tractor.findById(booking.assignedTractor);
    if (tractor && tractor.status === 'in_use') {
      tractor.status = 'available';
      await tractor.save();
    }
  }

  return booking;
};

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

