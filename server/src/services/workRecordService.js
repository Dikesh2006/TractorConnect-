const mongoose = require('mongoose');
const WorkRecord = require('../models/WorkRecord');
const Booking = require('../models/Booking');
const Tractor = require('../models/Tractor');
const { round2Decimals } = require('../utils/formatters');

/**
 * Complete booking and create WorkRecord
 */
const completeBookingAndCreateWorkRecord = async (bookingId, data, adminUser) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  // Cross-owner data isolation check
  if (
    adminUser.role === 'owner' &&
    booking.tractorOwner &&
    !booking.tractorOwner.equals(adminUser._id)
  ) {
    const error = new Error('Access denied. You can only complete work for bookings assigned to your business.');
    error.statusCode = 403;
    throw error;
  }

  if (booking.status === 'completed') {
    const error = new Error('This booking is already completed');
    error.statusCode = 400;
    throw error;
  }

  if (!['scheduled', 'in_progress'].includes(booking.status)) {
    const error = new Error(
      `Cannot complete booking in '${booking.status}' status. It must be scheduled or in_progress first.`
    );
    error.statusCode = 400;
    throw error;
  }

  if (!booking.assignedTractor) {
    const error = new Error('Cannot complete booking without an assigned tractor');
    error.statusCode = 400;
    throw error;
  }

  // Check if a work record already exists
  const existingRecord = await WorkRecord.findOne({ booking: booking._id });
  if (existingRecord) {
    const error = new Error('A work record already exists for this booking');
    error.statusCode = 400;
    throw error;
  }

  const quantity = round2Decimals(data.actualQuantity);
  const unitPrice = booking.serviceSnapshot.unitPrice;
  const minimumCharge = booking.serviceSnapshot.minimumCharge || 0;

  const rawCharge = round2Decimals(unitPrice * quantity);
  const finalCharge = round2Decimals(Math.max(rawCharge, minimumCharge));

  const discount = round2Decimals(data.discount || 0);
  const extraCharges = round2Decimals(data.extraCharges || 0);
  const totalAmount = round2Decimals(Math.max(0, finalCharge - discount + extraCharges));

  // Determine actual acres for reporting
  let actualAcres = 0;
  if (data.actualAcres !== undefined && data.actualAcres !== null) {
    actualAcres = round2Decimals(data.actualAcres);
  } else if (booking.serviceSnapshot.pricingUnit === 'per_acre') {
    actualAcres = quantity;
  }

  const workDate = data.workDate ? new Date(data.workDate) : new Date();

  // Safe transaction support: check if MongoDB deployment is a Replica Set (e.g. MongoDB Atlas)
  // Standalone MongoDB (typical local dev) does not support multi-document transactions
  const topologyType = mongoose.connection.client?.topology?.description?.type;
  const isReplicaSet = topologyType === 'ReplicaSetWithPrimary' || topologyType === 'Sharded';

  let session = null;
  if (isReplicaSet) {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch {
      session = null;
    }
  }

  let workRecord;
  try {
    const sessionOption = session ? { session } : {};

    workRecord = new WorkRecord({
      booking: booking._id,
      customer: booking.customer,
      tractorOwner: booking.tractorOwner || adminUser._id,
      service: booking.service,
      serviceSnapshot: booking.serviceSnapshot,
      tractor: booking.assignedTractor,
      fieldLocation: booking.fieldLocation,
      actualQuantity: quantity,
      actualAcres,
      workDate,
      startTime: data.startTime || '',
      endTime: data.endTime || '',
      workingHours: round2Decimals(data.workingHours || 0),
      dieselUsedLiters: round2Decimals(data.dieselUsedLiters || 0),
      finalCharge,
      discount,
      discountReason: data.discountReason || '',
      extraCharges,
      extraChargesReason: data.extraChargesReason || '',
      totalAmount,
      amountPaid: 0,
      balanceDue: totalAmount,
      paymentStatus: 'unpaid',
      operatorName: data.operatorName || booking.assignedOperatorName || '',
      completionNotes: data.completionNotes || '',
      completedBy: adminUser._id
    });

    await workRecord.save(sessionOption);

    // Update booking status
    booking.status = 'completed';
    booking.statusHistory.push({
      status: 'completed',
      changedBy: adminUser._id,
      changedAt: new Date(),
      note: `Field work completed: ${quantity} ${booking.serviceSnapshot.pricingUnit}. Total amount: ₹${totalAmount}`
    });
    await booking.save(sessionOption);

    // Free assigned tractor
    await Tractor.findByIdAndUpdate(
      booking.assignedTractor,
      { status: 'available' },
      sessionOption
    );

    if (session) {
      await session.commitTransaction();
    }
  } catch (err) {
    if (session) {
      await session.abortTransaction();
    } else if (workRecord?._id) {
      // Compensation cleanup for standalone local database
      await WorkRecord.findByIdAndDelete(workRecord._id);
    }
    throw err;
  } finally {
    if (session) {
      session.endSession();
    }
  }

  return workRecord.populate([
    { path: 'customer', select: 'name mobile village district' },
    { path: 'tractor', select: 'name model registrationNumber' },
    { path: 'service', select: 'name category' }
  ]);
};

