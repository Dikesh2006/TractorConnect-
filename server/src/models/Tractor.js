const mongoose = require('mongoose');

const tractorSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null
    },
    name: {
      type: String,
      required: [true, 'Tractor name/label is required'],
      trim: true,
      maxlength: [100, 'Tractor name cannot exceed 100 characters']
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    model: {
      type: String,
      required: [true, 'Model name is required'],
      trim: true
    },
    horsepower: {
      type: Number,
      required: [true, 'Horsepower (HP) is required'],
      min: [15, 'Horsepower must be at least 15 HP'],
      max: [150, 'Horsepower cannot exceed 150 HP']
    },
    status: {
      type: String,
      enum: {
        values: ['available', 'in_use', 'maintenance', 'inactive'],
        message: '{VALUE} is not a valid tractor status'
      },
      default: 'available',
      index: true
    },
    currentOperatorName: {
      type: String,
      trim: true,
      default: ''
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

const Tractor = mongoose.model('Tractor', tractorSchema);

module.exports = Tractor;

