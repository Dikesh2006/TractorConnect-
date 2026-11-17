const { z } = require('zod');

const recordPaymentSchema = z.object({
  workRecordId: z.string({ required_error: 'Work record ID is required' }),
  amount: z
    .number({ required_error: 'Amount is required' })
    .positive('Payment amount must be greater than zero')
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number)),
  method: z.enum(['cash', 'upi', 'bank_transfer', 'other']).default('cash'),
  upiTransactionId: z.string().trim().optional(),
  paidAt: z.string().optional(),
  notes: z.string().trim().optional()
});

const voidPaymentSchema = z.object({
  voidReason: z
    .string({ required_error: 'Void reason is required' })
    .trim()
    .min(3, 'Void reason must be at least 3 characters')
});

module.exports = {
  recordPaymentSchema,
  voidPaymentSchema
};

