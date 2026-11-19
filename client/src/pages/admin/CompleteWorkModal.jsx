import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, AlertCircle, X, Calculator } from 'lucide-react';
import apiClient from '../../api/axios';
import { formatINR } from '../../utils/formatters';

const completeSchema = z.object({
  actualQuantity: z
    .number({ required_error: 'Actual quantity is required' })
    .positive('Must be greater than zero')
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number)),
  actualAcres: z.number().optional().or(z.string().transform(Number)),
  workingHours: z.number().optional().or(z.string().transform(Number)),
  dieselUsedLiters: z.number().optional().or(z.string().transform(Number)),
  discount: z.number().optional().or(z.string().transform(Number)),
  discountReason: z.string().optional(),
  extraCharges: z.number().optional().or(z.string().transform(Number)),
  extraChargesReason: z.string().optional(),
  completionNotes: z.string().optional()
});

const CompleteWorkModal = ({ booking, onClose, onSuccess }) => {
  const [apiError, setApiError] = useState('');

  const defaultQty = booking.estimatedQuantity || 4;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(completeSchema),
    defaultValues: {
      actualQuantity: defaultQty,
      actualAcres: booking.serviceSnapshot.pricingUnit === 'per_acre' ? defaultQty : 0,
      workingHours: 4,
      dieselUsedLiters: 15,
      discount: 0,
      discountReason: '',
      extraCharges: 0,
      extraChargesReason: '',
      completionNotes: ''
    }
  });

  const watchedQty = parseFloat(watch('actualQuantity') || 0);
  const watchedDiscount = parseFloat(watch('discount') || 0);
  const watchedExtra = parseFloat(watch('extraCharges') || 0);

  // Live calculation based on snapshot
  const unitPrice = booking.serviceSnapshot.unitPrice;
  const minCharge = booking.serviceSnapshot.minimumCharge || 0;
  const rawCharge = unitPrice * watchedQty;
  const finalCharge = Math.max(rawCharge, minCharge);
  const totalAmount = Math.max(0, finalCharge - watchedDiscount + watchedExtra);

  const onSubmit = async (data) => {
    try {
      setApiError('');
      await apiClient.post(`/work-records/complete/${booking._id}`, data);
      onSuccess();
    } catch (err) {
      setApiError(err.response?.data?.message || err.message || 'Failed to complete work');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-4 sm:p-6 lg:p-8 max-w-lg w-full space-y-4 shadow-xl my-4 sm:my-8 max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-start gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              Complete Field Work & Generate Bill
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Customer: <strong>{booking.customer?.name}</strong> &bull; Service: {booking.service?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {apiError && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Snapshot reminder */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex justify-between items-center">
          <span>Booking Unit Price Snapshot:</span>
          <strong className="text-slate-900">{formatINR(unitPrice)} / {booking.serviceSnapshot.pricingUnit}</strong>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Actual Quantity ({booking.serviceSnapshot.pricingUnit}) *
              </label>
              <input
                type="number"
                step="0.1"
                {...register('actualQuantity')}
                className="w-full p-2.5 text-base sm:text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500"
              />
              {errors.actualQuantity && <p className="text-[11px] text-red-600">{errors.actualQuantity.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Actual Acres (for reporting)
              </label>
              <input
                type="number"
                step="0.1"
                {...register('actualAcres')}
                className="w-full p-2.5 text-base sm:text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Working Hours
              </label>
              <input
                type="number"
                step="0.5"
                {...register('workingHours')}
                className="w-full p-2.5 text-base sm:text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Diesel Used (Liters)
              </label>
              <input
                type="number"
                step="1"
                {...register('dieselUsedLiters')}
                className="w-full p-2.5 text-base sm:text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Discount & Extra Charges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Discount (₹)
              </label>
              <input
                type="number"
                step="1"
                {...register('discount')}
                className="w-full p-2.5 text-base sm:text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Discount Reason
              </label>
              <input
                type="text"
                placeholder="e.g. Loyal customer"
                {...register('discountReason')}
                className="w-full p-2.5 text-base sm:text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Extra Charges (₹)
              </label>
              <input
                type="number"
                step="1"
                {...register('extraCharges')}
                className="w-full p-2.5 text-base sm:text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Extra Reason
              </label>
              <input
                type="text"
                placeholder="e.g. Rocky field clods"
                {...register('extraChargesReason')}
                className="w-full p-2.5 text-base sm:text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Field Completion Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Work inspected by farmer Ramesh; fine seedbed prepared"
              {...register('completionNotes')}
              className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Real-time Calculation Summary */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Base Charge ({watchedQty} &times; {formatINR(unitPrice)}):</span>
              <span>{formatINR(finalCharge)}</span>
            </div>
            {watchedDiscount > 0 && (
              <div className="flex justify-between text-xs text-red-400">
                <span>Discount:</span>
                <span>-{formatINR(watchedDiscount)}</span>
              </div>
            )}
            {watchedExtra > 0 && (
              <div className="flex justify-between text-xs text-emerald-400">
                <span>Extra Charges:</span>
                <span>+{formatINR(watchedExtra)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold pt-2 border-t border-slate-800">
              <span>Total Bill Payable:</span>
              <span className="text-harvest-400">{formatINR(totalAmount)}</span>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
            >
              {isSubmitting ? 'Generating...' : 'Complete & Generate Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteWorkModal;

