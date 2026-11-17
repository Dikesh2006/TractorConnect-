const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null
    },
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
      minlength: [2, 'Service name must be at least 2 characters'],
      maxlength: [100, 'Service name cannot exceed 100 characters']
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      default: 'General Farming',
      index: true
    },
    imageUrl: {
      type: String,
      trim: true,
      default: ''
    },
    pricingUnit: {
      type: String,
      required: [true, 'Pricing unit is required'],
      enum: {
        values: ['per_acre', 'per_hour', 'per_trip', 'per_day'],
        message: '{VALUE} is not a valid pricing unit'
      },
      index: true
    },
    currentPrice: {
      type: Number,
      required: [true, 'Current price is required'],
      min: [0, 'Price cannot be negative'],
      set: (val) => Math.round((parseFloat(val) + Number.EPSILON) * 100) / 100
    },
    minimumCharge: {
      type: Number,
      default: 0,
      min: [0, 'Minimum charge cannot be negative'],
      set: (val) => Math.round((parseFloat(val || 0) + Number.EPSILON) * 100) / 100
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Helper function to create slug from name
const createSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
};

serviceSchema.pre('save', function (next) {
  if (this.isModified('name') || !this.slug) {
    const baseSlug = createSlug(this.name);
    this.slug = this.owner ? `${baseSlug}-${this.owner.toString().slice(-4)}` : baseSlug;
  }
  next();
});

serviceSchema.index({ owner: 1, name: 1 });
serviceSchema.index({ owner: 1, slug: 1 });
serviceSchema.index({ owner: 1, isActive: 1, category: 1 });

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;

