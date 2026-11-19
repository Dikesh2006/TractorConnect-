import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Phone, ArrowRight, AlertCircle, ShieldCheck, Tractor } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isValidIndianMobile, normalizeIndianMobile } from '../../utils/formatters';

const ownerLoginSchema = z.object({
  mobile: z
    .string()
    .min(1, 'Mobile number is required')
    .refine((val) => isValidIndianMobile(val), {
      message: 'Enter a valid 10-digit mobile number (e.g. 9826111111)'
    }),
  password: z.string().min(1, 'Password is required')
});

const OwnerLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = location.state?.from?.pathname || null;

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(ownerLoginSchema),
    defaultValues: {
      mobile: '',
      password: ''
    }
  });

  const onSubmit = async (data) => {
    try {
      setApiError('');
      setIsSubmitting(true);
      const normalized = normalizeIndianMobile(data.mobile);
      const user = await login(normalized, data.password);

      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'owner') {
        navigate('/owner/dashboard', { replace: true });
      } else {
        // Customer trying to login on owner portal
        navigate('/customer/dashboard', { replace: true });
      }
    } catch (err) {
      setApiError(err.response?.data?.message || err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-slate-100">
      <div className="max-w-md w-full space-y-6 bg-white p-5 sm:p-8 md:p-10 rounded-2xl shadow-sm border border-slate-200">
        {/* Toggle between Farmer and Owner */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <Link
            to="/login"
            className="flex-1 py-2 text-center text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
          >
            🌾 Farmer Login
          </Link>
          <div className="flex-1 py-2 text-center text-xs font-bold rounded-lg bg-white text-amber-800 shadow-xs border border-amber-200">
            🚜 Tractor Owner
          </div>
        </div>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 mb-3 border border-amber-200 text-3xl shadow-xs">
            🚜
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Tractor Owner Login
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            ट्रैक्टर मालिक पोर्टल &bull; Manage your fleet, services & bookings
          </p>
        </div>

        {apiError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-3 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
            <span>{apiError}</span>
          </div>
        )}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4">
            <div>
              <label htmlFor="owner-mobile" className="block text-xs font-semibold text-slate-700 mb-1">
                Owner Mobile Number (मालिक का मोबाइल नंबर)
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-medium text-xs">
                  +91
                </div>
                <input
                  id="owner-mobile"
                  type="tel"
                  maxLength={10}
                  placeholder="9826111111"
                  className={`block w-full pl-12 pr-4 py-2.5 text-sm rounded-xl border ${
                    errors.mobile ? 'border-red-400 focus:ring-red-400' : 'border-slate-300 focus:ring-amber-500'
                  } focus:outline-hidden focus:ring-2`}
                  {...register('mobile')}
                />
              </div>
              {errors.mobile && (
                <p className="mt-1 text-xs text-red-600">{errors.mobile.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="owner-password" className="block text-xs font-semibold text-slate-700 mb-1">
                Password (पासवर्ड)
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="owner-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`block w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border ${
                    errors.password ? 'border-red-400 focus:ring-red-400' : 'border-slate-300 focus:ring-amber-500'
                  } focus:outline-hidden focus:ring-2`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all shadow-xs disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Login to Owner Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-200 text-center space-y-2">
          <p className="text-xs text-slate-600">
            Want to list your tractors and get farm jobs?
          </p>
          <Link
            to="/owner/register"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-700 hover:text-amber-800"
          >
            <Tractor className="w-3.5 h-3.5" />
            <span>Register as a Tractor Owner (नया पंजीकरण)</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OwnerLogin;

