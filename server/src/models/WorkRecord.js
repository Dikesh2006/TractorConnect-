const mongoose = require('mongoose');

const workRecordSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required'],
      unique: true,
      index: true
    },
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
    serviceSnapshot: {
      name: { type: String, required: true },
      pricingUnit: { type: String, required: true },
      unitPrice: { type: Number, required: true },
      minimumCharge: { type: Number, default: 0 }
    },
    tractor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tractor',
      required: [true, 'Tractor reference is required'],
      index: true
    },
    fieldLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      village: { type: String, required: true, trim: true, index: true },
      tehsil: { type: String, trim: true, default: '' },
      district: { type: String, required: true, trim: true },
      state: { type: String, default: 'Madhya Pradesh' },
      pincode: { type: String, trim: true, default: '' },
      fullAddress: { type: String, trim: true, default: '' },
      landmark: { type: String, trim: true, default: '' }
    },
    actualQuantity: {
      type: Number,
      required: [true, 'Actual quantity is required'],
      min: [0.1, 'Actual quantity must be at least 0.1']
    },
    actualAcres: {
      type: Number,
      default: 0,
      min: 0,
      index: true
    },
    workDate: {
      type: Date,
      required: [true, 'Work date is required'],
      default: Date.now,
      index: true
    },
    startTime: {
      type: String,
      default: ''
    },
    endTime: {
      type: String,
      default: ''
    },
    workingHours: {
      type: Number,
      default: 0,
      min: 0
    },
    dieselUsedLiters: {
      type: Number,
      default: 0,
      min: 0
    },
    finalCharge: {
      type: Number,
      required: [true, 'Final charge is required'],
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    discountReason: {
      type: String,
      trim: true,
      default: ''
    },
    extraCharges: {
      type: Number,
      default: 0,
      min: 0
    },
    extraChargesReason: {
      type: String,
      trim: true,
      default: ''
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: 0
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0
    },
    balanceDue: {
      type: Number,
      default: 0,
      min: 0
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partially_paid', 'paid'],
      default: 'unpaid',
      index: true
    },
    operatorName: {
      type: String,
      trim: true,
      default: ''
    },
    completionNotes: {
      type: String,
      trim: true,
      default: ''
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

workRecordSchema.index({ workDate: -1, 'fieldLocation.village': 1 });
workRecordSchema.index({ customer: 1, paymentStatus: 1 });

const WorkRecord = mongoose.model('WorkRecord', workRecordSchema);

module.exports = WorkRecord;

