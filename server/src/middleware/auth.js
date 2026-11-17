const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const { sendError } = require('../utils/apiResponse');

/**
 * Authentication Middleware:
 * Verifies Bearer JWT token in Authorization header,
 * loads the active user from database, and attaches to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required. Please provide a valid token.', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return sendError(res, 'Authentication token missing.', 401);
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 'Token expired. Please log in again.', 401);
      }
      return sendError(res, 'Invalid token. Please log in again.', 401);
    }

    // Fetch user from DB
    const user = await User.findById(decoded.id);
    if (!user) {
      return sendError(res, 'User belonging to this token no longer exists.', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'Your account has been deactivated. Please contact support.', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-Based Authorization Middleware:
 * Restricts access to specified roles.
 * @param  {...string} roles - e.g. 'admin', 'customer', 'operator'
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Requires one of roles: [${roles.join(', ')}]. Current role: '${req.user.role}'`,
        403
      );
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize
};

