import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Tractor,
  Eye,
  EyeOff,
  Lock,
  Phone,
  User,
  Building2,
  MapPin,
  Compass,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Navigation
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isValidIndianMobile, normalizeIndianMobile } from '../../utils/formatters';

const ownerRegisterSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  mobile: z
    .string()
    .min(1, 'Mobile number is required')
    .refine((val) => isValidIndianMobile(val), {
      message: 'Enter a valid 10-digit Indian mobile number (6-9 followed by 9 digits)'
    }),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  businessName: z.string().trim().min(2, 'Business/Fleet name is required'),
  village: z.string().trim().min(2, 'Village/Town is required'),
  district: z.string().trim().min(2, 'District is required'),
  state: z.string().trim().default('Madhya Pradesh'),
  serviceRadiusKm: z.coerce.number().min(1, 'Min 1 km').max(150, 'Max 150 km').default(25),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  serviceDescription: z.string().trim().max(1000).optional()
});

const OwnerRegister = () => {
  const { registerOwner } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(ownerRegisterSchema),
    defaultValues: {
      name: '',
      mobile: '',
      password: '',
      businessName: '',
      village: '',
      district: 'Sehore',
      state: 'Madhya Pradesh',
      serviceRadiusKm: 25,
      latitude: null,
      longitude: null,
      serviceDescription: ''
    }
  });

  const radiusValue = watch('serviceRadiusKm');
  const latVal = watch('latitude');
  const lngVal = watch('longitude');

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue('latitude', Number(pos.coords.latitude.toFixed(6)));
        setValue('longitude', Number(pos.coords.longitude.toFixed(6)));
        setGpsLoading(false);
        setGpsSuccess(true);
      },
      (err) => {
        console.error(err);
        setGpsLoading(false);
        alert('Could not retrieve GPS coordinates. You can still register without them.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const onSubmit = async (data) => {
    try {
      setApiError('');
      setIsSubmitting(true);
      const normalizedMobile = normalizeIndianMobile(data.mobile);
      await registerOwner({
        ...data,
        mobile: normalizedMobile
      });

      // Redirect directly to Owner Dashboard where pending approval notice is visible
      navigate('/owner/dashboard');
    } catch (err) {
      setApiError(
        err.response?.data?.message || err.message || 'Registration failed. Please check your details.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-slate-100 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        {/* Toggle between Farmer and Owner */}
        <div className="flex bg-slate-100 p-1 rounded-xl max-w-sm mx-auto">
          <Link
            to="/register"
            className="flex-1 py-1.5 text-center text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
          >
            🌾 Farmer Register
          </Link>
          <div className="flex-1 py-1.5 text-center text-xs font-bold rounded-lg bg-white text-amber-800 shadow-xs border border-amber-200">
            🚜 Tractor Owner
          </div>
        </div>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 mb-3 border border-amber-200 text-3xl shadow-xs">
            🚜
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Tractor Owner Registration
          </h1>
          <p className="mt-1 text-xs text-slate-600 max-w-md mx-auto">
            ट्रैक्टर मालिक पंजीकरण &bull; Expand your agricultural contracting business and get bookings from nearby farmers.
          </p>
        </div>

        {apiError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-3 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          {/* Section 1: Business & Owner Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 border-b pb-1">
              1. Business & Contact Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Owner Full Name (मालिक का नाम) *
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Chandra Patidar"
                    className={`block w-full pl-10 pr-3 py-2 text-xs rounded-xl border ${
                      errors.name ? 'border-red-400' : 'border-slate-300'
                    } focus:ring-2 focus:ring-amber-500`}
                    {...register('name')}
                  />
                </div>
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Business Name (व्यवसाय / फर्म का नाम) *
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Patidar Krishi Yantra Seva"
                    className={`block w-full pl-10 pr-3 py-2 text-xs rounded-xl border ${
                      errors.businessName ? 'border-red-400' : 'border-slate-300'
                    } focus:ring-2 focus:ring-amber-500`}
                    {...register('businessName')}
                  />
                </div>
                {errors.businessName && (
                  <p className="mt-1 text-xs text-red-600">{errors.businessName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number (मोबाइल नंबर) *
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-medium text-xs">
                    +91
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9826111111"
                    className={`block w-full pl-12 pr-3 py-2 text-xs rounded-xl border ${
                      errors.mobile ? 'border-red-400' : 'border-slate-300'
                    } focus:ring-2 focus:ring-amber-500`}
                    {...register('mobile')}
                  />
                </div>
                {errors.mobile && (
                  <p className="mt-1 text-xs text-red-600">{errors.mobile.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password (पासवर्ड) *
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    className={`block w-full pl-10 pr-10 py-2 text-xs rounded-xl border ${
                      errors.password ? 'border-red-400' : 'border-slate-300'
                    } focus:ring-2 focus:ring-amber-500`}
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
          </div>

          {/* Section 2: Location & Service Area */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 border-b pb-1">
              2. Depot Location & Service Radius
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Village / Town (गाँव / कस्बा) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bilkisganj"
                  className={`block w-full px-3 py-2 text-xs rounded-xl border ${
                    errors.village ? 'border-red-400' : 'border-slate-300'
                  } focus:ring-2 focus:ring-amber-500`}
                  {...register('village')}
                />
                {errors.village && (
                  <p className="mt-1 text-xs text-red-600">{errors.village.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  District (ज़िला) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sehore"
                  className={`block w-full px-3 py-2 text-xs rounded-xl border ${
                    errors.district ? 'border-red-400' : 'border-slate-300'
                  } focus:ring-2 focus:ring-amber-500`}
                  {...register('district')}
                />
                {errors.district && (
                  <p className="mt-1 text-xs text-red-600">{errors.district.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State (राज्य)
                </label>
                <input
                  type="text"
                  className="block w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-600"
                  {...register('state')}
                />
              </div>
            </div>

            {/* Service Radius Slider */}
            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/70 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                  <Compass className="w-4 h-4 text-amber-700" />
                  <span>Service Radius (सेवा दायरा): {radiusValue || 25} km</span>
                </label>
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  Farmers within {radiusValue || 25} km can find you
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                step="5"
                className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                {...register('serviceRadiusKm')}
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>5 km (Local)</span>
                <span>25 km (Standard)</span>
                <span>50 km (Regional)</span>
                <span>80 km (Max)</span>
              </div>
            </div>

            {/* GPS Coordinates & Detection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Depot Coordinates (for precise distance calculations)</span>
                </span>
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={gpsLoading}
                  className="inline-flex items-center space-x-1 text-xs text-amber-700 font-semibold hover:text-amber-800 cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{gpsLoading ? 'Detecting GPS...' : 'Use My Current GPS'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="any"
                  placeholder="Latitude (e.g. 22.955)"
                  className="block w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:ring-amber-500"
                  {...register('latitude')}
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Longitude (e.g. 76.955)"
                  className="block w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:ring-amber-500"
                  {...register('longitude')}
                />
              </div>
              {gpsSuccess && (
                <p className="text-[11px] text-emerald-700 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>GPS coordinates saved: {latVal}, {lngVal}</span>
                </p>
              )}
            </div>

            {/* Service Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fleet & Implements Overview (उपलब्ध ट्रैक्टर एवं यंत्रों का विवरण)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. 2 Mahindra 575 tractors with double disc plough, 7-feet rotavator, seed drill, and experienced drivers."
                className="block w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                {...register('serviceDescription')}
              />
            </div>
          </div>

          {/* Verification Notice Callout */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Admin Verification Required</p>
              <p className="text-[11px] text-blue-700 mt-0.5">
                To maintain high service quality for farmers, all tractor owner profiles are verified by our platform administrator before appearing in public searches. You can still set up your tractor fleet and services immediately after registration!
              </p>
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
                <span>Register as Tractor Owner</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-600">
          Already registered?{' '}
          <Link to="/owner/login" className="font-bold text-amber-700 hover:text-amber-800">
            Log in to Owner Portal
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OwnerRegister;

