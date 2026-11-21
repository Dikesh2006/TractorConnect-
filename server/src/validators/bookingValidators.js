const { z } = require('zod');

const fieldLocationSchema = z.object({
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  village: z.string({ required_error: 'Village name is required' }).trim().min(2, 'Village name is required'),
  tehsil: z.string().trim().optional(),
  district: z.string({ required_error: 'District name is required' }).trim().min(2, 'District is required'),
  state: z.string().trim().default('Madhya Pradesh'),
  pincode: z.string().trim().optional(),
  fullAddress: z.string().trim().optional(),
  landmark: z.string().trim().optional()
});

const createBookingSchema = z.object({
  serviceId: z.string({ required_error: 'Service ID is required' }).min(1),
  ownerId: z
    .union([
      z.string(),
      z.object({ _id: z.any() }).transform((val) => (val._id ? String(val._id) : undefined))
    ])
    .optional(),
  estimatedQuantity: z
    .number({ required_error: 'Estimated quantity (acres/hours) is required' })
    .positive('Quantity must be greater than zero')
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number)),
  requestedDate: z.string({ required_error: 'Requested date is required' }),
  requestedTimeSlot: z.enum(['morning', 'afternoon', 'evening', 'full_day']).default('morning'),
  fieldLocation: fieldLocationSchema,
  cropType: z.string().trim().optional(),
  customerNotes: z.string().trim().max(500).optional()
});

const rejectBookingSchema = z.object({
  rejectionReason: z
    .string({ required_error: 'Rejection reason is required' })
    .trim()
    .min(3, 'Rejection reason must be at least 3 characters')
});

const cancelBookingSchema = z.object({
  cancellationReason: z
    .string({ required_error: 'Cancellation reason is required' })
    .trim()
    .min(3, 'Cancellation reason must be at least 3 characters')
});

const scheduleBookingSchema = z.object({
  tractorId: z.string({ required_error: 'Tractor ID is required' }),
  scheduledStart: z.string({ required_error: 'Scheduled start date/time is required' }),
  scheduledEnd: z.string({ required_error: 'Scheduled end date/time is required' }),
  operatorName: z.string().trim().optional(),
  adminNotes: z.string().trim().optional()
});

module.exports = {
  createBookingSchema,
  rejectBookingSchema,
  cancelBookingSchema,
  scheduleBookingSchema
};

