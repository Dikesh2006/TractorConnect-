const mongoose = require('mongoose');

const fieldLocationSchema = new mongoose.Schema(
  {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    village: { type: String, required: [true, 'Field village is required'], trim: true },
    tehsil: { type: String, trim: true, default: '' },
    district: { type: String, required: [true, 'Field district is required'], trim: true },
    state: { type: String, trim: true, default: 'Madhya Pradesh' },
    pincode: { type: String, trim: true, default: '' },
    fullAddress: { type: String, trim: true, default: '' },
    landmark: { type: String, trim: true, default: '' }
  },
  { _id: false }
);

const serviceSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    pricingUnit: {
      type: String,
      required: true,
      enum: ['per_acre', 'per_hour', 'per_trip', 'per_day']
    },
    unitPrice: { type: Number, required: true, min: 0 },
    minimumCharge: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: ['pending', 'accepted', 'scheduled', 'in_progress', 'completed', 'rejected', 'cancelled']
    },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    note: { type: String, trim: true, default: '' }
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer reference is required'],
      index: true
    },
    tractorOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Service reference is required'],
      index: true
    },
    // Immutable snapshot captured at booking creation time
    serviceSnapshot: {
      type: serviceSnapshotSchema,
      required: [true, 'Service pricing snapshot is required']
    },
    estimatedQuantity: {
      type: Number,
      required: [true, 'Estimated acres or hours is required'],
      min: [0.1, 'Estimated quantity must be at least 0.1']
    },
    estimatedCost: {
      type: Number,
      required: [true, 'Estimated cost is required'],
      min: [0, 'Estimated cost cannot be negative']
    },
    requestedDate: {
      type: Date,
      required: [true, 'Requested date is required'],
      index: true
    },
    requestedTimeSlot: {
      type: String,
      enum: {
        values: ['morning', 'afternoon', 'evening', 'full_day'],
        message: '{VALUE} is not a valid time slot'
      },
      default: 'morning'
    },
    fieldLocation: {
      type: fieldLocationSchema,
      required: [true, 'Field location is required']
    },
    cropType: {
      type: String,
      trim: true,
      default: ''
    },
    customerNotes: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'scheduled', 'in_progress', 'completed', 'rejected', 'cancelled'],
      default: 'pending',
      index: true
    },
    adminNotes: {
      type: String,
      trim: true,
      default: ''
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: ''
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: ''
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    scheduledStart: {
      type: Date,
      default: null,
      index: true
    },
    scheduledEnd: {
      type: Date,
      default: null
    },
    assignedTractor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tractor',
      default: null,
      index: true
    },
    assignedOperatorName: {
      type: String,
      trim: true,
      default: ''
    },
    statusHistory: [statusHistorySchema]
  },
  {
    timestamps: true
  }
);

// Indexes for common queries
bookingSchema.index({ customer: 1, createdAt: -1 });
bookingSchema.index({ tractorOwner: 1, status: 1, requestedDate: -1 });
bookingSchema.index({ status: 1, requestedDate: 1 });
bookingSchema.index({ assignedTractor: 1, scheduledStart: 1, scheduledEnd: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;

