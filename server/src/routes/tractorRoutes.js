const express = require('express');
const router = express.Router();

const tractorController = require('../controllers/tractorController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createTractorSchema, updateTractorSchema } = require('../validators/tractorValidators');

// Protected for all logged-in users (Customer can view tractors info if needed, or admin/owner)
router.get('/', authenticate, tractorController.getAllTractors);
router.get('/availability', authenticate, authorize('admin', 'owner'), tractorController.checkAvailability);
router.get('/schedule', authenticate, authorize('admin', 'owner'), tractorController.getSchedule);
router.get('/:id', authenticate, tractorController.getTractorById);

// Admin & Owner mutations
router.post('/', authenticate, authorize('admin', 'owner'), validate(createTractorSchema), tractorController.createTractor);
router.put('/:id', authenticate, authorize('admin', 'owner'), validate(updateTractorSchema), tractorController.updateTractor);

module.exports = router;

