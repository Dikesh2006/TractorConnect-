const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const workRecordService = require('../services/workRecordService');

/**
 * @route   POST /api/v1/work-records/complete/:bookingId
 * @desc    Admin completes work and creates WorkRecord
 * @access  Private (Admin only)
 */
const completeWork = asyncHandler(async (req, res) => {
  const record = await workRecordService.completeBookingAndCreateWorkRecord(
    req.params.bookingId,
    req.body,
    req.user
  );
  return sendSuccess(res, { workRecord: record }, 'Work completed and record generated successfully', 201);
});

/**
 * @route   GET /api/v1/work-records/admin/all
 * @desc    Admin / Owner lists all work records with filters
 * @access  Private (Admin or Owner)
 */
const getAllWorkRecordsAdmin = asyncHandler(async (req, res) => {
  const result = await workRecordService.getAllWorkRecordsAdmin(req.query, req.user);
  return sendSuccess(res, result, 'Work records retrieved');
});

/**
 * @route   GET /api/v1/work-records/my
 * @desc    Customer views their completed work records
 * @access  Private
 */
const getMyWorkRecords = asyncHandler(async (req, res) => {
  const result = await workRecordService.getMyWorkRecords(req.user._id, req.query);
  return sendSuccess(res, result, 'My completed work records retrieved');
});

/**
 * @route   GET /api/v1/work-records/booking/:bookingId
 * @desc    Get work record for a specific booking
 * @access  Private
 */
const getWorkRecordByBooking = asyncHandler(async (req, res) => {
  const record = await workRecordService.getWorkRecordByBookingId(req.params.bookingId, req.user);
  return sendSuccess(res, { workRecord: record }, 'Work record retrieved');
});

/**
 * @route   GET /api/v1/work-records/:id
 * @desc    Get work record details
 * @access  Private
 */
const getWorkRecordById = asyncHandler(async (req, res) => {
  const record = await workRecordService.getWorkRecordById(req.params.id, req.user);
  return sendSuccess(res, { workRecord: record }, 'Work record details retrieved');
});

module.exports = {
  completeWork,
  getAllWorkRecordsAdmin,
  getMyWorkRecords,
  getWorkRecordByBooking,
  getWorkRecordById
};

