import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Clock, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import apiClient from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import FieldLocationPicker from '../../components/FieldLocationPicker';
import { formatINR } from '../../utils/formatters';

const bookingFormSchema = z.object({
  serviceId: z.string().min(1, 'Please select a farming service'),
  estimatedQuantity: z
    .number({ required_error: 'Please enter acres or hours' })
    .positive('Quantity must be greater than zero')
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid number').transform(Number)),
  requestedDate: z.string().min(1, 'Please choose a date for work'),
  requestedTimeSlot: z.enum(['morning', 'afternoon', 'evening', 'full_day']),
  cropType: z.string().optional(),
  customerNotes: z.string().max(500).optional(),
  fieldLocation: z.object({
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    village: z.string().min(2, 'Village is required'),
    tehsil: z.string().optional(),
    district: z.string().min(2, 'District is required'),
    state: z.string().default('Madhya Pradesh'),
    pincode: z.string().optional(),
    fullAddress: z.string().optional(),
    landmark: z.string().optional()
  })
});

const NewBooking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const preselectedId = location.state?.preselectedServiceId || '';
  const preselectedOwner = location.state?.preselectedOwner || null;
  const preselectedOwnerId = location.state?.preselectedOwnerId || preselectedOwner?._id || '';

  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedOwner, setSelectedOwner] = useState(preselectedOwner);
  const [loadingServices, setLoadingServices] = useState(true);
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tomorrow's date formatted as YYYY-MM-DD
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      serviceId: preselectedId,
      estimatedQuantity: 4,
      requestedDate: defaultDate,
      requestedTimeSlot: 'morning',
      cropType: 'Wheat (गेहूँ)',
      customerNotes: '',
      fieldLocation: {
        latitude: 23.1989,
        longitude: 77.0845,
        village: user?.village || 'Bilkisganj',
        tehsil: 'Sehore',
        district: user?.district || 'Sehore',
        state: user?.state || 'Madhya Pradesh',
        pincode: '',
        fullAddress: user?.address || '',
        landmark: ''
      }
    }
  });

  const watchedServiceId = watch('serviceId');
  const watchedQuantity = watch('estimatedQuantity');

  // Fetch active services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await apiClient.get('/services');
        if (res.data?.success) {
          const fetched = res.data.data.services || [];
          setServices(fetched);

          if (preselectedId) {
            const match = fetched.find((s) => s._id === preselectedId);
            if (match) {
              setSelectedService(match);
              setValue('serviceId', match._id);
            }
          } else if (fetched.length > 0) {
            setSelectedService(fetched[0]);
            setValue('serviceId', fetched[0]._id);
          }
        }
      } catch (err) {
        setApiError('Failed to load farming services from server.');
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, [preselectedId, setValue]);

  // Update selected service state when dropdown changes
  useEffect(() => {
    if (watchedServiceId && services.length > 0) {
      const match = services.find((s) => s._id === watchedServiceId);
      if (match) setSelectedService(match);
    }
  }, [watchedServiceId, services]);

  // Dynamic cost calculation preview
  const calculateCostPreview = () => {
    if (!selectedService) return { rawCost: 0, finalCost: 0, minApplied: false };
    const qty = parseFloat(watchedQuantity || 0);
    const rawCost = selectedService.currentPrice * qty;
    const minCharge = selectedService.minimumCharge || 0;
    const finalCost = Math.max(rawCost, minCharge);
    return {
      rawCost,
      finalCost,
      minApplied: minCharge > rawCost
    };
  };

  const { finalCost, minApplied } = calculateCostPreview();

  const onSubmit = async (data) => {
    try {
      setApiError('');
      setIsSubmitting(true);
      const targetOwnerId = preselectedOwnerId || selectedOwner?._id || selectedService?.owner;
      const payload = {
        ...data,
        ownerId: targetOwnerId || undefined
      };
      const res = await apiClient.post('/bookings', payload);
      if (res.data?.success) {
        const newBookingId = res.data.data.booking._id;
        navigate(`/customer/bookings/${newBookingId}`, { replace: true });
      }
    } catch (err) {
      setApiError(err.response?.data?.message || err.message || 'Failed to submit booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <span className="text-xs font-bold text-brand-700 uppercase tracking-wider block">
          Book Online (ट्रैक्टर बुकिंग)
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          Request Tractor & Farming Service
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Select implement, estimate your field acres, pinpoint location on map, and our operator will arrive on schedule.
        </p>
      </div>

      {apiError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Contractor Selection Status & Discovery Link */}
      <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2.5 text-amber-900">
          <span className="text-xl">🚜</span>
          <div>
            <span className="font-bold block">
              {selectedOwner ? `Contractor: ${selectedOwner.businessName}` : 'Booking with Local Verified Contractor'}
            </span>
            <span className="text-[11px] text-amber-800">
              {selectedOwner ? `Depot: ${selectedOwner.village}, ${selectedOwner.district}` : 'Services provided by local approved fleet operators'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/customer/find-tractors')}
          className="px-3 py-1.5 bg-white border border-amber-300 text-amber-800 font-bold rounded-xl hover:bg-amber-100 transition-colors cursor-pointer self-start sm:self-auto"
        >
          🔍 Browse & Compare Nearby Contractors
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
        {/* Step 1: Select Service */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-800 text-xs flex items-center justify-center font-bold">1</span>
            <span>Select Farming Service (सेवा चुनें) *</span>
          </h2>

          {loadingServices ? (
            <div className="h-10 bg-slate-100 rounded-xl animate-pulse"></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <select
                  {...register('serviceId')}
                  className="block w-full px-4 py-3 bg-white text-slate-900 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 text-sm font-medium"
                >
                  {services.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} — {formatINR(s.currentPrice)} / {s.pricingUnit.replace('_', ' ')}
                    </option>
                  ))}
                </select>
                {errors.serviceId && (
                  <p className="mt-1 text-xs text-red-600">{errors.serviceId.message}</p>
                )}
              </div>

              {selectedService && (
                <div className="sm:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">{selectedService.name}</p>
                  <p>{selectedService.description}</p>
                  <p className="text-brand-800 font-bold pt-1">
                    Rate: {formatINR(selectedService.currentPrice)} / {selectedService.pricingUnit}
                    {selectedService.minimumCharge > 0 && ` (Minimum billing: ${formatINR(selectedService.minimumCharge)})`}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Quantity & Schedule */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-800 text-xs flex items-center justify-center font-bold">2</span>
            <span>Estimated Field Area & Work Schedule (मात्रा एवं तारीख) *</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Quantity */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estimated {selectedService?.pricingUnit === 'per_acre' ? 'Acres (एकड़)' : 'Hours / Units'} *
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="100"
                {...register('estimatedQuantity')}
                className="block w-full px-4 py-2.5 text-slate-900 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 text-sm"
              />
              {errors.estimatedQuantity && (
                <p className="mt-1 text-xs text-red-600">{errors.estimatedQuantity.message}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Date (तारीख) *
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                {...register('requestedDate')}
                className="block w-full px-4 py-2.5 text-slate-900 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 text-sm"
              />
              {errors.requestedDate && (
                <p className="mt-1 text-xs text-red-600">{errors.requestedDate.message}</p>
              )}
            </div>

            {/* Time Slot */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Time Slot (समय) *
              </label>
              <select
                {...register('requestedTimeSlot')}
                className="block w-full px-4 py-2.5 text-slate-900 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 text-sm"
              >
                <option value="morning">Morning (सुबह: 7 AM - 12 PM)</option>
                <option value="afternoon">Afternoon (दोपहर: 12 PM - 4 PM)</option>
                <option value="evening">Evening (शाम: 4 PM - 7 PM)</option>
                <option value="full_day">Full Day (पूरा दिन)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Crop Type (फसल का प्रकार - Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Wheat (गेहूँ), Soybean, Gram (चना)"
                {...register('cropType')}
                className="block w-full px-4 py-2 text-slate-900 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Driver Instructions / Notes (निर्देश)
              </label>
              <input
                type="text"
                placeholder="e.g. Enter from west canal path"
                {...register('customerNotes')}
                className="block w-full px-4 py-2 text-slate-900 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Interactive Field Map Location */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-800 text-xs flex items-center justify-center font-bold">3</span>
            <span>Pin Field Location on Map (खेत का स्थान) *</span>
          </h2>
          <p className="text-xs text-slate-500">
            Click on your farm on the map or use your mobile GPS so the tractor driver arrives directly at your boundary.
          </p>

          <Controller
            control={control}
            name="fieldLocation"
            render={({ field }) => (
              <FieldLocationPicker
                value={field.value}
                onChange={field.onChange}
                errors={errors.fieldLocation}
              />
            )}
          />
        </div>

        {/* Step 4: Transparent Cost Estimate & Submission */}
        <div className="bg-brand-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-800 pb-4">
            <div>
              <span className="text-xs text-brand-200 font-bold uppercase tracking-wider block">
                Estimated Total (अनुमानित लागत)
              </span>
              <div className="text-3xl font-extrabold mt-1">
                {formatINR(finalCost)}
              </div>
              <p className="text-xs text-brand-200 mt-0.5">
                Calculated as {watchedQuantity || 0} {selectedService?.pricingUnit} &times; {formatINR(selectedService?.currentPrice || 0)}
                {minApplied && ' (Minimum charge rule applied)'}
              </p>
            </div>

            <div className="text-left sm:text-right text-xs text-brand-200 space-y-1">
              <p className="flex items-center space-x-1.5 sm:justify-end">
                <ShieldCheck className="w-4 h-4 text-harvest-400" />
                <span>Pay only after work is completed</span>
              </p>
              <p>Free cancellation until tractor dispatches</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-2xl bg-harvest-500 hover:bg-harvest-600 text-slate-950 font-extrabold text-base shadow-lg transition-all disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <span>Submitting Booking Request...</span>
            ) : (
              <>
                <span>Confirm & Submit Booking Request (बुकिंग भेजें)</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewBooking;

