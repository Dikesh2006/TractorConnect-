import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/axios';
import {
  Wrench,
  Plus,
  Edit2,
  Trash2,
  Power,
  History,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { formatIndianCurrency, formatIndianDateTime } from '../../utils/formatters';

const CATEGORIES = [
  'Land Preparation',
  'Sowing & Planting',
  'Crop Care & Spraying',
  'Harvesting',
  'Post-Harvest & Threshing',
  'Transportation',
  'Other'
];

const PRICING_UNITS = [
  { label: 'Per Acre (प्रति एकड़)', value: 'per_acre' },
  { label: 'Per Hour (प्रति घंटा)', value: 'per_hour' },
  { label: 'Per Trip (प्रति चक्कर)', value: 'per_trip' },
  { label: 'Per Day (प्रति दिन)', value: 'per_day' }
];

const OwnerServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [priceHistory, setPriceHistory] = useState([]);
  const [historyService, setHistoryService] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'Land Preparation',
    description: '',
    currentPrice: '',
    pricingUnit: 'per_acre',
    minimumCharge: 0,
    priceChangeNote: ''
  });

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      // Scoped endpoint returns services for current logged in owner
      const res = await apiClient.get('/services/admin/all');
      if (res.data?.success) {
        setServices(res.data.data.services || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch services');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const openAddModal = () => {
    setEditingService(null);
    setFormData({
      name: '',
      category: 'Land Preparation',
      description: '',
      currentPrice: '',
      pricingUnit: 'per_acre',
      minimumCharge: 0,
      priceChangeNote: 'Initial catalog price'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      category: service.category || 'Land Preparation',
      description: service.description || '',
      currentPrice: service.currentPrice,
      pricingUnit: service.pricingUnit,
      minimumCharge: service.minimumCharge || 0,
      priceChangeNote: ''
    });
    setIsModalOpen(true);
  };

  const openHistoryModal = async (service) => {
    try {
      setHistoryService(service);
      setHistoryModalOpen(true);
      const res = await apiClient.get(`/services/${service._id}/price-history`);
      if (res.data?.success) {
        setPriceHistory(res.data.data.history || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (service) => {
    try {
      const res = await apiClient.patch(`/services/${service._id}/toggle-active`);
      if (res.data?.success) {
        setSuccess(`Service "${service.name}" ${res.data.data.service.isActive ? 'activated' : 'deactivated'}`);
        await fetchServices();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        description: formData.description.trim(),
        currentPrice: Number(formData.currentPrice),
        pricingUnit: formData.pricingUnit,
        minimumCharge: Number(formData.minimumCharge) || 0,
        priceChangeNote: formData.priceChangeNote.trim() || undefined
      };

      if (editingService) {
        await apiClient.put(`/services/${editingService._id}`, payload);
        setSuccess(`Service "${payload.name}" updated successfully!`);
      } else {
        await apiClient.post('/services', payload);
        setSuccess(`New service "${payload.name}" added to your catalog!`);
      }

      setIsModalOpen(false);
      await fetchServices();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Wrench className="w-6 h-6 text-amber-700" />
            <span>My Farming Services & Custom Pricing</span>
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Configure your independent service offerings, pricing units (per acre, per hour, per trip, per day), and minimum charges.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Service</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-500 text-xs flex justify-center">
            <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : services.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-500 text-xs border border-dashed rounded-2xl bg-white space-y-3">
            <p>You haven't listed any farming services yet.</p>
            <button
              type="button"
              onClick={openAddModal}
              className="px-4 py-2 bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              Add Your First Service
            </button>
          </div>
        ) : (
          services.map((svc) => (
            <div
              key={svc._id}
              className={`p-5 rounded-2xl border transition-all bg-white shadow-xs space-y-3 flex flex-col justify-between ${
                svc.isActive ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50'
              }`}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                    {svc.category}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      svc.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {svc.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 leading-snug">{svc.name}</h3>
                {svc.description && (
                  <p className="text-xs text-slate-500 line-clamp-2">{svc.description}</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xl font-extrabold text-slate-900">
                      {formatIndianCurrency(svc.currentPrice)}
                    </span>
                    <span className="text-xs text-slate-500 font-medium ml-1">
                      /{svc.pricingUnit.replace('per_', '')}
                    </span>
                  </div>
                  {svc.minimumCharge > 0 && (
                    <span className="text-[11px] text-slate-400">
                      Min: {formatIndianCurrency(svc.minimumCharge)}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => openHistoryModal(svc)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center space-x-1 cursor-pointer"
                  >
                    <History className="w-3 h-3" />
                    <span>Price History</span>
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(svc)}
                      title={svc.isActive ? 'Deactivate' : 'Activate'}
                      className={`p-1.5 rounded-lg text-xs cursor-pointer ${
                        svc.isActive ? 'text-amber-700 hover:bg-amber-50' : 'text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(svc)}
                      title="Edit Service & Price"
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900">
              {editingService ? 'Edit Farming Service & Price' : 'Add New Farming Service'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Service Name (सेवा का नाम) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deep Ploughing (गहरी जुताई)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-base sm:text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category (श्रेणी) *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-base sm:text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pricing Unit (इकाई) *
                  </label>
                  <select
                    value={formData.pricingUnit}
                    onChange={(e) => setFormData({ ...formData, pricingUnit: e.target.value })}
                    className="w-full px-3 py-2 text-base sm:text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                  >
                    {PRICING_UNITS.map((u) => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Price per Unit (₹ दर) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 850"
                    value={formData.currentPrice}
                    onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })}
                    className="w-full px-3 py-2 text-base sm:text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Minimum Charge (₹ न्यूनतम शुल्क)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 500"
                    value={formData.minimumCharge}
                    onChange={(e) => setFormData({ ...formData, minimumCharge: e.target.value })}
                    className="w-full px-3 py-2 text-base sm:text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Service Description (विवरण)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Done with heavy double disc MB plough for superior soil pulverization."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-base sm:text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {editingService && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Price Change Reason (मूल्य परिवर्तन का कारण)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kharif season opening revision"
                    value={formData.priceChangeNote}
                    onChange={(e) => setFormData({ ...formData, priceChangeNote: e.target.value })}
                    className="w-full px-3 py-2 text-base sm:text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs text-slate-600 font-semibold hover:bg-slate-100 rounded-xl w-full sm:w-auto text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50 w-full sm:w-auto text-center cursor-pointer min-h-[40px]"
                >
                  {submitting ? 'Saving...' : editingService ? 'Update Service' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Price History Modal */}
      {historyModalOpen && historyService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Price History for {historyService.name}
            </h3>

            {priceHistory.length === 0 ? (
              <p className="text-xs text-slate-500">No recorded price adjustments yet.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {priceHistory.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl text-xs flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900">
                        {formatIndianCurrency(item.price)} /{item.pricingUnit?.replace('per_', '')}
                      </p>
                      {item.note && (
                        <p className="text-[11px] text-slate-500 mt-0.5">Note: {item.note}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {formatIndianDateTime(item.effectiveDate || item.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="px-4 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerServices;

