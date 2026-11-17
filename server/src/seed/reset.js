const config = require('../config/env');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Service = require('../models/Service');
const ServicePriceHistory = require('../models/ServicePriceHistory');
const Tractor = require('../models/Tractor');
const Booking = require('../models/Booking');
const WorkRecord = require('../models/WorkRecord');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');

const resetDatabase = async () => {
  if (config.isProduction) {
    console.error('⛔ FATAL SECURITY: Cannot run seed:reset in production environment!');
    process.exit(1);
  }

  console.log('⚠️ Resetting database (wiping all collections)...');
  try {
    await connectDB();
    await Promise.all([
      User.deleteMany({}),
      Service.deleteMany({}),
      ServicePriceHistory.deleteMany({}),
      Tractor.deleteMany({}),
      Booking.deleteMany({}),
      WorkRecord.deleteMany({}),
      Payment.deleteMany({}),
      Expense.deleteMany({})
    ]);
    console.log('✅ Database reset complete. All collections cleared.');
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('❌ Reset failed:', err);
    process.exit(1);
  }
};

resetDatabase();

