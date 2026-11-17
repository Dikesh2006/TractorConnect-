const express = require('express');
const router = express.Router();

const discoveryController = require('../controllers/discoveryController');

// Public discovery endpoints
router.get('/nearby-owners', discoveryController.getNearbyOwners);
router.get('/owners/:id', discoveryController.getOwnerProfile);

module.exports = router;

