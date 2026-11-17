const { z } = require('zod');

const expenseCategoryEnum = z.enum([
  'diesel',
  'maintenance',
  'repair',
  'spare_parts',
  'labour',
  'insurance',
  'other'
]);

const createExpenseSchema = z.object({
  category: expenseCategoryEnum,
  amount: z
    .number({ required_error: 'Amount is required' })
    .positive('Amount must be greater than zero')
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number)),
  date: z.string().optional(),
  description: z.string({ required_error: 'Description is required' }).trim().min(2),
  tractorId: z.string().optional().or(z.literal('')),
  vendor: z.string().trim().optional(),
  paymentMethod: z.enum(['cash', 'upi', 'bank_transfer', 'other']).default('cash'),
  receiptNote: z.string().trim().optional()
});

const updateExpenseSchema = z.object({
  category: expenseCategoryEnum.optional(),
  amount: z
    .number()
    .positive()
    .optional()
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number)),
  date: z.string().optional(),
  description: z.string().trim().min(2).optional(),
  tractorId: z.string().optional().or(z.literal('')),
  vendor: z.string().trim().optional(),
  paymentMethod: z.enum(['cash', 'upi', 'bank_transfer', 'other']).optional(),
  receiptNote: z.string().trim().optional()
});

module.exports = {
  createExpenseSchema,
  updateExpenseSchema
};

