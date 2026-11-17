const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const discoveryService = require('../services/discoveryService');

/**
 * @route   GET /api/v1/discovery/nearby-owners
 * @desc    Find approved tractor owners serving a field location with distance & services
 * @access  Public
 */
const getNearbyOwners = asyncHandler(async (req, res) => {
  const latitude = req.query.latitude || req.query.lat || null;
  const longitude = req.query.longitude || req.query.lng || null;
  const result = await discoveryService.findNearbyTractorOwners({
    ...req.query,
    latitude,
    longitude
  });
  return sendSuccess(res, result, 'Nearby tractor owners retrieved successfully');
});

/**
 * @route   GET /api/v1/discovery/owners/:id
 * @desc    Get detailed public profile of a tractor owner
 * @access  Public
 */
const getOwnerProfile = asyncHandler(async (req, res) => {
  const result = await discoveryService.getTractorOwnerProfile(req.params.id);
  return sendSuccess(res, result, 'Tractor owner profile retrieved successfully');
});

module.exports = {
  getNearbyOwners,
  getOwnerProfile
};
