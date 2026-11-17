const mongoose = require('mongoose');

const servicePriceHistorySchema = new mongoose.Schema(
  {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Service reference is required'],
      index: true
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    pricingUnit: {
      type: String,
      required: [true, 'Pricing unit is required'],
      enum: ['per_acre', 'per_hour', 'per_trip', 'per_day']
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
      index: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    note: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Index for quick chronological query per service
servicePriceHistorySchema.index({ service: 1, effectiveFrom: -1 });

const ServicePriceHistory = mongoose.model('ServicePriceHistory', servicePriceHistorySchema);

module.exports = ServicePriceHistory;

