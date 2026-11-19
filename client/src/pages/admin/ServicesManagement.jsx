import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wrench, Plus, Edit2, History, Check, X, AlertCircle } from 'lucide-react';
import apiClient from '../../api/axios';
import { formatINR, formatISTDate } from '../../utils/formatters';

const serviceFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  category: z.string().min(2, 'Category is required'),
  description: z.string().min(5, 'Description is required'),
  pricingUnit: z.enum(['per_acre', 'per_hour', 'per_trip', 'per_day']),
  currentPrice: z
    .number({ required_error: 'Price is required' })
    .positive('Price must be greater than zero')
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number)),
  minimumCharge: z
    .number()
    .nonnegative()
    .optional()
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number)),
  displayOrder: z.number().int().optional().or(z.string().regex(/^\d+$/).transform(Number)),
  isActive: z.boolean().optional(),
  priceChangeNote: z.string().optional()
});

const ServicesManagement = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [priceHistoryModalOpen, setPriceHistoryModalOpen] = useState(false);
  const [priceHistory, setPriceHistory] = useState([]);
  const [selectedServiceName, setSelectedServiceName] = useState('');
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(serviceFormSchema)
  });

  const fetchServices = async () => {
    try {
      const res = await apiClient.get('/services/admin/all');
      if (res.data?.success) {
        setServices(res.data.data.services || []);
      }
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleOpenAddModal = () => {
    setEditingService(null);
    reset({
      name: '',
      category: 'Land Preparation',
      description: '',
      pricingUnit: 'per_acre',
      currentPrice: 800,
      minimumCharge: 500,
      displayOrder: 1,
      isActive: true,
      priceChangeNote: 'Initial rate'
    });
    setApiError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (service) => {
    setEditingService(service);
    reset({
      name: service.name,
      category: service.category,
      description: service.description,
      pricingUnit: service.pricingUnit,
      currentPrice: service.currentPrice,
      minimumCharge: service.minimumCharge,
      displayOrder: service.displayOrder,
      isActive: service.isActive,
      priceChangeNote: ''
    });
    setApiError('');
    setModalOpen(true);
  };

  const handleToggleStatus = async (serviceId, currentStatus) => {
    try {
      await apiClient.patch(`/services/${serviceId}/status`, {
        isActive: !currentStatus
      });
      fetchServices();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update service status');
    }
  };

  const handleViewPriceHistory = async (service) => {
    try {
      setSelectedServiceName(service.name);
      const res = await apiClient.get(`/services/${service._id}/price-history`);
      if (res.data?.success) {
        setPriceHistory(res.data.data.history || []);
        setPriceHistoryModalOpen(true);
      }
    } catch (err) {
      alert('Failed to load price history');
    }
  };

  const onSubmit = async (data) => {
    try {
      setApiError('');
      if (editingService) {
        await apiClient.put(`/services/${editingService._id}`, data);
      } else {
        await apiClient.post('/services', data);
      }
      setModalOpen(false);
      fetchServices();
    } catch (err) {
      setApiError(err.response?.data?.message || err.message || 'Operation failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dynamic Farming Services</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Add or edit farming implements and pricing. New services immediately become available on the customer booking portal.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Service (नई सेवा जोड़ें)</span>
        </button>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="table-responsive-wrapper">
          <table className="w-full text-xs text-left min-w-[620px]">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Service Name & Category</th>
                <th className="py-3 px-4">Pricing Unit</th>
                <th className="py-3 px-4">Current Price</th>
                <th className="py-3 px-4">Min. Charge</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {services.map((s) => (
                <tr key={s._id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{s.name}</span>
                    <span className="text-[11px] text-slate-500">{s.category}</span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700 capitalize">
                    {s.pricingUnit.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-4 font-extrabold text-slate-900 text-sm">
                    {formatINR(s.currentPrice)}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {s.minimumCharge > 0 ? formatINR(s.minimumCharge) : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleStatus(s._id, s.isActive)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        s.isActive
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {s.isActive ? 'Active' : 'Inactive (Hidden)'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleViewPriceHistory(s)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center"
                      title="View Price History"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(s)}
                      className="p-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 inline-flex items-center"
                      title="Edit Service"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-xl my-8">
            <h3 className="text-lg font-bold text-slate-900">
              {editingService ? `Edit Service: ${editingService.name}` : 'Add New Farming Service'}
            </h3>

            {apiError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Laser Land Leveling (लेवलर)"
                  {...register('name')}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
                />
                {errors.name && <p className="text-[11px] text-red-600 mt-0.5">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Land Preparation"
                    {...register('category')}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  />
                  {errors.category && <p className="text-[11px] text-red-600 mt-0.5">{errors.category.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pricing Unit *
                  </label>
                  <select
                    {...register('pricingUnit')}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value="per_acre">per_acre (प्रति एकड़)</option>
                    <option value="per_hour">per_hour (प्रति घंटा)</option>
                    <option value="per_trip">per_trip (प्रति चक्कर)</option>
                    <option value="per_day">per_day (प्रति दिन)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('currentPrice')}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  />
                  {errors.currentPrice && <p className="text-[11px] text-red-600 mt-0.5">{errors.currentPrice.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Minimum Charge (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('minimumCharge')}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description *
                </label>
                <textarea
                  rows={2}
                  {...register('description')}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
                />
                {errors.description && <p className="text-[11px] text-red-600 mt-0.5">{errors.description.message}</p>}
              </div>

              {editingService && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reason for Price Change (Logged in Price History)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Diesel rate hike, seasonal adjustment"
                    {...register('priceChangeNote')}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 rounded-xl shadow-xs"
                >
                  {isSubmitting ? 'Saving...' : 'Save Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Price History Drawer */}
      {priceHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">Price Change History</h3>
                <p className="text-xs text-slate-500">{selectedServiceName}</p>
              </div>
              <button
                onClick={() => setPriceHistoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-3 pt-2">
              {priceHistory.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{formatINR(item.price)} / {item.pricingUnit}</span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      {formatISTDate(item.effectiveFrom)}
                    </span>
                  </div>
                  {item.note && <p className="text-slate-600 italic text-[11px]">&ldquo;{item.note}&rdquo;</p>}
                  {item.changedBy && (
                    <span className="text-[10px] text-slate-400 block">
                      Changed by: {item.changedBy.name}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesManagement;

