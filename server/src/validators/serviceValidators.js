const { z } = require('zod');

const pricingUnitEnum = z.enum(['per_acre', 'per_hour', 'per_trip', 'per_day'], {
  errorMap: () => ({ message: 'Pricing unit must be one of: per_acre, per_hour, per_trip, per_day' })
});

const createServiceSchema = z.object({
  name: z
    .string({ required_error: 'Service name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  description: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(5, 'Description must be at least 5 characters')
    .max(1000, 'Description cannot exceed 1000 characters'),
  category: z
    .string({ required_error: 'Category is required' })
    .trim()
    .min(2, 'Category must be at least 2 characters')
    .max(50, 'Category cannot exceed 50 characters'),
  imageUrl: z.string().trim().optional(),
  pricingUnit: pricingUnitEnum,
  currentPrice: z
    .number({ required_error: 'Price is required' })
    .positive('Price must be greater than zero')
    .or(
      z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid positive amount').transform(Number)
    ),
  minimumCharge: z
    .number()
    .nonnegative('Minimum charge cannot be negative')
    .optional()
    .or(
      z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number)
    ),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().optional().or(z.string().regex(/^\d+$/).transform(Number)),
  priceChangeNote: z.string().trim().optional()
});

const updateServiceSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().min(5).max(1000).optional(),
  category: z.string().trim().min(2).max(50).optional(),
  imageUrl: z.string().trim().optional(),
  pricingUnit: pricingUnitEnum.optional(),
  currentPrice: z
    .number()
    .positive()
    .optional()
    .or(
      z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number)
    ),
  minimumCharge: z
    .number()
    .nonnegative()
    .optional()
    .or(
      z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number)
    ),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().optional().or(z.string().regex(/^\d+$/).transform(Number)),
  priceChangeNote: z.string().trim().optional()
});

module.exports = {
  createServiceSchema,
  updateServiceSchema
};

