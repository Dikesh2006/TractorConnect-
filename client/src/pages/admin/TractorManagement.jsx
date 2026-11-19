import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Truck, Plus, Edit2, Calendar, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import apiClient from '../../api/axios';
import { formatISTDate } from '../../utils/formatters';

const tractorSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  registrationNumber: z.string().min(4, 'Registration number is required').toUpperCase(),
  model: z.string().min(2, 'Model is required'),
  horsepower: z
    .number({ required_error: 'Horsepower is required' })
    .min(15)
    .max(150)
    .or(z.string().regex(/^\d+$/).transform(Number)),
  status: z.enum(['available', 'in_use', 'maintenance', 'inactive']),
  currentOperatorName: z.string().optional(),
  notes: z.string().optional()
});

const TractorManagement = () => {
  const [tractors, setTractors] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [activeTab, setActiveTab] = useState('fleet'); // 'fleet' | 'schedule'
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTractor, setEditingTractor] = useState(null);
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(tractorSchema)
  });

  const fetchData = async () => {
    try {
      const [tractorRes, scheduleRes] = await Promise.all([
        apiClient.get('/tractors'),
        apiClient.get('/tractors/schedule')
      ]);

      if (tractorRes.data?.success) setTractors(tractorRes.data.data.tractors || []);
      if (scheduleRes.data?.success) setSchedule(scheduleRes.data.data.schedule || []);
    } catch (err) {
      console.error('Failed to load tractors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingTractor(null);
    reset({
      name: '',
      registrationNumber: '',
      model: '',
      horsepower: 48,
      status: 'available',
      currentOperatorName: '',
      notes: ''
    });
    setApiError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTractor(t);
    reset({
      name: t.name,
      registrationNumber: t.registrationNumber,
      model: t.model,
      horsepower: t.horsepower,
      status: t.status,
      currentOperatorName: t.currentOperatorName,
      notes: t.notes
    });
    setApiError('');
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      setApiError('');
      if (editingTractor) {
        await apiClient.put(`/tractors/${editingTractor._id}`, data);
      } else {
        await apiClient.post('/tractors', data);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      setApiError(err.response?.data?.message || err.message || 'Operation failed');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">Available (खाली)</span>;
      case 'in_use':
        return <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">In Use (खेत पर)</span>;
      case 'maintenance':
        return <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">Maintenance (सर्विस)</span>;
      case 'inactive':
        return <span className="bg-slate-200 text-slate-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full">Inactive</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tractor Fleet & Availability</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your family tractor fleet, check real-time availability, and view dispatch calendars.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Tractor (नया ट्रैक्टर जोड़ें)</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-4">
        <button
          onClick={() => setActiveTab('fleet')}
          className={`pb-3 px-2 text-xs font-bold border-b-2 flex items-center space-x-2 ${
            activeTab === 'fleet'
              ? 'border-brand-700 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Fleet Overview ({tractors.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`pb-3 px-2 text-xs font-bold border-b-2 flex items-center space-x-2 ${
            activeTab === 'schedule'
              ? 'border-brand-700 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Dispatch Schedule Calendar</span>
        </button>
      </div>

      {activeTab === 'fleet' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="table-responsive-wrapper">
            <table className="w-full text-xs text-left min-w-[650px]">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Tractor Name & Reg No.</th>
                  <th className="py-3 px-4">Model & Horsepower</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Regular Operator</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tractors.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {t.name}
                      <span className="text-[11px] text-slate-400 font-mono block">
                        {t.registrationNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {t.model} &bull; {t.horsepower} HP
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(t.status)}</td>
                    <td className="py-3 px-4 text-slate-800">
                      {t.currentOperatorName || 'Field Driver'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {t.notes || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(t)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center"
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
      )}

      {activeTab === 'schedule' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">Assigned Dispatch Calendar</h2>
          <p className="text-xs text-slate-500">
            Chronological view of tractor commitments. Double bookings are blocked automatically by system overlap checks.
          </p>

          {schedule.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center italic">No scheduled assignments in this window.</p>
          ) : (
            <div className="space-y-3">
              {schedule.map((item) => (
                <div
                  key={item._id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <strong className="text-slate-900 font-bold">{item.assignedTractor?.name}</strong>
                      <span className="text-[10px] font-mono bg-slate-200 px-1.5 py-0.5 rounded">
                        {item.assignedTractor?.registrationNumber}
                      </span>
                      <span className="text-slate-400">&rarr;</span>
                      <span className="font-semibold text-brand-800">{item.service?.name}</span>
                    </div>
                    <p className="text-slate-500">
                      Farmer: <strong>{item.customer?.name}</strong> &bull; Village: {item.customer?.village}
                    </p>
                  </div>

                  <div className="text-left sm:text-right font-medium text-slate-700">
                    <div>{formatISTDate(item.scheduledStart)}</div>
                    <span className="text-[11px] text-slate-400">to {formatISTDate(item.scheduledEnd)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Tractor Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">
              {editingTractor ? 'Edit Tractor Details' : 'Add New Fleet Tractor'}
            </h3>

            {apiError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 text-xs" noValidate>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tractor Name / Label *</label>
                <input
                  type="text"
                  placeholder="e.g. Swaraj 744 FE"
                  {...register('name')}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500"
                />
                {errors.name && <p className="text-[11px] text-red-600 mt-0.5">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Registration No. *</label>
                  <input
                    type="text"
                    placeholder="e.g. MP-04-AB-1234"
                    {...register('registrationNumber')}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500 uppercase"
                  />
                  {errors.registrationNumber && <p className="text-[11px] text-red-600 mt-0.5">{errors.registrationNumber.message}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Horsepower (HP) *</label>
                  <input
                    type="number"
                    min="15"
                    max="150"
                    {...register('horsepower')}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Model *</label>
                  <input
                    type="text"
                    placeholder="e.g. 744 FE"
                    {...register('model')}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status *</label>
                  <select
                    {...register('status')}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="available">available (उपलब्ध)</option>
                    <option value="in_use">in_use (खेत पर)</option>
                    <option value="maintenance">maintenance (सर्विस)</option>
                    <option value="inactive">inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Regular Driver / Operator Name</label>
                <input
                  type="text"
                  placeholder="e.g. Raju Dhakad"
                  {...register('currentOperatorName')}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. High torque, best suited for heavy rotavator"
                  {...register('notes')}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 font-bold text-white bg-brand-700 hover:bg-brand-800 rounded-xl shadow-xs"
                >
                  {isSubmitting ? 'Saving...' : 'Save Tractor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TractorManagement;

