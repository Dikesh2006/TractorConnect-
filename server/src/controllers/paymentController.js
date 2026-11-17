const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const paymentService = require('../services/paymentService');

/**
 * @route   POST /api/v1/payments
 * @desc    Record cash or UPI payment against work record
 * @access  Private (Admin only)
 */
const recordPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.recordPayment(req.body, req.user);
  return sendSuccess(res, result, 'Payment recorded successfully', 201);
});

/**
 * @route   PATCH /api/v1/payments/:id/void
 * @desc    Void an erroneous payment with reason
 * @access  Private (Admin only)
 */
const voidPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.voidPayment(req.params.id, req.body.voidReason, req.user);
  return sendSuccess(res, result, 'Payment voided and balance adjusted');
});

/**
 * @route   GET /api/v1/payments/work-record/:workRecordId
 * @desc    Get all payments for a work record
 * @access  Private
 */
const getPaymentsForWorkRecord = asyncHandler(async (req, res) => {
  const payments = await paymentService.getPaymentsForWorkRecord(req.params.workRecordId);
  return sendSuccess(res, { payments }, 'Payments retrieved');
});

/**
 * @route   GET /api/v1/payments/admin/all
 * @desc    Admin / Owner lists all payments (scoped to owner if role === 'owner')
 * @access  Private (Admin or Owner)
 */
const getAllPaymentsAdmin = asyncHandler(async (req, res) => {
  const result = await paymentService.getAllPaymentsAdmin(req.query, req.user);
  return sendSuccess(res, result, 'All payments retrieved');
});

/**
 * @route   GET /api/v1/payments/dues/my
 * @desc    Customer checks their dues summary
 * @access  Private
 */
const getMyDues = asyncHandler(async (req, res) => {
  const dues = await paymentService.getCustomerDuesSummary(req.user._id);
  return sendSuccess(res, { dues }, 'My dues summary retrieved');
});

/**
 * @route   GET /api/v1/payments/dues/customer/:customerId
 * @desc    Admin / Owner checks customer dues summary
 * @access  Private (Admin or Owner)
 */
const getCustomerDues = asyncHandler(async (req, res) => {
  const dues = await paymentService.getCustomerDuesSummary(req.params.customerId, req.user);
  return sendSuccess(res, { dues }, 'Customer dues summary retrieved');
});

module.exports = {
  recordPayment,
  voidPayment,
  getPaymentsForWorkRecord,
  getAllPaymentsAdmin,
  getMyDues,
  getCustomerDues
};

