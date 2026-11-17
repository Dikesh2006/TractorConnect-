const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    workRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkRecord',
      required: [true, 'WorkRecord reference is required'],
      index: true
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required']
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
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [1, 'Payment amount must be at least ₹1']
    },
    method: {
      type: String,
      enum: {
        values: ['cash', 'upi', 'bank_transfer', 'other'],
        message: '{VALUE} is not a valid payment method'
      },
      default: 'cash',
      index: true
    },
    status: {
      type: String,
      enum: ['paid', 'void'],
      default: 'paid',
      index: true
    },
    upiTransactionId: {
      type: String,
      trim: true,
      default: ''
    },
    paidAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    voidReason: {
      type: String,
      trim: true,
      default: ''
    },
    voidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    voidedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

paymentSchema.index({ workRecord: 1, status: 1 });
paymentSchema.index({ customer: 1, paidAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;

