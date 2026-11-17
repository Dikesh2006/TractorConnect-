const mongoose = require('mongoose');
const Service = require('../models/Service');
const ServicePriceHistory = require('../models/ServicePriceHistory');
const { round2Decimals } = require('../utils/formatters');

/**
 * Get active services for public and booking selection
 * Optionally filtered by category or specific tractor owner
 */
const getActiveServices = async (categoryFilter = null, ownerId = null) => {
  const query = { isActive: true };
  if (categoryFilter) {
    query.category = categoryFilter;
  }
  if (ownerId && mongoose.Types.ObjectId.isValid(ownerId)) {
    query.owner = ownerId;
  }

  const services = await Service.find(query)
    .sort({ displayOrder: 1, name: 1 })
    .populate('owner', 'name businessName village district serviceRadiusKm')
    .lean();

  return services;
};

/**
 * Get single service by Slug or ObjectId
 */
const getServiceBySlugOrId = async (identifier, includeInactive = false) => {
  const query = {};
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query._id = identifier;
  } else {
    query.slug = identifier.toLowerCase();
  }

  if (!includeInactive) {
    query.isActive = true;
  }

  const service = await Service.findOne(query)
    .populate('owner', 'name businessName village district mobile')
    .lean();

  if (!service) {
    const error = new Error('Farming service not found');
    error.statusCode = 404;
    throw error;
  }
  return service;
};

/**
 * Get all services for Admin or Tractor Owner (scoped to owner if role === 'owner')
 */
