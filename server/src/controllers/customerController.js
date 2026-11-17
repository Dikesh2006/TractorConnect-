const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const User = require('../models/User');
const Booking = require('../models/Booking');
const WorkRecord = require('../models/WorkRecord');
const paymentService = require('../services/paymentService');

/**
 * @route   GET /api/v1/customers
 * @desc    Admin lists customers; Tractor Owner lists their own customers
 * @access  Private (Admin or Owner)
 */
const getAllCustomers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = '', village = '' } = req.query;

  const query = { role: 'customer' };
  if (village) query.village = { $regex: village, $options: 'i' };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { mobile: { $regex: search, $options: 'i' } }
    ];
  }

  // If tractor owner, only show customers who have booked with their business
  if (req.user && req.user.role === 'owner') {
    const customerIds = await Booking.distinct('customer', { tractorOwner: req.user._id });
    query._id = { $in: customerIds };
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [customers, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    User.countDocuments(query)
  ]);

  return sendSuccess(
    res,
    {
      customers,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    },
    'Customers retrieved'
  );
});

/**
 * @route   GET /api/v1/customers/:id
 * @desc    Admin / Owner views customer details, booking history, and dues
 * @access  Private (Admin or Owner)
 */
const getCustomerDetails = asyncHandler(async (req, res) => {
  const customer = await User.findById(req.params.id).lean();
  if (!customer) {
    const error = new Error('Customer not found');
    error.statusCode = 404;
    throw error;
  }

  const bookingQuery = { customer: customer._id };
  if (req.user && req.user.role === 'owner') {
    bookingQuery.tractorOwner = req.user._id;
  }

  const [bookings, dues] = await Promise.all([
    Booking.find(bookingQuery)
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('service', 'name pricingUnit currentPrice')
      .lean(),
    paymentService.getCustomerDuesSummary(customer._id, req.user)
  ]);

  return sendSuccess(res, { customer, bookings, dues }, 'Customer profile and history retrieved');
});

/**
 * @route   PATCH /api/v1/customers/:id/status
 * @desc    Admin activates or deactivates customer account
 * @access  Private (Admin only)
 */
const toggleCustomerStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ success: false, message: 'isActive boolean is required' });
  }

  const customer = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
  if (!customer) {
    const error = new Error('Customer not found');
    error.statusCode = 404;
    throw error;
  }

  return sendSuccess(
    res,
    { customer },
    `Customer account ${isActive ? 'activated' : 'deactivated'} successfully`
  );
});

module.exports = {
  getAllCustomers,
  getCustomerDetails,
  toggleCustomerStatus
};

