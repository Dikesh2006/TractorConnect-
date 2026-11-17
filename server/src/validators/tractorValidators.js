const { z } = require('zod');

const createTractorSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  registrationNumber: z
    .string()
    .trim()
    .min(4, 'Registration number is required')
    .toUpperCase(),
  model: z.string().trim().min(2, 'Model is required'),
  horsepower: z
    .number()
    .min(15, 'Min 15 HP')
    .max(150, 'Max 150 HP')
    .or(z.string().regex(/^\d+$/).transform(Number)),
  status: z.enum(['available', 'in_use', 'maintenance', 'inactive']).optional(),
  currentOperatorName: z.string().trim().optional(),
  notes: z.string().trim().optional()
});

const updateTractorSchema = z.object({
  name: z.string().trim().min(2).optional(),
  registrationNumber: z.string().trim().min(4).toUpperCase().optional(),
  model: z.string().trim().min(2).optional(),
  horsepower: z.number().min(15).max(150).optional().or(z.string().regex(/^\d+$/).transform(Number)),
  status: z.enum(['available', 'in_use', 'maintenance', 'inactive']).optional(),
  currentOperatorName: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  isActive: z.boolean().optional()
});

module.exports = {
  createTractorSchema,
  updateTractorSchema
};

