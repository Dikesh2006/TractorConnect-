const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const serviceService = require('../services/serviceService');

/**
 * @route   GET /api/v1/services
 * @desc    Public list of active farming services
 * @access  Public
 */
const getActiveServices = asyncHandler(async (req, res) => {
  const { category, ownerId } = req.query;
  const services = await serviceService.getActiveServices(category, ownerId);
  return sendSuccess(res, { services }, 'Active farming services retrieved');
});

/**
 * @route   GET /api/v1/services/:slugOrId
 * @desc    Get service details by slug or ID
 * @access  Public
 */
const getServiceBySlugOrId = asyncHandler(async (req, res) => {
  const { slugOrId } = req.params;
  const isPrivileged = req.user?.role === 'admin' || req.user?.role === 'owner';
  const service = await serviceService.getServiceBySlugOrId(slugOrId, isPrivileged);
  return sendSuccess(res, { service }, 'Service details retrieved');
});

/**
 * @route   GET /api/v1/services/admin/all
 * @desc    Admin / Owner list of all services with pagination and filters
 * @access  Private (Admin or Owner)
 */
const getAllServicesAdmin = asyncHandler(async (req, res) => {
  const result = await serviceService.getAllServicesAdmin(req.query, req.user);
  return sendSuccess(res, result, 'All services retrieved for management');
});

/**
 * @route   POST /api/v1/services
 * @desc    Create a new farming service
 * @access  Private (Admin only)
 */
const createService = asyncHandler(async (req, res) => {
  const service = await serviceService.createService(req.body, req.user);
  return sendSuccess(res, { service }, 'Farming service created successfully', 201);
});

/**
 * @route   PUT /api/v1/services/:id
 * @desc    Update a farming service (creates price history if price changes)
 * @access  Private (Admin only)
 */
const updateService = asyncHandler(async (req, res) => {
  const service = await serviceService.updateService(req.params.id, req.body, req.user);
  return sendSuccess(res, { service }, 'Farming service updated successfully');
});

/**
 * @route   PATCH /api/v1/services/:id/status
 * @desc    Toggle service active status (soft delete / activate)
 * @access  Private (Admin only)
 */
const toggleServiceStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ success: false, message: 'isActive boolean is required' });
  }
  const service = await serviceService.toggleServiceStatus(req.params.id, isActive, req.user);
  return sendSuccess(
    res,
    { service },
    `Service ${isActive ? 'activated' : 'deactivated'} successfully`
  );
});

/**
 * @route   GET /api/v1/services/:id/price-history
 * @desc    Get historical price log for a service
 * @access  Private (Admin or Owner)
 */
const getPriceHistory = asyncHandler(async (req, res) => {
  const history = await serviceService.getPriceHistory(req.params.id, req.user);
  return sendSuccess(res, { history }, 'Price history log retrieved');
});

/**
 * @route   DELETE /api/v1/services/:id
 * @desc    Delete service (blocked if referenced by bookings)
 * @access  Private (Admin or Owner)
 */
const deleteService = asyncHandler(async (req, res) => {
  const deleted = await serviceService.deleteService(req.params.id, req.user);
  return sendSuccess(res, { service: deleted }, 'Service deleted successfully');
});

module.exports = {
  getActiveServices,
  getServiceBySlugOrId,
  getAllServicesAdmin,
  createService,
  updateService,
  toggleServiceStatus,
  getPriceHistory,
  deleteService
};

