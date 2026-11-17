const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/security');
const config = require('../config/env');

const {
  registerSchema,
  ownerRegisterSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  createAdminSchema,
  updateOwnerApprovalSchema
} = require('../validators/authValidators');

// Apply auth rate limiter only in non-test environments
const limiter = config.isTest ? (req, res, next) => next() : authLimiter;

// Public routes
router.post('/register', limiter, validate(registerSchema), authController.register);
router.post('/farmer/register', limiter, validate(registerSchema), authController.register);
router.post('/owner/register', limiter, validate(ownerRegisterSchema), authController.registerOwner);
router.post('/login', limiter, validate(loginSchema), authController.login);

// Protected routes (Customer, Owner & Admin)
router.get('/me', authenticate, authController.getMe);
router.put('/profile', authenticate, validate(updateProfileSchema), authController.updateProfile);
router.put('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

// Admin-only route to create additional admins
router.post('/create-admin', authenticate, authorize('admin'), validate(createAdminSchema), authController.createAdmin);

// Admin-only routes to manage tractor owners
router.get('/owners', authenticate, authorize('admin'), authController.getAllOwners);
router.patch(
  '/owners/:id/approval',
  authenticate,
  authorize('admin'),
  validate(updateOwnerApprovalSchema),
  authController.updateOwnerApproval
);

module.exports = router;

