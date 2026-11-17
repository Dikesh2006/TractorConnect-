const { z } = require('zod');
const { isValidIndianMobile, normalizeIndianMobile } = require('../utils/formatters');

// Custom Zod validator for Indian mobile numbers
const indianMobileSchema = z
  .string({ required_error: 'Mobile number is required' })
  .trim()
  .refine((val) => isValidIndianMobile(val), {
    message: 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)'
  })
  .transform((val) => normalizeIndianMobile(val));

const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  mobile: indianMobileSchema,
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters long'),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  village: z
    .string()
    .trim()
    .max(100, 'Village name cannot exceed 100 characters')
    .optional(),
  district: z
    .string()
    .trim()
    .max(100, 'District name cannot exceed 100 characters')
    .optional(),
  state: z
    .string()
    .trim()
    .max(100, 'State name cannot exceed 100 characters')
    .optional(),
  address: z
    .string()
    .trim()
    .max(255, 'Address cannot exceed 255 characters')
    .optional(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable()
});

const ownerRegisterSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  mobile: indianMobileSchema,
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters long'),
  businessName: z
    .string({ required_error: 'Business name is required' })
    .trim()
    .min(2, 'Business name must be at least 2 characters')
    .max(120, 'Business name cannot exceed 120 characters'),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  village: z
    .string()
    .trim()
    .max(100, 'Village name cannot exceed 100 characters')
    .optional(),
  district: z
    .string()
    .trim()
    .max(100, 'District name cannot exceed 100 characters')
    .optional(),
  state: z
    .string()
    .trim()
    .max(100, 'State name cannot exceed 100 characters')
    .optional(),
  address: z
    .string()
    .trim()
    .max(255, 'Address cannot exceed 255 characters')
    .optional(),
  serviceRadiusKm: z.coerce
    .number()
    .min(1, 'Service radius must be at least 1 km')
    .max(150, 'Service radius cannot exceed 150 km')
    .default(25),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  serviceDescription: z
    .string()
    .trim()
    .max(1000, 'Service description cannot exceed 1000 characters')
    .optional()
});

const loginSchema = z.object({
  mobile: indianMobileSchema,
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required')
});

const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .optional(),
  businessName: z
    .string()
    .trim()
    .max(120, 'Business name cannot exceed 120 characters')
    .optional(),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  village: z
    .string()
    .trim()
    .max(100, 'Village name cannot exceed 100 characters')
    .optional(),
  district: z
    .string()
    .trim()
    .max(100, 'District name cannot exceed 100 characters')
    .optional(),
  state: z
    .string()
    .trim()
    .max(100, 'State name cannot exceed 100 characters')
    .optional(),
  address: z
    .string()
    .trim()
    .max(255, 'Address cannot exceed 255 characters')
    .optional(),
  serviceRadiusKm: z.coerce
    .number()
    .min(1)
    .max(150)
    .optional(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  serviceDescription: z
    .string()
    .trim()
    .max(1000)
    .optional()
});

const changePasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: 'Current password is required' })
    .min(1, 'Current password is required'),
  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(6, 'New password must be at least 6 characters long')
});

const createAdminSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters'),
  mobile: indianMobileSchema,
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters long'),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal(''))
});

const updateOwnerApprovalSchema = z
  .object({
    approvalStatus: z.enum(['pending', 'approved', 'rejected', 'suspended']).optional(),
    status: z.enum(['pending', 'approved', 'rejected', 'suspended']).optional(),
    rejectionReason: z.string().trim().optional()
  })
  .refine((data) => data.approvalStatus || data.status, {
    message: 'Approval status is required'
  });

module.exports = {
  registerSchema,
  ownerRegisterSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  createAdminSchema,
  updateOwnerApprovalSchema
};

