import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Phone, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isValidIndianMobile, normalizeIndianMobile } from '../../utils/formatters';

const loginSchema = z.object({
  mobile: z
    .string()
    .min(1, 'Mobile number is required')
    .refine((val) => isValidIndianMobile(val), {
      message: 'Enter a valid 10-digit mobile number (e.g. 9876543210)'
    }),
  password: z.string().min(1, 'Password is required')
});

const Login = () => {
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
    resolver: zodResolver(loginSchema),
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

      // Navigate based on role or intended destination
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'owner') {
        navigate('/owner/dashboard', { replace: true });
      } else {
        navigate('/customer/dashboard', { replace: true });
      }
    } catch (err) {
      setApiError(err.response?.data?.message || err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-slate-200">
        {/* Toggle between Farmer and Owner */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <div className="flex-1 py-1.5 text-center text-xs font-bold rounded-lg bg-white text-brand-800 shadow-xs border border-brand-200">
            🌾 Farmer Login
          </div>
          <Link
            to="/owner/login"
            className="flex-1 py-1.5 text-center text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
          >
            🚜 Tractor Owner
          </Link>
        </div>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-50 text-brand-700 mb-4 border border-brand-100 text-3xl shadow-sm">
            🚜
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Welcome to TractorConnect
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            लॉगिन करें / Log in with your 10-digit mobile number
          </p>
        </div>

        {apiError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
            <span>{apiError}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4">
            <div>
              <label htmlFor="mobile" className="block text-sm font-semibold text-slate-700 mb-1">
                Mobile Number (मोबाइल नंबर)
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
                  className={`block w-full pl-12 pr-4 py-3 text-slate-900 rounded-xl border ${
                    errors.mobile ? 'border-red-400 focus:ring-red-500' : 'border-slate-300 focus:ring-brand-500'
                  } focus:outline-none focus:ring-2 focus:border-transparent text-base sm:text-sm`}
                />
              </div>
              {errors.mobile && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.mobile.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1">
                Password (पासवर्ड)
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className={`block w-full pl-10 pr-10 py-3 text-slate-900 rounded-xl border ${
                    errors.password ? 'border-red-400 focus:ring-red-500' : 'border-slate-300 focus:ring-brand-500'
                  } focus:outline-none focus:ring-2 focus:border-transparent text-base sm:text-sm`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.password.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-semibold text-white bg-brand-700 hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? (
              <span className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Logging in...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <span>Login to Account</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>

          <div className="text-center pt-2">
            <p className="text-sm text-slate-600">
              New farmer to TractorConnect?{' '}
              <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-800 underline">
                Register here (नया खाता बनाएं)
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

