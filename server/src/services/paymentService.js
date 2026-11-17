const Payment = require('../models/Payment');
const WorkRecord = require('../models/WorkRecord');
const { round2Decimals } = require('../utils/formatters');

/**
 * Record manual cash or UPI payment against a WorkRecord
 */
const recordPayment = async (data, adminUser) => {
  const workRecord = await WorkRecord.findById(data.workRecordId);
  if (!workRecord) {
    const error = new Error('Work record not found');
    error.statusCode = 404;
    throw error;
  }

  // Cross-owner data isolation check
  if (
    adminUser.role === 'owner' &&
    workRecord.tractorOwner &&
    !workRecord.tractorOwner.equals(adminUser._id)
  ) {
    const error = new Error('Access denied. You can only record payments for your own work records.');
    error.statusCode = 403;
    throw error;
  }

  const paymentAmount = round2Decimals(data.amount);

  // Overpayment check
  if (paymentAmount > workRecord.balanceDue) {
    const error = new Error(
      `Payment of ₹${paymentAmount} exceeds the remaining balance due of ₹${workRecord.balanceDue}. Overpayment is not allowed.`
    );
    error.statusCode = 400;
    throw error;
  }

  const payment = new Payment({
    workRecord: workRecord._id,
    booking: workRecord.booking,
    customer: workRecord.customer,
    tractorOwner: workRecord.tractorOwner || adminUser._id,
    amount: paymentAmount,
    method: data.method || 'cash',
    status: 'paid',
    upiTransactionId: data.upiTransactionId?.trim() || '',
    paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
    notes: data.notes?.trim() || '',
    recordedBy: adminUser._id
  });

  await payment.save();

  // Update WorkRecord balances
  workRecord.amountPaid = round2Decimals(workRecord.amountPaid + paymentAmount);
  workRecord.balanceDue = round2Decimals(Math.max(0, workRecord.totalAmount - workRecord.amountPaid));

  if (workRecord.balanceDue <= 0) {
    workRecord.paymentStatus = 'paid';
  } else if (workRecord.amountPaid > 0) {
    workRecord.paymentStatus = 'partially_paid';
  }

  await workRecord.save();

  return {
    payment,
    workRecord: {
      _id: workRecord._id,
      totalAmount: workRecord.totalAmount,
      amountPaid: workRecord.amountPaid,
      balanceDue: workRecord.balanceDue,
      paymentStatus: workRecord.paymentStatus
    }
  };
};

/**
 * Void a payment with audit reason and recalculate work record balances
 */
const voidPayment = async (paymentId, voidReason, adminUser) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    const error = new Error('Payment not found');
    error.statusCode = 404;
    throw error;
  }

  // Cross-owner data isolation check
  if (
    adminUser.role === 'owner' &&
    payment.tractorOwner &&
    !payment.tractorOwner.equals(adminUser._id)
  ) {
    const error = new Error('Access denied. You can only void payments for your own business.');
    error.statusCode = 403;
    throw error;
  }

  if (payment.status === 'void') {
    const error = new Error('This payment is already voided');
    error.statusCode = 400;
    throw error;
  }

  payment.status = 'void';
  payment.voidReason = voidReason;
  payment.voidedBy = adminUser._id;
  payment.voidedAt = new Date();
  await payment.save();

  // Recalculate WorkRecord from all remaining active ('paid') payments
  const activePayments = await Payment.find({
    workRecord: payment.workRecord,
    status: 'paid'
  });

  const totalPaid = round2Decimals(activePayments.reduce((sum, p) => sum + p.amount, 0));
  const workRecord = await WorkRecord.findById(payment.workRecord);

  if (workRecord) {
    workRecord.amountPaid = totalPaid;
    workRecord.balanceDue = round2Decimals(Math.max(0, workRecord.totalAmount - totalPaid));

    if (workRecord.amountPaid >= workRecord.totalAmount) {
      workRecord.paymentStatus = 'paid';
    } else if (workRecord.amountPaid > 0) {
      workRecord.paymentStatus = 'partially_paid';
    } else {
      workRecord.paymentStatus = 'unpaid';
    }

    await workRecord.save();
  }

  return {
    payment,
    workRecord: workRecord
      ? {
          _id: workRecord._id,
          totalAmount: workRecord.totalAmount,
          amountPaid: workRecord.amountPaid,
          balanceDue: workRecord.balanceDue,
          paymentStatus: workRecord.paymentStatus
        }
      : null
  };
};

/**
 * Get all payments for a specific work record
 */
const getPaymentsForWorkRecord = async (workRecordId) => {
  return Payment.find({ workRecord: workRecordId })
    .sort({ paidAt: -1 })
    .populate('recordedBy', 'name role')
    .populate('voidedBy', 'name role')
    .lean();
};

/**
 * Get all payments for Admin or Tractor Owner listing
 */
const getAllPaymentsAdmin = async (
  { page = 1, limit = 20, method = '', status = '', customer = '', ownerId = '' },
  currentUser = null
) => {
  const query = {};

  if (currentUser && currentUser.role === 'owner') {
    query.tractorOwner = currentUser._id;
  } else if (ownerId && mongoose.Types.ObjectId.isValid(ownerId)) {
    query.tractorOwner = ownerId;
  }

  if (method) query.method = method;
  if (status) query.status = status;
  if (customer) query.customer = customer;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .sort({ paidAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('customer', 'name mobile village')
      .populate('tractorOwner', 'name businessName mobile')
      .populate('recordedBy', 'name')
      .lean(),
    Payment.countDocuments(query)
  ]);

  return {
    payments,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

/**
 * Get customer dues summary
 */
const getCustomerDuesSummary = async (customerId, currentUser = null) => {
  const query = { customer: customerId };
  if (currentUser && currentUser.role === 'owner') {
    query.tractorOwner = currentUser._id;
  }

  const records = await WorkRecord.find(query).lean();

  const totalBilled = round2Decimals(records.reduce((sum, r) => sum + r.totalAmount, 0));
  const totalPaid = round2Decimals(records.reduce((sum, r) => sum + r.amountPaid, 0));
  const totalDue = round2Decimals(records.reduce((sum, r) => sum + r.balanceDue, 0));

  return {
    totalRecords: records.length,
    totalBilled,
    totalPaid,
    totalDue
  };
};

module.exports = {
  recordPayment,
  voidPayment,
  getPaymentsForWorkRecord,
  getAllPaymentsAdmin,
  getCustomerDuesSummary
};

