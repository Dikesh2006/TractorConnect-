const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const mongoose = require('mongoose');

const config = require('./config/env');
const {
  corsOptions,
  apiLimiter,
  helmetMiddleware,
  sanitizeMiddleware,
  hppMiddleware
} = require('./middleware/security');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { sendSuccess } = require('./utils/apiResponse');

const app = express();

// Trust reverse proxy (useful for production behind Nginx/Render/Railway)
app.set('trust proxy', 1);

// Security Middleware
app.use(helmetMiddleware);
app.use(cors(corsOptions));
app.use(compression());

// Body Parsers with safe limits (1MB)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Sanitize NoSQL injection & HTTP Parameter Pollution
app.use(sanitizeMiddleware);
app.use(hppMiddleware);

// Logging (skip in test environment)
if (!config.isTest) {
  app.use(morgan(config.isProduction ? 'combined' : 'dev'));
}

// Rate Limiting (exclude test environment)
if (!config.isTest) {
  app.use('/api/', apiLimiter);
}

// Health Check Route (accessible without /api/v1 prefix as requested)
app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  return sendSuccess(res, {
    status: isDbConnected ? 'healthy' : 'degraded',
    database: isDbConnected ? 'connected' : 'disconnected',
    environment: config.nodeEnv,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  }, 'TractorConnect API is operational');
});

// Root welcome route
app.get('/', (req, res) => {
  return sendSuccess(res, {
    name: 'TractorConnect API',
    version: '1.0.0',
    documentation: '/api/v1',
    health: '/api/health'
  }, 'Welcome to TractorConnect API');
});

// Mount API v1 routes
const apiRouter = express.Router();

// Auth routes
const authRoutes = require('./routes/authRoutes');
apiRouter.use('/auth', authRoutes);

// Service routes
const serviceRoutes = require('./routes/serviceRoutes');
apiRouter.use('/services', serviceRoutes);

// Tractor routes
const tractorRoutes = require('./routes/tractorRoutes');
apiRouter.use('/tractors', tractorRoutes);

// Booking routes
const bookingRoutes = require('./routes/bookingRoutes');
apiRouter.use('/bookings', bookingRoutes);

// WorkRecord routes
const workRecordRoutes = require('./routes/workRecordRoutes');
apiRouter.use('/work-records', workRecordRoutes);

// Payment routes
const paymentRoutes = require('./routes/paymentRoutes');
apiRouter.use('/payments', paymentRoutes);

// Expense routes
const expenseRoutes = require('./routes/expenseRoutes');
apiRouter.use('/expenses', expenseRoutes);

// Report routes
const reportRoutes = require('./routes/reportRoutes');
apiRouter.use('/reports', reportRoutes);

// Customer routes
const customerRoutes = require('./routes/customerRoutes');
apiRouter.use('/customers', customerRoutes);

// Discovery routes (Farmer nearby tractor owner search & comparison)
const discoveryRoutes = require('./routes/discoveryRoutes');
apiRouter.use('/discovery', discoveryRoutes);

// Placeholder route for /api/v1
apiRouter.get('/', (req, res) => {
  return sendSuccess(res, {
    version: '1.0.0',
    endpoints: [
      '/auth',
      '/services',
      '/bookings',
      '/tractors',
      '/work-records',
      '/payments',
      '/expenses',
      '/reports',
      '/customers'
    ]
  }, 'TractorConnect API v1');
});

app.use('/api/v1', apiRouter);

// Make apiRouter accessible for adding routes across phases
app.apiRouter = apiRouter;

// 404 & Central Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
