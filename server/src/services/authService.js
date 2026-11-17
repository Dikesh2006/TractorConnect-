const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');

/**
 * Generate signed JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      mobile: user.mobile,
      name: user.name,
      businessName: user.businessName || '',
      isApproved: user.isApproved,
      approvalStatus: user.approvalStatus
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

/**
 * Register a new customer (Farmer)
 */
const registerCustomer = async (data) => {
  const existingUser = await User.findOne({ mobile: data.mobile });
  if (existingUser) {
    const error = new Error('A user with this mobile number is already registered.');
    error.statusCode = 409;
    throw error;
  }

  const user = new User({
    name: data.name,
    mobile: data.mobile,
    passwordHash: data.password, // Pre-save hook will hash this
    email: data.email || '',
    village: data.village || '',
    district: data.district || '',
    state: data.state || 'Madhya Pradesh',
    address: data.address || '',
    location: {
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      village: data.village || '',
      district: data.district || '',
      state: data.state || 'Madhya Pradesh',
      fullAddress: data.address || ''
    },
    role: 'customer',
    isApproved: true,
    approvalStatus: 'approved',
    isActive: true,
    lastLoginAt: new Date()
  });

  await user.save();
  const token = generateToken(user);

  return {
    user,
    token
  };
};

/**
 * Register a new Tractor Owner
 */
const registerOwner = async (data) => {
  const existingUser = await User.findOne({ mobile: data.mobile });
  if (existingUser) {
    const error = new Error('A user with this mobile number is already registered.');
    error.statusCode = 409;
    throw error;
  }

  const user = new User({
    name: data.name,
    mobile: data.mobile,
    passwordHash: data.password,
    email: data.email || '',
    businessName: data.businessName,
    village: data.village || '',
    district: data.district || '',
    state: data.state || 'Madhya Pradesh',
    address: data.address || '',
    serviceRadiusKm: data.serviceRadiusKm || 25,
    location: {
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      village: data.village || '',
      district: data.district || '',
      state: data.state || 'Madhya Pradesh',
      fullAddress: data.address || ''
    },
    serviceDescription: data.serviceDescription || '',
    role: 'owner',
    isApproved: false,
    approvalStatus: 'pending',
    isActive: true,
    lastLoginAt: new Date()
  });

  await user.save();
  const token = generateToken(user);

  return {
    user,
    token
  };
};

/**
 * Login user with mobile and password
 */
const loginUser = async (mobile, password) => {
  // Generic error to prevent user enumeration
  const invalidCredentialsError = new Error('Invalid mobile number or password');
  invalidCredentialsError.statusCode = 401;

  const user = await User.findOne({ mobile }).select('+passwordHash');
  if (!user) {
    throw invalidCredentialsError;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw invalidCredentialsError;
  }

  if (!user.isActive) {
    const deactivatedError = new Error('Your account is deactivated. Please contact support.');
    deactivatedError.statusCode = 403;
    throw deactivatedError;
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = generateToken(user);

  return {
    user,
    token
  };
};

/**
 * Update user profile
 */
const updateProfile = async (userId, updateData) => {
  const allowedUpdates = [
    'name',
    'email',
    'village',
    'district',
    'state',
    'address',
    'businessName',
    'serviceRadiusKm',
    'serviceDescription'
  ];
  const updatePayload = {};

  for (const field of allowedUpdates) {
    if (updateData[field] !== undefined) {
      updatePayload[field] = updateData[field];
    }
  }

  // Update location coordinates if supplied
  if (updateData.latitude !== undefined || updateData.longitude !== undefined) {
    updatePayload['location.latitude'] = updateData.latitude ?? null;
    updatePayload['location.longitude'] = updateData.longitude ?? null;
  }
  if (updateData.village !== undefined) updatePayload['location.village'] = updateData.village;
  if (updateData.district !== undefined) updatePayload['location.district'] = updateData.district;
  if (updateData.state !== undefined) updatePayload['location.state'] = updateData.state;
  if (updateData.address !== undefined) updatePayload['location.fullAddress'] = updateData.address;

  const user = await User.findByIdAndUpdate(userId, updatePayload, {
    new: true,
    runValidators: true
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return user;
};

/**
 * Change user password
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    const error = new Error('Current password is incorrect');
    error.statusCode = 400;
    throw error;
  }

  user.passwordHash = newPassword; // Pre-save hook will hash this
  await user.save();

  return true;
};

/**
 * Create a new admin user (admin only)
 */
const createAdminUser = async (data) => {
  const existingUser = await User.findOne({ mobile: data.mobile });
  if (existingUser) {
    const error = new Error('A user with this mobile number already exists');
    error.statusCode = 409;
    throw error;
  }

  const admin = new User({
    name: data.name,
    mobile: data.mobile,
    passwordHash: data.password,
    email: data.email || '',
    role: 'admin',
    isApproved: true,
    approvalStatus: 'approved',
    isActive: true
  });

  await admin.save();
  return admin;
};

/**
 * Platform Admin: Get all tractor owners with search & status filters
 */
const getAllOwnersAdmin = async ({ page = 1, limit = 20, status = '', search = '' }) => {
  const query = { role: 'owner' };

  if (status) {
    query.approvalStatus = status;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { businessName: { $regex: search, $options: 'i' } },
      { mobile: { $regex: search, $options: 'i' } },
      { village: { $regex: search, $options: 'i' } },
      { district: { $regex: search, $options: 'i' } }
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [owners, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    User.countDocuments(query)
  ]);

  return {
    owners,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

/**
 * Platform Admin: Approve, reject, or suspend a tractor owner
 */
const updateOwnerApproval = async (ownerId, approvalStatus, rejectionReason, adminUser) => {
  const owner = await User.findOne({ _id: ownerId, role: 'owner' });
  if (!owner) {
    const error = new Error('Tractor owner not found');
    error.statusCode = 404;
    throw error;
  }

  owner.approvalStatus = approvalStatus;
  owner.isApproved = approvalStatus === 'approved';

  if (approvalStatus === 'approved') {
    owner.approvedAt = new Date();
    owner.approvedBy = adminUser._id;
    owner.rejectionReason = '';
  } else if (approvalStatus === 'rejected') {
    owner.rejectionReason = rejectionReason || 'Application rejected by platform administration';
  } else if (approvalStatus === 'suspended') {
    owner.rejectionReason = rejectionReason || 'Account suspended by platform administration';
  }

  await owner.save();
  return owner;
};

/**
 * Get owner details by ID
 */
const getOwnerById = async (ownerId) => {
  const owner = await User.findOne({ _id: ownerId, role: 'owner' }).lean();
  if (!owner) {
    const error = new Error('Tractor owner not found');
    error.statusCode = 404;
    throw error;
  }
  return owner;
};

module.exports = {
  generateToken,
  registerCustomer,
  registerOwner,
  loginUser,
  updateProfile,
  changePassword,
  createAdminUser,
  getAllOwnersAdmin,
  updateOwnerApproval,
  getOwnerById
};

