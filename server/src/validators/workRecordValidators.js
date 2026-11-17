const { z } = require('zod');

const completeWorkSchema = z.object({
  actualQuantity: z
    .number({ required_error: 'Actual quantity is required' })
    .positive('Actual quantity must be greater than zero')
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number)),
  actualAcres: z
    .number()
    .nonnegative()
    .optional()
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number)),
  workDate: z.string().optional(),
  startTime: z.string().trim().optional(),
  endTime: z.string().trim().optional(),
  workingHours: z
    .number()
    .nonnegative()
    .optional()
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number)),
  dieselUsedLiters: z
    .number()
    .nonnegative()
    .optional()
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number)),
  discount: z
    .number()
    .nonnegative()
    .optional()
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number)),
  discountReason: z.string().trim().optional(),
  extraCharges: z
    .number()
    .nonnegative()
    .optional()
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number)),
  extraChargesReason: z.string().trim().optional(),
  operatorName: z.string().trim().optional(),
  completionNotes: z.string().trim().optional()
});

module.exports = {
  completeWorkSchema
};

