const express = require('express');
const router = express.Router();

const serviceController = require('../controllers/serviceController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createServiceSchema, updateServiceSchema } = require('../validators/serviceValidators');

// Public endpoints
router.get('/', serviceController.getActiveServices);

// Admin & Owner management endpoints (Place specific admin routes BEFORE parameterized :slugOrId route)
router.get('/admin/all', authenticate, authorize('admin', 'owner'), serviceController.getAllServicesAdmin);
router.post('/', authenticate, authorize('admin', 'owner'), validate(createServiceSchema), serviceController.createService);
router.put('/:id', authenticate, authorize('admin', 'owner'), validate(updateServiceSchema), serviceController.updateService);
router.patch('/:id/status', authenticate, authorize('admin', 'owner'), serviceController.toggleServiceStatus);
router.get('/:id/price-history', authenticate, authorize('admin', 'owner'), serviceController.getPriceHistory);
router.delete('/:id', authenticate, authorize('admin', 'owner'), serviceController.deleteService);

// Public single service retrieval (active only, or inactive if admin)
router.get('/:slugOrId', serviceController.getServiceBySlugOrId);

module.exports = router;

