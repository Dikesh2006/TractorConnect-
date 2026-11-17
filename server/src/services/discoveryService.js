const User = require('../models/User');
const Service = require('../models/Service');
const Tractor = require('../models/Tractor');
const { calculateHaversineDistanceKm } = require('../utils/geo');
const { round2Decimals } = require('../utils/formatters');

/**
 * Discover nearby approved tractor owners based on farmer's field location
 */
const findNearbyTractorOwners = async ({
  latitude = null,
  longitude = null,
  village = '',
  district = '',
  category = '',
  serviceName = '',
  sortBy = 'distance',
  maxDistanceKm = null
}) => {
  // Query only approved, active tractor owners
  const owners = await User.find({
    role: 'owner',
    isApproved: true,
    approvalStatus: 'approved',
    isActive: true
  })
    .select(
      '_id name mobile businessName village district state address serviceRadiusKm location serviceDescription createdAt'
    )
    .lean();

  if (owners.length === 0) {
    return {
      owners: [],
      farmerCoordinates: { latitude, longitude },
      totalFound: 0
    };
  }

  const ownerIds = owners.map((o) => o._id);

  // Fetch active services and tractors for all these owners concurrently
  const [allServices, allTractors] = await Promise.all([
    Service.find({
      owner: { $in: ownerIds },
      isActive: true
    })
      .sort({ displayOrder: 1, currentPrice: 1 })
      .lean(),
    Tractor.find({
      owner: { $in: ownerIds },
      isActive: true
    }).lean()
  ]);

  // Group services and tractors by ownerId
  const servicesByOwner = {};
  const tractorsByOwner = {};

  for (const s of allServices) {
    const oId = s.owner.toString();
    if (!servicesByOwner[oId]) servicesByOwner[oId] = [];
    servicesByOwner[oId].push(s);
  }

  for (const t of allTractors) {
    const oId = t.owner ? t.owner.toString() : '';
    if (!oId) continue;
    if (!tractorsByOwner[oId]) tractorsByOwner[oId] = [];
    tractorsByOwner[oId].push(t);
  }

  const farmerLat = latitude !== null && latitude !== undefined && latitude !== '' ? parseFloat(latitude) : null;
  const farmerLng = longitude !== null && longitude !== undefined && longitude !== '' ? parseFloat(longitude) : null;

  const results = [];

  for (const owner of owners) {
    const oId = owner._id.toString();
    let services = servicesByOwner[oId] || [];
    const tractors = tractorsByOwner[oId] || [];

    // Filter by category or service name if provided
    if (category) {
      services = services.filter((s) => s.category.toLowerCase() === category.toLowerCase());
    }
    if (serviceName) {
      services = services.filter((s) =>
        s.name.toLowerCase().includes(serviceName.toLowerCase())
      );
    }

    // If filtering by specific service or category and owner has no matching services, skip
    if ((category || serviceName) && services.length === 0) {
      continue;
    }

    // Calculate distance between farmer field and owner depot
    let distanceKm = null;
    let isWithinRadius = true;

    const ownerLat = owner.location?.latitude ?? null;
    const ownerLng = owner.location?.longitude ?? null;

    if (farmerLat !== null && farmerLng !== null && ownerLat !== null && ownerLng !== null) {
      distanceKm = calculateHaversineDistanceKm(farmerLat, farmerLng, ownerLat, ownerLng);
      const radius = owner.serviceRadiusKm || 25;
      isWithinRadius = distanceKm <= radius;

      // If maxDistanceKm is specified and distance exceeds it, skip
      if (maxDistanceKm && distanceKm > parseFloat(maxDistanceKm)) {
        continue;
      }
    } else {
      // If coordinates are missing, check if district or village match as geographical approximation
      const sameDistrict =
        district && owner.district && district.toLowerCase() === owner.district.toLowerCase();
      const sameVillage =
        village && owner.village && village.toLowerCase() === owner.village.toLowerCase();

      if (sameVillage) {
        distanceKm = 2.0; // Approximation: same village ~2km
      } else if (sameDistrict) {
        distanceKm = 15.0; // Approximation: same district ~15km
      } else {
        distanceKm = null;
      }
    }

    // Tractors status summary
    const availableTractors = tractors.filter((t) => t.status === 'available');
    const inUseTractors = tractors.filter((t) => t.status === 'in_use');

    // Calculate minimum price among owner's services
    const prices = services.map((s) => s.currentPrice);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

    results.push({
      _id: owner._id,
      name: owner.name,
      mobile: owner.mobile,
      businessName: owner.businessName || `${owner.name}'s Tractor Seva`,
      village: owner.village || owner.location?.village || '',
      district: owner.district || owner.location?.district || '',
      state: owner.state || 'Madhya Pradesh',
      serviceRadiusKm: owner.serviceRadiusKm || 25,
      location: owner.location || null,
      serviceDescription: owner.serviceDescription || '',
      distanceKm,
      isWithinRadius,
      servicesCount: services.length,
      services,
      minPrice,
      tractorsCount: tractors.length,
      availableTractorsCount: availableTractors.length,
      hasAvailableTractors: availableTractors.length > 0,
      tractors: tractors.map((t) => ({
        _id: t._id,
        name: t.name,
        model: t.model,
        horsepower: t.horsepower,
        status: t.status
      }))
    });
  }

  // Sorting
  if (sortBy === 'distance') {
    results.sort((a, b) => {
      if (a.distanceKm === null && b.distanceKm === null) return 0;
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  } else if (sortBy === 'price') {
    results.sort((a, b) => a.minPrice - b.minPrice);
  } else if (sortBy === 'availability') {
    results.sort((a, b) => {
      if (a.hasAvailableTractors === b.hasAvailableTractors) {
        return (a.distanceKm || 999) - (b.distanceKm || 999);
      }
      return a.hasAvailableTractors ? -1 : 1;
    });
  }

  return {
    owners: results,
    farmerCoordinates: { latitude: farmerLat, longitude: farmerLng },
    totalFound: results.length
  };
};

/**
 * Get full public profile of a single approved tractor owner and their service catalog
 */
const getTractorOwnerProfile = async (ownerId) => {
  const owner = await User.findOne({
    _id: ownerId,
    role: 'owner',
    isApproved: true,
    approvalStatus: 'approved',
    isActive: true
  })
    .select(
      '_id name mobile businessName village district state address serviceRadiusKm location serviceDescription createdAt'
    )
    .lean();

  if (!owner) {
    const error = new Error('Tractor owner not found or not approved');
    error.statusCode = 404;
    throw error;
  }

  const [services, tractors] = await Promise.all([
    Service.find({ owner: owner._id, isActive: true }).sort({ displayOrder: 1, currentPrice: 1 }).lean(),
    Tractor.find({ owner: owner._id, isActive: true }).lean()
  ]);

  return {
    ...owner,
    services,
    tractors: tractors.map((t) => ({
      _id: t._id,
      name: t.name,
      model: t.model,
      horsepower: t.horsepower,
      status: t.status
    }))
  };
};

module.exports = {
  findNearbyTractorOwners,
  getTractorOwnerProfile
};

