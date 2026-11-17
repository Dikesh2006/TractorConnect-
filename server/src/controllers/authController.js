const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const authService = require('../services/authService');

/**
 * @route   POST /api/v1/auth/register
 * @desc    Self-register a new customer (Farmer)
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const result = await authService.registerCustomer(req.body);
  return sendSuccess(res, result, 'Registration successful. Welcome to TractorConnect!', 201);
});

/**
 * @route   POST /api/v1/auth/owner/register
 * @desc    Self-register a new Tractor Owner
 * @access  Public
 */
const registerOwner = asyncHandler(async (req, res) => {
  const result = await authService.registerOwner(req.body);
  return sendSuccess(
    res,
    result,
    'Tractor Owner registration submitted successfully. Your account is pending administrator verification.',
    201
  );
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user with mobile & password
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { mobile, password } = req.body;
  const result = await authService.loginUser(mobile, password);
  return sendSuccess(res, result, 'Login successful');
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get currently authenticated user's profile
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  return sendSuccess(res, { user: req.user }, 'Current user profile retrieved');
});

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update current user's profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const updatedUser = await authService.updateProfile(req.user._id, req.body);
  return sendSuccess(res, { user: updatedUser }, 'Profile updated successfully');
});

/**
 * @route   PUT /api/v1/auth/change-password
 * @desc    Change current user's password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user._id, currentPassword, newPassword);
  return sendSuccess(res, null, 'Password changed successfully');
});

/**
 * @route   POST /api/v1/auth/create-admin
 * @desc    Create a new admin account
 * @access  Private (Admin only)
 */
const createAdmin = asyncHandler(async (req, res) => {
  const newAdmin = await authService.createAdminUser(req.body);
  return sendSuccess(res, { admin: newAdmin }, 'New admin account created successfully', 201);
});

/**
 * @route   GET /api/v1/auth/owners
 * @desc    Get all registered tractor owners
 * @access  Private (Admin only)
 */
const getAllOwners = asyncHandler(async (req, res) => {
  const result = await authService.getAllOwnersAdmin(req.query);
  return sendSuccess(res, result, 'Tractor owners retrieved successfully');
});

/**
 * @route   PATCH /api/v1/auth/owners/:id/approval
 * @desc    Approve, reject, or suspend a tractor owner
 * @access  Private (Admin only)
 */
const updateOwnerApproval = asyncHandler(async (req, res) => {
  const approvalStatus = req.body.approvalStatus || req.body.status;
  const { rejectionReason } = req.body;
  const updatedOwner = await authService.updateOwnerApproval(
    req.params.id,
    approvalStatus,
    rejectionReason,
    req.user
  );
  return sendSuccess(
    res,
    { owner: updatedOwner },
    `Tractor owner status updated to '${approvalStatus}' successfully`
  );
});

module.exports = {
  register,
  registerOwner,
  login,
  getMe,
  updateProfile,
  changePassword,
  createAdmin,
  getAllOwners,
  updateOwnerApproval
};

