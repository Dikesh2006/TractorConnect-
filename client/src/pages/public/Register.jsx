import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Phone, User as UserIcon, MapPin, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isValidIndianMobile, normalizeIndianMobile } from '../../utils/formatters';

const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters'),
    mobile: z
      .string()
      .refine((val) => isValidIndianMobile(val), {
        message: 'Enter a valid 10-digit mobile number (e.g. 9876543210)'
      }),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    village: z.string().min(2, 'Village is required (गाँव کا नाम)'),
    district: z.string().min(2, 'District is required (ज़िला)'),
    state: z.string().default('Madhya Pradesh'),
    address: z.string().optional()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

const Register = () => {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      mobile: '',
      password: '',
      confirmPassword: '',
      village: '',
      district: 'Sehore',
      state: 'Madhya Pradesh',
      address: ''
    }
  });

  const onSubmit = async (data) => {
    try {
      setApiError('');
      setIsSubmitting(true);
      const payload = {
        name: data.name.trim(),
        mobile: normalizeIndianMobile(data.mobile),
        password: data.password,
        village: data.village.trim(),
        district: data.district.trim(),
        state: data.state.trim(),
        address: data.address?.trim() || ''
      };

      await authRegister(payload);
      navigate('/customer/dashboard', { replace: true });
    } catch (err) {
      setApiError(err.response?.data?.message || err.message || 'Registration failed. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-xl w-full space-y-6 bg-white p-5 sm:p-8 md:p-10 rounded-2xl shadow-sm border border-slate-200">
        {/* Toggle between Farmer and Owner */}
        <div className="flex bg-slate-100 p-1 rounded-xl max-w-sm mx-auto">
          <div className="flex-1 py-2 text-center text-xs font-bold rounded-lg bg-white text-brand-800 shadow-xs border border-brand-200">
            🌾 Farmer Register
          </div>
          <Link
            to="/owner/register"
            className="flex-1 py-2 text-center text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
          >
            🚜 Tractor Owner
          </Link>
        </div>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-50 text-brand-700 mb-3 border border-brand-100 text-3xl">
            🚜
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Kisan Registration
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            नया किसान खाता बनाएं / Create your farmer account to book tractors easily
          </p>
        </div>

        {apiError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
            <span>{apiError}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Full Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1">
              Full Name (पूरा नाम) *
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <UserIcon className="w-5 h-5" />
              </div>
              <input
                id="name"
                type="text"
                placeholder="उदा. रमेश पटेल (Ramesh Patel)"
                {...register('name')}
                className={`block w-full pl-10 pr-4 py-2.5 text-slate-900 rounded-xl border ${
                  errors.name ? 'border-red-400 focus:ring-red-500' : 'border-slate-300 focus:ring-brand-500'
                } focus:outline-none focus:ring-2 focus:border-transparent text-sm`}
              />
            </div>
            {errors.name && <p className="mt-1 text-xs text-red-600 font-medium">{errors.name.message}</p>}
          </div>

          {/* Mobile Number */}
          <div>
            <label htmlFor="mobile" className="block text-sm font-semibold text-slate-700 mb-1">
              Mobile Number (मोबाइल नंबर) *
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-medium text-sm">
                +91
              </div>
              <input
                id="mobile"
                type="tel"
                maxLength={10}
                placeholder="9876543210"
                {...register('mobile')}
                className={`block w-full pl-12 pr-4 py-2.5 text-slate-900 rounded-xl border ${
                  errors.mobile ? 'border-red-400 focus:ring-red-500' : 'border-slate-300 focus:ring-brand-500'
                } focus:outline-none focus:ring-2 focus:border-transparent text-sm`}
              />
            </div>
            {errors.mobile && <p className="mt-1 text-xs text-red-600 font-medium">{errors.mobile.message}</p>}
          </div>

          {/* Village & District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="village" className="block text-sm font-semibold text-slate-700 mb-1">
                Village (गाँव) *
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <input
                  id="village"
                  type="text"
                  placeholder="उदा. बिलकिसगंज (Bilkisganj)"
                  {...register('village')}
                  className={`block w-full pl-10 pr-4 py-2.5 text-slate-900 rounded-xl border ${
                    errors.village ? 'border-red-400 focus:ring-red-500' : 'border-slate-300 focus:ring-brand-500'
                  } focus:outline-none focus:ring-2 focus:border-transparent text-sm`}
                />
              </div>
              {errors.village && <p className="mt-1 text-xs text-red-600 font-medium">{errors.village.message}</p>}
            </div>

            <div>
              <label htmlFor="district" className="block text-sm font-semibold text-slate-700 mb-1">
                District (ज़िला) *
              </label>
              <input
                id="district"
                type="text"
                placeholder="Sehore"
                {...register('district')}
                className={`block w-full px-4 py-2.5 text-slate-900 rounded-xl border ${
                  errors.district ? 'border-red-400 focus:ring-red-500' : 'border-slate-300 focus:ring-brand-500'
                } focus:outline-none focus:ring-2 focus:border-transparent text-sm`}
              />
              {errors.district && <p className="mt-1 text-xs text-red-600 font-medium">{errors.district.message}</p>}
            </div>
          </div>

          {/* Password & Confirm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1">
                Password (पासवर्ड) *
              </label>
              <div className="relative rounded-xl shadow-sm">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="कम से कम 6 अक्षर"
                  {...register('password')}
                  className={`block w-full px-4 py-2.5 text-slate-900 rounded-xl border ${
                    errors.password ? 'border-red-400 focus:ring-red-500' : 'border-slate-300 focus:ring-brand-500'
                  } focus:outline-none focus:ring-2 focus:border-transparent text-sm`}
                />
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600 font-medium">{errors.password.message}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-1">
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="पासवर्ड दोबारा दर्ज करें"
                {...register('confirmPassword')}
                className={`block w-full px-4 py-2.5 text-slate-900 rounded-xl border ${
                  errors.confirmPassword ? 'border-red-400 focus:ring-red-500' : 'border-slate-300 focus:ring-brand-500'
                } focus:outline-none focus:ring-2 focus:border-transparent text-sm`}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center text-xs text-slate-500">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-brand-700 hover:text-brand-800 font-medium flex items-center space-x-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showPassword ? 'Hide password' : 'Show password'}</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-semibold text-white bg-brand-700 hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-600 disabled:opacity-60 transition-all mt-6"
          >
            {isSubmitting ? (
              <span className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Account...</span>
              </span>
            ) : (
              <span>Create Account (खाता बनाएं)</span>
            )}
          </button>

          <div className="text-center pt-2">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800 underline">
                Log in here (लॉगिन करें)
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;