const getAllServicesAdmin = async (
  { page = 1, limit = 20, search = '', category = '', status = '', ownerId = '' },
  currentUser = null
) => {
  const query = {};

  // Scope to current owner if user is an owner
  if (currentUser && currentUser.role === 'owner') {
    query.owner = currentUser._id;
  } else if (ownerId && mongoose.Types.ObjectId.isValid(ownerId)) {
    query.owner = ownerId;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  if (category) {
    query.category = category;
  }

  if (status === 'active') {
    query.isActive = true;
  } else if (status === 'inactive') {
    query.isActive = false;
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [services, total] = await Promise.all([
    Service.find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('owner', 'name businessName village')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .lean(),
    Service.countDocuments(query)
  ]);

  return {
    services,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

/**
 * Create a new Service and its initial Price History entry
 * Automatically associates service with the creating tractor owner
 */
const createService = async (data, currentUser) => {
  const targetOwnerId =
    currentUser.role === 'owner'
      ? currentUser._id
      : data.ownerId || currentUser._id;

  const duplicateQuery = {
    owner: targetOwnerId,
    name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') }
  };

  const existing = await Service.findOne(duplicateQuery);
  if (existing) {
    const error = new Error(`A service named '${data.name}' already exists in this catalog`);
    error.statusCode = 409;
    throw error;
  }

  const roundedPrice = round2Decimals(data.currentPrice);
  const roundedMinCharge = round2Decimals(data.minimumCharge || 0);

  const service = new Service({
    owner: targetOwnerId,
    name: data.name.trim(),
    description: data.description.trim(),
    category: data.category.trim(),
    imageUrl: data.imageUrl || '',
    pricingUnit: data.pricingUnit,
    currentPrice: roundedPrice,
    minimumCharge: roundedMinCharge,
    isActive: data.isActive !== undefined ? data.isActive : true,
    displayOrder: data.displayOrder || 0,
    createdBy: currentUser._id,
    updatedBy: currentUser._id
  });

  await service.save();

  // Create initial price history entry
  const history = new ServicePriceHistory({
    service: service._id,
    price: roundedPrice,
    pricingUnit: data.pricingUnit,
    effectiveFrom: new Date(),
    changedBy: currentUser._id,
    note: data.priceChangeNote || 'Initial service creation'
  });
  await history.save();

  return service;
};

/**
 * Update an existing service and record price history if price or unit changed
 * Enforces ownership access check for tractor owners
 */
const updateService = async (serviceId, data, currentUser) => {
  const service = await Service.findById(serviceId);
  if (!service) {
    const error = new Error('Service not found');
    error.statusCode = 404;
    throw error;
  }

  // Cross-owner access prevention
  if (
    currentUser.role === 'owner' &&
    service.owner &&
    !service.owner.equals(currentUser._id)
  ) {
    const error = new Error('Access denied. You can only modify your own services.');
    error.statusCode = 403;
    throw error;
  }

  // Check unique name within this owner's catalog
  if (data.name && data.name.trim().toLowerCase() !== service.name.toLowerCase()) {
    const conflict = await Service.findOne({
      _id: { $ne: service._id },
      owner: service.owner,
      name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') }
    });
    if (conflict) {
      const error = new Error(`Another service named '${data.name}' already exists in your catalog`);
      error.statusCode = 409;
      throw error;
    }
    service.name = data.name.trim();
  }

  if (data.description !== undefined) service.description = data.description.trim();
  if (data.category !== undefined) service.category = data.category.trim();
  if (data.imageUrl !== undefined) service.imageUrl = data.imageUrl;
  if (data.displayOrder !== undefined) service.displayOrder = data.displayOrder;
  if (data.isActive !== undefined) service.isActive = data.isActive;
  if (data.minimumCharge !== undefined) service.minimumCharge = round2Decimals(data.minimumCharge);

  // Check if price or pricing unit changed
  const newPrice = data.currentPrice !== undefined ? round2Decimals(data.currentPrice) : null;
  const newUnit = data.pricingUnit;

  const isPriceChanged = newPrice !== null && newPrice !== service.currentPrice;
  const isUnitChanged = newUnit && newUnit !== service.pricingUnit;

  if (isPriceChanged || isUnitChanged) {
    const finalPrice = isPriceChanged ? newPrice : service.currentPrice;
    const finalUnit = isUnitChanged ? newUnit : service.pricingUnit;

    const note =
      data.priceChangeNote ||
      `Updated from ₹${service.currentPrice}/${service.pricingUnit} to ₹${finalPrice}/${finalUnit}`;

    // Record history
    const history = new ServicePriceHistory({
      service: service._id,
      price: finalPrice,
      pricingUnit: finalUnit,
      effectiveFrom: new Date(),
      changedBy: currentUser._id,
      note
    });
    await history.save();

    service.currentPrice = finalPrice;
    service.pricingUnit = finalUnit;
  }

  service.updatedBy = currentUser._id;
  await service.save();

  return service;
};

/**
 * Toggle Service active status (soft-delete / hide from new bookings)
 */
const toggleServiceStatus = async (serviceId, isActive, currentUser) => {
  const service = await Service.findById(serviceId);
  if (!service) {
    const error = new Error('Service not found');
    error.statusCode = 404;
    throw error;
  }

  if (
    currentUser.role === 'owner' &&
    service.owner &&
    !service.owner.equals(currentUser._id)
  ) {
    const error = new Error('Access denied. You can only toggle your own services.');
    error.statusCode = 403;
    throw error;
  }

  service.isActive = isActive;
  service.updatedBy = currentUser._id;
  await service.save();
  return service;
};

/**
 * Get Service Price History timeline
 */
const getPriceHistory = async (serviceId, currentUser = null) => {
  const service = await Service.findById(serviceId);
  if (!service) {
    const error = new Error('Service not found');
    error.statusCode = 404;
    throw error;
  }

  if (
    currentUser &&
    currentUser.role === 'owner' &&
    service.owner &&
    !service.owner.equals(currentUser._id)
  ) {
    const error = new Error('Access denied. You can only view price history for your own services.');
    error.statusCode = 403;
    throw error;
  }

  const history = await ServicePriceHistory.find({ service: serviceId })
    .sort({ effectiveFrom: -1 })
    .populate('changedBy', 'name mobile')
    .lean();

  return history;
};

/**
 * Delete Service (blocked if any bookings reference it)
 */
const deleteService = async (serviceId, currentUser = null) => {
  const service = await Service.findById(serviceId);
  if (!service) {
    const error = new Error('Service not found');
    error.statusCode = 404;
    throw error;
  }

  if (
    currentUser &&
    currentUser.role === 'owner' &&
    service.owner &&
    !service.owner.equals(currentUser._id)
  ) {
    const error = new Error('Access denied. You can only delete your own services.');
    error.statusCode = 403;
    throw error;
  }

  // Check if Booking model exists and has bookings referencing this service
  const Booking = mongoose.models.Booking;
  if (Booking) {
    const count = await Booking.countDocuments({ service: serviceId });
    if (count > 0) {
      const error = new Error(
        `Cannot delete service because it is referenced by ${count} booking(s). Deactivate it instead to preserve financial and operational history.`
      );
      error.statusCode = 400;
      throw error;
    }
  }

  const deleted = await Service.findByIdAndDelete(serviceId);

  // Clean up price history
  await ServicePriceHistory.deleteMany({ service: serviceId });

  return deleted;
};

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

