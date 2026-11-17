const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, 'Expense category is required'],
      enum: {
        values: ['diesel', 'maintenance', 'repair', 'spare_parts', 'labour', 'insurance', 'other'],
        message: '{VALUE} is not a valid expense category'
      },
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Expense amount must be at least ₹1']
    },
    date: {
      type: Date,
      required: [true, 'Expense date is required'],
      default: Date.now,
      index: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    tractorOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    tractor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tractor',
      default: null,
      index: true
    },
    vendor: {
      type: String,
      trim: true,
      default: ''
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'bank_transfer', 'other'],
      default: 'cash'
    },
    receiptNote: {
      type: String,
      trim: true,
      default: ''
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

expenseSchema.index({ date: -1, category: 1, isDeleted: 1 });

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;

