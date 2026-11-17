const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { normalizeIndianMobile, isValidIndianMobile } = require('../utils/formatters');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      trim: true,
      index: true,
      validate: {
        validator: function (v) {
          return isValidIndianMobile(v);
        },
        message: 'Mobile number must be a valid 10-digit Indian number starting with 6, 7, 8, or 9'
      },
      set: function (v) {
        return normalizeIndianMobile(v);
      }
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false // Never returned in default queries
    },
    role: {
      type: String,
      enum: {
        values: ['customer', 'owner', 'admin', 'operator'],
        message: '{VALUE} is not a valid user role'
      },
      default: 'customer',
      index: true
    },
    // Tractor Owner Business Profile fields
    businessName: {
      type: String,
      trim: true,
      default: ''
    },
    serviceRadiusKm: {
      type: Number,
      default: 25,
      min: 1,
      max: 150
    },
    location: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      village: { type: String, trim: true, default: '' },
      district: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: 'Madhya Pradesh' },
      fullAddress: { type: String, trim: true, default: '' }
    },
    serviceDescription: {
      type: String,
      trim: true,
      default: ''
    },
    isApproved: {
      type: Boolean,
      default: function () {
        // Customers and Admins are approved by default; Owners require admin approval
        return this.role !== 'owner';
      },
      index: true
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: function () {
        return this.role === 'owner' ? 'pending' : 'approved';
      },
      index: true
    },
    approvedAt: {
      type: Date,
      default: null
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: ''
    },
    village: {
      type: String,
      trim: true,
      default: ''
    },
    district: {
      type: String,
      trim: true,
      default: ''
    },
    state: {
      type: String,
      trim: true,
      default: 'Madhya Pradesh'
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    lastLoginAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Pre-save hook: Hash password if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare entered password with stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

const User = mongoose.model('User', userSchema);

module.exports = User;

