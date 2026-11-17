const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const tractorService = require('../services/tractorService');

/**
 * @route   GET /api/v1/tractors
 * @desc    Get all tractors (optional ?status=available)
 * @access  Private
 */
const getAllTractors = asyncHandler(async (req, res) => {
  const tractors = await tractorService.getAllTractors(req.query.status, req.user);
  return sendSuccess(res, { tractors }, 'Tractors retrieved');
});

/**
 * @route   GET /api/v1/tractors/availability
 * @desc    Check tractor availability for a date-time range
 * @access  Private (Admin or Owner)
 */
const checkAvailability = asyncHandler(async (req, res) => {
  const { tractorId, start, end, excludeBookingId } = req.query;
  if (!tractorId || !start || !end) {
    return res.status(400).json({
      success: false,
      message: 'tractorId, start, and end query parameters are required'
    });
  }

  const result = await tractorService.checkTractorAvailability(
    tractorId,
    start,
    end,
    excludeBookingId,
    req.user
  );
  return sendSuccess(res, result, result.available ? 'Tractor is available' : result.reason);
});

/**
 * @route   GET /api/v1/tractors/schedule
 * @desc    Get tractor schedule for calendar
 * @access  Private (Admin or Owner)
 */
const getSchedule = asyncHandler(async (req, res) => {
  const { start, end } = req.query;
  const schedule = await tractorService.getTractorSchedule(start, end, req.user);
  return sendSuccess(res, { schedule }, 'Tractor schedule retrieved');
});

/**
 * @route   GET /api/v1/tractors/:id
 * @desc    Get single tractor by ID
 * @access  Private
 */
const getTractorById = asyncHandler(async (req, res) => {
  const tractor = await tractorService.getTractorById(req.params.id, req.user);
  return sendSuccess(res, { tractor }, 'Tractor details retrieved');
});

/**
 * @route   POST /api/v1/tractors
 * @desc    Add a new tractor
 * @access  Private (Admin or Owner)
 */
const createTractor = asyncHandler(async (req, res) => {
  const tractor = await tractorService.createTractor(req.body, req.user);
  return sendSuccess(res, { tractor }, 'Tractor added successfully', 201);
});

/**
 * @route   PUT /api/v1/tractors/:id
 * @desc    Update a tractor
 * @access  Private (Admin or Owner)
 */
const updateTractor = asyncHandler(async (req, res) => {
  const tractor = await tractorService.updateTractor(req.params.id, req.body, req.user);
  return sendSuccess(res, { tractor }, 'Tractor updated successfully');
});

module.exports = {
  getAllTractors,
  getTractorById,
  checkAvailability,
  getSchedule,
  createTractor,
  updateTractor
};