/**
 * Get all WorkRecords for Admin or Tractor Owner (scoped to owner if role === 'owner')
 */
const getAllWorkRecordsAdmin = async (
  {
    page = 1,
    limit = 20,
    village = '',
    paymentStatus = '',
    customer = '',
    ownerId = '',
    startDate = '',
    endDate = ''
  },
  currentUser = null
) => {
  const query = {};

  if (currentUser && currentUser.role === 'owner') {
    query.tractorOwner = currentUser._id;
  } else if (ownerId && mongoose.Types.ObjectId.isValid(ownerId)) {
    query.tractorOwner = ownerId;
  }

  if (paymentStatus) query.paymentStatus = paymentStatus;
  if (village) query['fieldLocation.village'] = { $regex: village, $options: 'i' };
  if (customer) query.customer = customer;

  if (startDate || endDate) {
    query.workDate = {};
    if (startDate) query.workDate.$gte = new Date(startDate);
    if (endDate) query.workDate.$lte = new Date(endDate);
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [records, total] = await Promise.all([
    WorkRecord.find(query)
      .sort({ workDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('customer', 'name mobile village')
      .populate('service', 'name category')
      .populate('tractorOwner', 'name businessName mobile')
      .populate('tractor', 'name registrationNumber')
      .lean(),
    WorkRecord.countDocuments(query)
  ]);

  return {
    records,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

/**
 * Get customer's own work records
 */
const getMyWorkRecords = async (customerId, { page = 1, limit = 10 }) => {
  const query = { customer: customerId };
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [records, total] = await Promise.all([
    WorkRecord.find(query)
      .sort({ workDate: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('service', 'name category')
      .populate('tractorOwner', 'name businessName mobile')
      .populate('tractor', 'name registrationNumber')
      .lean(),
    WorkRecord.countDocuments(query)
  ]);

  return {
    records,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

/**
 * Get work record by ID
 */
const getWorkRecordById = async (recordId, user) => {
  const record = await WorkRecord.findById(recordId)
    .populate('customer', 'name mobile email village district address')
    .populate('service', 'name category')
    .populate('tractorOwner', 'name businessName mobile village district')
    .populate('tractor', 'name model registrationNumber horsepower')
    .populate('completedBy', 'name')
    .lean();

  if (!record) {
    const error = new Error('Work record not found');
    error.statusCode = 404;
    throw error;
  }

  // Enforce customer or owner authorization check
  const isCustomer = user && user.role === 'customer' && String(record.customer._id) === String(user._id);
  const isOwner = user && user.role === 'owner' && record.tractorOwner && String(record.tractorOwner._id || record.tractorOwner) === String(user._id);
  const isAdmin = user && user.role === 'admin';

  if (!isAdmin && !isCustomer && !isOwner) {
    const error = new Error('Access denied to this work record');
    error.statusCode = 403;
    throw error;
  }

  return record;
};

/**
 * Get work record by booking ID
 */
const getWorkRecordByBookingId = async (bookingId, user) => {
  const record = await WorkRecord.findOne({ booking: bookingId })
    .populate('customer', 'name mobile village')
    .populate('service', 'name category')
    .populate('tractorOwner', 'name businessName mobile')
    .populate('tractor', 'name model registrationNumber')
    .lean();

  if (!record) return null;

  const isCustomer = user && user.role === 'customer' && String(record.customer._id) === String(user._id);
  const isOwner = user && user.role === 'owner' && record.tractorOwner && String(record.tractorOwner._id || record.tractorOwner) === String(user._id);
  const isAdmin = user && user.role === 'admin';

  if (!isAdmin && !isCustomer && !isOwner) {
    const error = new Error('Access denied to this work record');
    error.statusCode = 403;
    throw error;
  }

  return record;
};

module.exports = {
  completeBookingAndCreateWorkRecord,
  getAllWorkRecordsAdmin,
  getMyWorkRecords,
  getWorkRecordById,
  getWorkRecordByBookingId
};
