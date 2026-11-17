const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const reportService = require('../services/reportService');

/**
 * @route   GET /api/v1/reports/dashboard
 * @desc    Get dashboard KPIs and chart data
 * @access  Private (Admin or Owner)
 */
const getDashboard = asyncHandler(async (req, res) => {
  const analytics = await reportService.getDashboardAnalytics(req.query, req.user);
  return sendSuccess(res, analytics, 'Dashboard analytics retrieved');
});

/**
 * @route   GET /api/v1/reports/customers
 * @desc    Get customer-wise summary report (JSON)
 * @access  Private (Admin or Owner)
 */
const getCustomerReport = asyncHandler(async (req, res) => {
  const data = await reportService.getCustomerReport(req.query, req.user);
  return sendSuccess(res, { report: data }, 'Customer report retrieved');
});

/**
 * @route   GET /api/v1/reports/villages
 * @desc    Get village-wise summary report (JSON)
 * @access  Private (Admin or Owner)
 */
const getVillageReport = asyncHandler(async (req, res) => {
  const data = await reportService.getVillageReport(req.user);
  return sendSuccess(res, { report: data }, 'Village report retrieved');
});

/**
 * @route   GET /api/v1/reports/services
 * @desc    Get service-wise summary report (JSON)
 * @access  Private (Admin or Owner)
 */
const getServiceReport = asyncHandler(async (req, res) => {
  const data = await reportService.getServiceReport(req.user);
  return sendSuccess(res, { report: data }, 'Service report retrieved');
});

/**
 * @route   GET /api/v1/reports/datewise
 * @desc    Get date-wise detailed work records report (JSON)
 * @access  Private (Admin or Owner)
 */
const getDateWiseReport = asyncHandler(async (req, res) => {
  const data = await reportService.getDateWiseReport(req.query, req.user);
  return sendSuccess(res, { report: data }, 'Date-wise work report retrieved');
});

/**
 * @route   GET /api/v1/reports/export/:reportType
 * @desc    Export report as downloadable CSV with UTF-8 BOM
 * @access  Private (Admin or Owner)
 */
const exportCSV = asyncHandler(async (req, res) => {
  const { reportType } = req.params;
  const { csvContent, filename } = await reportService.exportReportToCSV(reportType, req.query, req.user);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.status(200).send(csvContent);
});

module.exports = {
  getDashboard,
  getCustomerReport,
  getVillageReport,
  getServiceReport,
  getDateWiseReport,
  exportCSV
};

