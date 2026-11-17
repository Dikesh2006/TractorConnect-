const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const config = require('../config/env');

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl) or matching clientUrl
    if (!origin || origin === config.clientUrl || config.nodeEnv === 'development') {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy violation: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// General API rate limiter (e.g. 200 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

// Stricter rate limiter for sensitive Auth routes (register, login)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 attempts per 15 minutes to prevent brute-forcing
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  }
});

// Configure Helmet with safe Content Security Policy
const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://unpkg.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'http:', '*.tile.openstreetmap.org'],
      connectSrc: ["'self'", config.clientUrl, 'https://nominatim.openstreetmap.org'],
      frameSrc: ["'self'", 'https://api.razorpay.com']
    }
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' }
});

const sanitizeMiddleware = mongoSanitize();
const hppMiddleware = hpp();

module.exports = {
  corsOptions,
  apiLimiter,
  authLimiter,
  helmetMiddleware,
  sanitizeMiddleware,
  hppMiddleware
};
