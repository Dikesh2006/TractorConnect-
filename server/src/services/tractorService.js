const Tractor = require('../models/Tractor');
const Booking = require('../models/Booking');

/**
 * Get all tractors (scoped to owner if user is a tractor owner)
 */
const getAllTractors = async (status = null, currentUser = null) => {
  const query = { isActive: true };
  if (status) {
    query.status = status;
  }
  if (currentUser && currentUser.role === 'owner') {
    query.owner = currentUser._id;
  }

  return Tractor.find(query)
    .populate('owner', 'name businessName mobile')
    .sort({ name: 1 })
    .lean();
};

/**
 * Get single tractor
 */
const getTractorById = async (id, currentUser = null) => {
  const tractor = await Tractor.findById(id)
    .populate('owner', 'name businessName mobile')
    .lean();
  if (!tractor) {
    const error = new Error('Tractor not found');
    error.statusCode = 404;
    throw error;
  }

  // Cross-owner data isolation
  if (
    currentUser &&
    currentUser.role === 'owner' &&
    tractor.owner &&
    tractor.owner._id &&
    tractor.owner._id.toString() !== currentUser._id.toString()
  ) {
    const error = new Error('Access denied. You can only view your own fleet assets.');
    error.statusCode = 403;
    throw error;
  }

  return tractor;
};

/**
 * Create a new tractor
 */
const createTractor = async (data, currentUser = null) => {
  const existing = await Tractor.findOne({
    registrationNumber: data.registrationNumber.toUpperCase()
  });
  if (existing) {
    const error = new Error(`Tractor with registration number ${data.registrationNumber} already exists`);
    error.statusCode = 409;
    throw error;
  }

  const ownerId =
    currentUser && currentUser.role === 'owner'
      ? currentUser._id
      : data.ownerId || (currentUser ? currentUser._id : null);

  const tractor = new Tractor({
    owner: ownerId,
    name: data.name,
    registrationNumber: data.registrationNumber.toUpperCase(),
    model: data.model,
    horsepower: data.horsepower,
    status: data.status || 'available',
    currentOperatorName: data.currentOperatorName || '',
    notes: data.notes || '',
    isActive: true
  });

  await tractor.save();
  return tractor;
};

/**
 * Update tractor
 */
const updateTractor = async (id, data, currentUser = null) => {
  const tractor = await Tractor.findById(id);
  if (!tractor) {
    const error = new Error('Tractor not found');
    error.statusCode = 404;
    throw error;
  }

  // Cross-owner data isolation
  if (
    currentUser &&
    currentUser.role === 'owner' &&
    tractor.owner &&
    !tractor.owner.equals(currentUser._id)
  ) {
    const error = new Error('Access denied. You can only modify your own tractors.');
    error.statusCode = 403;
    throw error;
  }

  if (data.registrationNumber && data.registrationNumber.toUpperCase() !== tractor.registrationNumber) {
    const duplicate = await Tractor.findOne({
      _id: { $ne: id },
      registrationNumber: data.registrationNumber.toUpperCase()
    });
    if (duplicate) {
      const error = new Error(`Tractor with registration number ${data.registrationNumber} already exists`);
      error.statusCode = 409;
      throw error;
    }
    tractor.registrationNumber = data.registrationNumber.toUpperCase();
  }

  if (data.name !== undefined) tractor.name = data.name;
  if (data.model !== undefined) tractor.model = data.model;
  if (data.horsepower !== undefined) tractor.horsepower = data.horsepower;
  if (data.status !== undefined) tractor.status = data.status;
  if (data.currentOperatorName !== undefined) tractor.currentOperatorName = data.currentOperatorName;
  if (data.notes !== undefined) tractor.notes = data.notes;
  if (data.isActive !== undefined) tractor.isActive = data.isActive;

  await tractor.save();
  return tractor;
};

/**
 * Check tractor availability for a proposed time slot.
 * Detects overlapping assignments.
 */
const checkTractorAvailability = async (
  tractorId,
  scheduledStart,
  scheduledEnd,
  excludeBookingId = null,
  currentUser = null
) => {
  const tractor = await Tractor.findById(tractorId);
  if (!tractor) {
    return { available: false, reason: 'Tractor not found' };
  }

  // Cross-owner check
  if (
    currentUser &&
    currentUser.role === 'owner' &&
    tractor.owner &&
    !tractor.owner.equals(currentUser._id)
  ) {
    return { available: false, reason: 'Access denied. Tractor belongs to another owner.' };
  }

  if (!tractor.isActive) {
    return { available: false, reason: 'Tractor is deactivated' };
  }

  if (tractor.status === 'maintenance' || tractor.status === 'inactive') {
    return {
      available: false,
      reason: `Tractor is currently in '${tractor.status}' status and cannot be assigned`
    };
  }

  const startDate = new Date(scheduledStart);
  const endDate = new Date(scheduledEnd);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { available: false, reason: 'Invalid start or end date' };
  }

  if (startDate >= endDate) {
    return { available: false, reason: 'Scheduled end time must be after scheduled start time' };
  }

  // Find conflicting bookings: (scheduledStart < endDate) AND (scheduledEnd > startDate)
  const conflictQuery = {
    assignedTractor: tractorId,
    status: { $in: ['scheduled', 'in_progress'] },
    scheduledStart: { $lt: endDate },
    scheduledEnd: { $gt: startDate }
  };

  if (excludeBookingId) {
    conflictQuery._id = { $ne: excludeBookingId };
  }

  const conflictingBookings = await Booking.find(conflictQuery)
    .populate('customer', 'name mobile')
    .populate('service', 'name')
    .lean();

  if (conflictingBookings.length > 0) {
    return {
      available: false,
      reason: `Tractor has ${conflictingBookings.length} overlapping booking(s) in this time window`,
      conflicts: conflictingBookings
    };
  }

  return {
    available: true,
    tractor
  };
};

/**
 * Get tractor schedule / calendar events for date range
 */
const getTractorSchedule = async (startDate, endDate, currentUser = null) => {
  const start = new Date(startDate || new Date().setDate(new Date().getDate() - 7));
  const end = new Date(endDate || new Date().setDate(new Date().getDate() + 30));

  const query = {
    assignedTractor: { $ne: null },
    status: { $in: ['scheduled', 'in_progress', 'completed'] },
    scheduledStart: { $gte: start, $lte: end }
  };

  if (currentUser && currentUser.role === 'owner') {
    query.tractorOwner = currentUser._id;
  }

  const bookings = await Booking.find(query)
    .populate('assignedTractor', 'name registrationNumber model')
    .populate('customer', 'name mobile village')
    .populate('service', 'name pricingUnit')
    .sort({ scheduledStart: 1 })
    .lean();

  return bookings;
};

module.exports = {
  getAllTractors,
  getTractorById,
  createTractor,
  updateTractor,
  checkTractorAvailability,
  getTractorSchedule
};

