const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const requiredEnvVars = ['JWT_SECRET'];

// Check required variables
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`FATAL CONFIG ERROR: Required environment variable "${envVar}" is missing.`);
    process.exit(1);
  }
}

// In production, ensure JWT_SECRET is strong (at least 32 characters)
if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.length < 32) {
  console.error('FATAL SECURITY ERROR: JWT_SECRET must be at least 32 characters long in production.');
  process.exit(1);
}

const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tractorconnect',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  admin: {
    mobile: process.env.ADMIN_MOBILE || '9876543210',
    password: process.env.ADMIN_PASSWORD || 'Admin@Tractor2025',
    name: process.env.ADMIN_NAME || 'Ramesh Sharma (Admin)'
  },
  business: {
    name: process.env.BUSINESS_NAME || 'TractorConnect Rural Services',
    phone: process.env.BUSINESS_PHONE || '9876543210',
    upiId: process.env.BUSINESS_UPI_ID || 'tractorconnect@okhdfcbank',
    state: process.env.BUSINESS_STATE || 'Madhya Pradesh',
    district: process.env.BUSINESS_DISTRICT || 'Sehore'
  },
  nominatimBaseUrl: process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org',
  razorpay: {
    enabled: process.env.RAZORPAY_ENABLED === 'true',
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || ''
  }
};

module.exports = config;
