const express = require('express');
const router = express.Router();

const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

// All report routes are accessible to Admin and Tractor Owners (scoped appropriately)
router.use(authenticate, authorize('admin', 'owner'));

router.get('/dashboard', reportController.getDashboard);
router.get('/customers', reportController.getCustomerReport);
router.get('/villages', reportController.getVillageReport);
router.get('/services', reportController.getServiceReport);
router.get('/datewise', reportController.getDateWiseReport);
router.get('/export/:reportType', reportController.exportCSV);

module.exports = router;

