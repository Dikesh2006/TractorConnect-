import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/axios';
import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Clock,
  Phone,
  UserCheck
} from 'lucide-react';

const STATUS_OPTIONS = [
  { label: 'Available (उपलब्ध)', value: 'available', color: 'bg-emerald-100 text-emerald-800' },
  { label: 'In Use / Working (कार्यरत)', value: 'in_use', color: 'bg-blue-100 text-blue-800' },
  { label: 'Maintenance / Servicing (मरम्मत)', value: 'maintenance', color: 'bg-amber-100 text-amber-800' },
  { label: 'Inactive (निष्क्रिय)', value: 'inactive', color: 'bg-slate-100 text-slate-700' }
];

const OwnerTractors = () => {
  const [tractors, setTractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTractor, setEditingTractor] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    registrationNumber: '',
    model: '',
    horsepower: '',
    status: 'available',
    currentOperatorName: '',
    notes: ''
  });

  const fetchTractors = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get('/tractors');
      if (res.data?.success) {
        setTractors(res.data.data.tractors || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load tractors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTractors();
  }, [fetchTractors]);

  const openAddModal = () => {
    setEditingTractor(null);
    setFormData({
      name: '',
      registrationNumber: '',
      model: '',
      horsepower: '',
      status: 'available',
      currentOperatorName: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (tractor) => {
    setEditingTractor(tractor);
    setFormData({
      name: tractor.name,
      registrationNumber: tractor.registrationNumber,
      model: tractor.model,
      horsepower: tractor.horsepower,
      status: tractor.status,
      currentOperatorName: tractor.currentOperatorName || '',
      notes: tractor.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const payload = {
        name: formData.name.trim(),
        registrationNumber: formData.registrationNumber.trim().toUpperCase(),
        model: formData.model.trim(),
        horsepower: Number(formData.horsepower),
        status: formData.status,
        currentOperatorName: formData.currentOperatorName.trim() || undefined,
        notes: formData.notes.trim() || undefined
      };

      if (editingTractor) {
        await apiClient.put(`/tractors/${editingTractor._id}`, payload);
        setSuccess(`Tractor "${payload.name}" updated successfully!`);
      } else {
        await apiClient.post('/tractors', payload);
        setSuccess(`Tractor "${payload.name}" added to your fleet!`);
      }

      setIsModalOpen(false);
      await fetchTractors();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (tractorId, newStatus) => {
    try {
      await apiClient.patch(`/tractors/${tractorId}/status`, { status: newStatus });
      setSuccess('Tractor availability status updated!');
      await fetchTractors();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Truck className="w-6 h-6 text-amber-700" />
            <span>My Tractor Fleet & Availability</span>
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Manage your machines, operators, horsepower specs, and live working/maintenance statuses.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Tractor</span>
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

      {/* Fleet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-500 text-xs flex justify-center">
            <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : tractors.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-500 text-xs border border-dashed rounded-2xl bg-white space-y-3">
            <p>No tractors registered in your fleet yet.</p>
            <button
              type="button"
              onClick={openAddModal}
              className="px-4 py-2 bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              Add Your First Tractor
            </button>
          </div>
        ) : (
          tractors.map((t) => {
            const statusConfig = STATUS_OPTIONS.find((s) => s.value === t.status) || STATUS_OPTIONS[0];
            return (
              <div
                key={t._id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {t.registrationNumber}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${statusConfig.color}`}>
                      {t.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-slate-900">{t.name}</h3>
                    <p className="text-xs text-slate-500">
                      Model: <span className="font-semibold text-slate-700">{t.model}</span> &bull; {t.horsepower} HP
                    </p>
                  </div>

                  {t.currentOperatorName && (
                    <div className="p-2 bg-slate-50 rounded-xl flex items-center space-x-2 text-xs text-slate-700">
                      <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                      <span>Operator: <span className="font-semibold">{t.currentOperatorName}</span></span>
                    </div>
                  )}

                  {t.notes && (
                    <p className="text-[11px] text-slate-400 italic">"{t.notes}"</p>
                  )}
                </div>

                {/* Status Switcher & Edit Actions */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">Availability:</span>
                    <select
                      value={t.status}
                      onChange={(e) => handleQuickStatusChange(t._id, e.target.value)}
                      className="text-xs font-semibold rounded-lg border border-slate-300 px-2 py-1 bg-white focus:ring-amber-500 cursor-pointer"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(t)}
                      className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center space-x-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit Details</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingTractor ? 'Edit Tractor Details' : 'Add New Tractor to Fleet'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tractor Display Name (ट्रैक्टर का नाम) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mahindra 575 DI (लाल ट्रैक्टर)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-base sm:text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Model (मॉडल) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 575 DI"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 text-base sm:text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registration No (नंबर) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MP-04-TC-8899"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    className="w-full px-3 py-2 text-base sm:text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Horsepower (HP / अश्वशक्ति) *
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="150"
                    required
                    placeholder="e.g. 45"
                    value={formData.horsepower}
                    onChange={(e) => setFormData({ ...formData, horsepower: e.target.value })}
                    className="w-full px-3 py-2 text-base sm:text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Status (स्थिति)
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 text-base sm:text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Operator Name (चालक का नाम)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mukesh Yadav"
                  value={formData.currentOperatorName}
                  onChange={(e) => setFormData({ ...formData, currentOperatorName: e.target.value })}
                  className="w-full px-3 py-2 text-base sm:text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes (टिप्पणी)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Equipped with high-torque gearbox for heavy rotavation"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-base sm:text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                />
              </div>

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
                  {submitting ? 'Saving...' : editingTractor ? 'Update Tractor' : 'Save Tractor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerTractors;

