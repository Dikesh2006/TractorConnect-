import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Receipt, Plus, Trash2, Edit2, AlertCircle } from 'lucide-react';
import apiClient from '../../api/axios';
import { formatINR, formatISTDate } from '../../utils/formatters';

const expenseSchema = z.object({
  category: z.enum(['diesel', 'maintenance', 'repair', 'spare_parts', 'labour', 'insurance', 'other']),
  amount: z
    .number({ required_error: 'Amount is required' })
    .positive('Must be greater than zero')
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number)),
  description: z.string().min(2, 'Description is required'),
  tractorId: z.string().optional(),
  vendor: z.string().optional(),
  paymentMethod: z.enum(['cash', 'upi', 'bank_transfer', 'other']),
  receiptNote: z.string().optional()
});

const ExpensesManagement = () => {
  const [expenses, setExpenses] = useState([]);
  const [tractors, setTractors] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(expenseSchema)
  });

  const fetchData = async () => {
    try {
      let url = `/expenses?limit=50`;
      if (categoryFilter) url += `&category=${categoryFilter}`;

      const [expRes, tractorRes] = await Promise.all([
        apiClient.get(url),
        apiClient.get('/tractors')
      ]);

      if (expRes.data?.success) {
        setExpenses(expRes.data.data.expenses || []);
        setTotalAmount(expRes.data.data.totalExpensesAmount || 0);
      }
      if (tractorRes.data?.success) {
        setTractors(tractorRes.data.data.tractors || []);
      }
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [categoryFilter]);

  const handleOpenAdd = () => {
    setEditingExpense(null);
    reset({
      category: 'diesel',
      amount: '',
      description: '',
      tractorId: tractors[0]?._id || '',
      vendor: '',
      paymentMethod: 'cash',
      receiptNote: ''
    });
    setApiError('');
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await apiClient.delete(`/expenses/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete expense');
    }
  };

  const onSubmit = async (data) => {
    try {
      setApiError('');
      if (editingExpense) {
        await apiClient.put(`/expenses/${editingExpense._id}`, data);
      } else {
        await apiClient.post('/expenses', data);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      setApiError(err.response?.data?.message || err.message || 'Operation failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tractor Operational Expenses</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log fuel (diesel), machine maintenance, repairs, spare parts, and driver wages for accurate net profit accounting.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Log Expense (खर्च दर्ज करें)</span>
        </button>
      </div>

      {/* Summary Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {['', 'diesel', 'maintenance', 'repair', 'spare_parts', 'labour', 'insurance', 'other'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat ? cat.replace('_', ' ') : 'All Categories'}
            </button>
          ))}
        </div>

        <div className="text-right">
          <span className="text-[11px] text-slate-500 block">Total Filtered Expenses:</span>
          <span className="text-xl font-extrabold text-red-600">{formatINR(totalAmount)}</span>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Tractor Affected</th>
                <th className="py-3 px-4">Vendor / Person</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map((e) => (
                <tr key={e._id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 text-slate-700">{formatISTDate(e.date, false)}</td>
                  <td className="py-3 px-4">
                    <span className="capitalize font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {e.category.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900 max-w-xs">{e.description}</td>
                  <td className="py-3 px-4 text-slate-600">{e.tractor ? e.tractor.name : 'General Farm'}</td>
                  <td className="py-3 px-4 text-slate-600">{e.vendor || '—'}</td>
                  <td className="py-3 px-4 font-extrabold text-red-600 text-sm">
                    {formatINR(e.amount)}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button
                      onClick={() => handleDelete(e._id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 inline-flex"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">
              {editingExpense ? 'Edit Expense' : 'Log Operating Expense'}
            </h3>

            {apiError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 text-xs" noValidate>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    {...register('category')}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="diesel">Diesel / Fuel (डीजल)</option>
                    <option value="maintenance">Maintenance / Oil (सर्विस)</option>
                    <option value="repair">Repairs / Welding (मरम्मत)</option>
                    <option value="spare_parts">Spare Parts (पार्ट्स)</option>
                    <option value="labour">Driver Labour (मजदूरी)</option>
                    <option value="insurance">Insurance (बीमा)</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    placeholder="e.g. 2500"
                    {...register('amount')}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500"
                  />
                  {errors.amount && <p className="text-[11px] text-red-600 mt-0.5">{errors.amount.message}</p>}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description *</label>
                <input
                  type="text"
                  placeholder="e.g. 30 Liters diesel at Indian Oil pump"
                  {...register('description')}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500"
                />
                {errors.description && <p className="text-[11px] text-red-600 mt-0.5">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tractor (Optional)</label>
                  <select
                    {...register('tractorId')}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  >
                    <option value="">-- General Fleet --</option>
                    {tractors.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    {...register('paymentMethod')}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  >
                    <option value="cash">Cash (नकद)</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vendor / Fuel Pump Name</label>
                <input
                  type="text"
                  placeholder="e.g. Kisan Oil Agency Sehore"
                  {...register('vendor')}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
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
                  {isSubmitting ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesManagement;

