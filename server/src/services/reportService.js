const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const WorkRecord = require('../models/WorkRecord');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Service = require('../models/Service');
const User = require('../models/User');
const { round2Decimals, formatISTDate, generateCSV } = require('../utils/formatters');

/**
 * Dashboard KPI and Chart Analytics (scoped to owner if role === 'owner')
 */
const getDashboardAnalytics = async ({ startDate = '', endDate = '', ownerId = '' }, currentUser = null) => {
  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);

  const targetOwnerId =
    currentUser && currentUser.role === 'owner'
      ? currentUser._id
      : ownerId && mongoose.Types.ObjectId.isValid(ownerId)
      ? new mongoose.Types.ObjectId(ownerId)
      : null;

  const bookingMatch = Object.keys(dateFilter).length > 0 ? { requestedDate: dateFilter } : {};
  const workRecordMatch = Object.keys(dateFilter).length > 0 ? { workDate: dateFilter } : {};
  const paymentMatch = {
    status: 'paid',
    ...(Object.keys(dateFilter).length > 0 ? { paidAt: dateFilter } : {})
  };
  const expenseMatch = {
    isDeleted: false,
    ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {})
  };

  if (targetOwnerId) {
    bookingMatch.tractorOwner = targetOwnerId;
    workRecordMatch.tractorOwner = targetOwnerId;
    paymentMatch.tractorOwner = targetOwnerId;
    expenseMatch.tractorOwner = targetOwnerId;
  }

  const pendingQuery = { status: 'pending' };
  if (targetOwnerId) pendingQuery.tractorOwner = targetOwnerId;

  const [
    bookingStats,
    pendingCount,
    workStats,
    revenueStats,
    expenseStats,
    bookingsByStatus,
    acresByService,
    bookingsByVillage,
    recentPendingBookings
  ] = await Promise.all([
    // Total bookings count
    Booking.countDocuments(bookingMatch),
    // Pending requests needing action
    Booking.countDocuments(pendingQuery),
    // Work record aggregate (acres, billed, due)
    WorkRecord.aggregate([
      { $match: workRecordMatch },
      {
        $group: {
          _id: null,
          totalAcres: { $sum: '$actualAcres' },
          totalBilled: { $sum: '$totalAmount' },
          totalDue: { $sum: '$balanceDue' }
        }
      }
    ]),
    // Actual cash/UPI collected
    Payment.aggregate([
      { $match: paymentMatch },
      { $group: { _id: null, totalCollected: { $sum: '$amount' } } }
    ]),
    // Expenses
    Expense.aggregate([
      { $match: expenseMatch },
      { $group: { _id: null, totalExpense: { $sum: '$amount' } } }
    ]),
    // Bookings grouped by status
    Booking.aggregate([
      { $match: bookingMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    // Acres completed by service
    WorkRecord.aggregate([
      { $match: workRecordMatch },
      {
        $group: {
          _id: '$serviceSnapshot.name',
          totalAcres: { $sum: '$actualAcres' },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      { $sort: { totalAcres: -1 } }
    ]),
    // Bookings by village (top 8)
    Booking.aggregate([
      { $match: bookingMatch },
      { $group: { _id: '$fieldLocation.village', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]),
    // Recent pending bookings for quick action
    Booking.find(pendingQuery)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer', 'name mobile village')
      .populate('service', 'name pricingUnit currentPrice')
      .lean()
  ]);

  const totalRevenue = round2Decimals(revenueStats[0]?.totalCollected || 0);
  const totalExpenses = round2Decimals(expenseStats[0]?.totalExpense || 0);
  const netProfit = round2Decimals(totalRevenue - totalExpenses);
  const completedAcres = round2Decimals(workStats[0]?.totalAcres || 0);
  const outstandingDues = round2Decimals(workStats[0]?.totalDue || 0);

  return {
    kpis: {
      totalBookings: bookingStats,
      pendingRequests: pendingCount,
      completedAcres,
      totalRevenue,
      totalExpenses,
      netProfit,
      outstandingDues
    },
    charts: {
      bookingsByStatus: bookingsByStatus.map((b) => ({ status: b._id, count: b.count })),
      acresByService: acresByService.map((s) => ({
        service: s._id,
        acres: round2Decimals(s.totalAcres),
        revenue: round2Decimals(s.totalAmount)
      })),
      bookingsByVillage: bookingsByVillage.map((v) => ({ village: v._id || 'Unknown', count: v.count }))
    },
    recentPendingBookings
  };
};

/**
 * Customer-wise Report
 */
const getCustomerReport = async ({ search = '', village = '', ownerId = '' }, currentUser = null) => {
  const matchUser = { role: 'customer' };
  if (village) matchUser.village = { $regex: village, $options: 'i' };
  if (search) matchUser.name = { $regex: search, $options: 'i' };

  const customers = await User.find(matchUser).select('name mobile village district state').lean();
  const customerIds = customers.map((c) => c._id);

  const workRecordMatch = { customer: { $in: customerIds } };
  if (currentUser && currentUser.role === 'owner') {
    workRecordMatch.tractorOwner = currentUser._id;
  } else if (ownerId && mongoose.Types.ObjectId.isValid(ownerId)) {
    workRecordMatch.tractorOwner = new mongoose.Types.ObjectId(ownerId);
  }

  // Group work records by customer
  const records = await WorkRecord.aggregate([
    { $match: workRecordMatch },
    {
      $group: {
        _id: '$customer',
        totalBookings: { $sum: 1 },
        totalAcres: { $sum: '$actualAcres' },
        totalBilled: { $sum: '$totalAmount' },
        totalPaid: { $sum: '$amountPaid' },
        totalDue: { $sum: '$balanceDue' }
      }
    }
  ]);

  const recordMap = new Map(records.map((r) => [String(r._id), r]));

  const rows = customers.map((c) => {
    const stats = recordMap.get(String(c._id)) || {};
    return {
      customerId: c._id,
      name: c.name,
      mobile: c.mobile,
      village: c.village || 'N/A',
      district: c.district || 'N/A',
      totalBookings: stats.totalBookings || 0,
      totalAcres: round2Decimals(stats.totalAcres || 0),
      totalBilled: round2Decimals(stats.totalBilled || 0),
      totalPaid: round2Decimals(stats.totalPaid || 0),
      totalDue: round2Decimals(stats.totalDue || 0)
    };
  });

  return rows;
};

/**
 * Village-wise Report
 */
const getVillageReport = async (currentUser = null) => {
  const match = {};
  if (currentUser && currentUser.role === 'owner') {
    match.tractorOwner = currentUser._id;
  }

  const report = await WorkRecord.aggregate([
    ...(Object.keys(match).length > 0 ? [{ $match: match }] : []),
    {
      $group: {
        _id: '$fieldLocation.village',
        district: { $first: '$fieldLocation.district' },
        totalCompletedJobs: { $sum: 1 },
        totalAcres: { $sum: '$actualAcres' },
        totalBilled: { $sum: '$totalAmount' },
        totalPaid: { $sum: '$amountPaid' },
        totalDue: { $sum: '$balanceDue' }
      }
    },
    { $sort: { totalAcres: -1 } }
  ]);

  return report.map((r) => ({
    village: r._id || 'Unknown',
    district: r.district || 'Sehore',
    totalCompletedJobs: r.totalCompletedJobs,
    totalAcres: round2Decimals(r.totalAcres),
    totalBilled: round2Decimals(r.totalBilled),
    totalPaid: round2Decimals(r.totalPaid),
    totalDue: round2Decimals(r.totalDue)
  }));
};

/**
 * Service-wise Report
 */
const getServiceReport = async (currentUser = null) => {
  const match = {};
  if (currentUser && currentUser.role === 'owner') {
    match.tractorOwner = currentUser._id;
  }

  const report = await WorkRecord.aggregate([
    ...(Object.keys(match).length > 0 ? [{ $match: match }] : []),
    {
      $group: {
        _id: '$serviceSnapshot.name',
        pricingUnit: { $first: '$serviceSnapshot.pricingUnit' },
        totalJobs: { $sum: 1 },
        totalQuantity: { $sum: '$actualQuantity' },
        totalAcres: { $sum: '$actualAcres' },
        totalRevenue: { $sum: '$totalAmount' }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);

  return report.map((r) => ({
    serviceName: r._id,
    pricingUnit: r.pricingUnit,
    totalJobs: r.totalJobs,
    totalQuantity: round2Decimals(r.totalQuantity),
    totalAcres: round2Decimals(r.totalAcres),
    totalRevenue: round2Decimals(r.totalRevenue)
  }));
};

/**
 * Date-wise Detailed Work Report
 */
const getDateWiseReport = async ({ startDate = '', endDate = '', village = '', ownerId = '' }, currentUser = null) => {
  const query = {};
  if (currentUser && currentUser.role === 'owner') {
    query.tractorOwner = currentUser._id;
  } else if (ownerId && mongoose.Types.ObjectId.isValid(ownerId)) {
    query.tractorOwner = ownerId;
  }

  if (village) query['fieldLocation.village'] = { $regex: village, $options: 'i' };
  if (startDate || endDate) {
    query.workDate = {};
    if (startDate) query.workDate.$gte = new Date(startDate);
    if (endDate) query.workDate.$lte = new Date(endDate);
  }

  const records = await WorkRecord.find(query)
    .sort({ workDate: -1 })
    .populate('customer', 'name mobile village')
    .populate('tractor', 'name registrationNumber')
    .lean();

  return records.map((r) => ({
    recordId: r._id,
    workDate: formatISTDate(r.workDate, false),
    customerName: r.customer?.name || 'Unknown',
    customerMobile: r.customer?.mobile || '',
    village: r.fieldLocation.village,
    service: r.serviceSnapshot.name,
    quantity: `${r.actualQuantity} ${r.serviceSnapshot.pricingUnit}`,
    actualAcres: r.actualAcres,
    tractor: r.tractor ? `${r.tractor.name} (${r.tractor.registrationNumber})` : 'N/A',
    totalAmount: round2Decimals(r.totalAmount),
    amountPaid: round2Decimals(r.amountPaid),
    balanceDue: round2Decimals(r.balanceDue),
    paymentStatus: r.paymentStatus,
    operator: r.operatorName || 'N/A'
  }));
};

/**
 * Helper to generate CSV with Indian headers & injection defense
 */
const exportReportToCSV = async (reportType, filters = {}, currentUser = null) => {
  let headers = [];
  let rows = [];
  let filename = `tractorconnect_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;

  if (reportType === 'customers') {
    const data = await getCustomerReport(filters, currentUser);
    headers = [
      'Farmer Name (किसान का नाम)',
      'Mobile Number (मोबाइल)',
      'Village (गाँव)',
      'District (ज़िला)',
      'Completed Bookings',
      'Total Acres Worked',
      'Total Billed (₹)',
      'Total Paid (₹)',
      'Outstanding Balance Due (₹)'
    ];
    rows = data.map((d) => [
      d.name,
      d.mobile,
      d.village,
      d.district,
      d.totalBookings,
      d.totalAcres,
      d.totalBilled,
      d.totalPaid,
      d.totalDue
    ]);
  } else if (reportType === 'villages') {
    const data = await getVillageReport(currentUser);
    headers = [
      'Village (गाँव)',
      'District (ज़िला)',
      'Completed Jobs',
      'Total Acres Worked',
      'Total Billed (₹)',
      'Total Paid (₹)',
      'Outstanding Balance Due (₹)'
    ];
    rows = data.map((d) => [
      d.village,
      d.district,
      d.totalCompletedJobs,
      d.totalAcres,
      d.totalBilled,
      d.totalPaid,
      d.totalDue
    ]);
  } else if (reportType === 'services') {
    const data = await getServiceReport(currentUser);
    headers = [
      'Farming Service (सेवा)',
      'Pricing Unit (इकाई)',
      'Completed Jobs',
      'Total Quantity Worked',
      'Total Acres',
      'Total Revenue Generated (₹)'
    ];
    rows = data.map((d) => [
      d.serviceName,
      d.pricingUnit,
      d.totalJobs,
      d.totalQuantity,
      d.totalAcres,
      d.totalRevenue
    ]);
  } else if (reportType === 'datewise') {
    const data = await getDateWiseReport(filters, currentUser);
    headers = [
      'Work Date (तारीख - IST)',
      'Customer (किसान)',
      'Mobile (मोबाइल)',
      'Village (गाँव)',
      'Service (सेवा)',
      'Quantity (मात्रा)',
      'Actual Acres',
      'Assigned Tractor',
      'Total Charge (₹)',
      'Paid (₹)',
      'Balance Due (₹)',
      'Payment Status',
      'Operator (चालक)'
    ];
    rows = data.map((d) => [
      d.workDate,
      d.customerName,
      d.customerMobile,
      d.village,
      d.service,
      d.quantity,
      d.actualAcres,
      d.tractor,
      d.totalAmount,
      d.amountPaid,
      d.balanceDue,
      d.paymentStatus,
      d.operator
    ]);
  } else {
    throw new Error(`Unsupported report type: ${reportType}`);
  }

  const csvContent = generateCSV(headers, rows);
  return { csvContent, filename };
};

module.exports = {
  getDashboardAnalytics,
  getCustomerReport,
  getVillageReport,
  getServiceReport,
  getDateWiseReport,
  exportReportToCSV
};

