import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/axios';
import {
  Receipt,
  Plus,
  Trash2,
  Fuel,
  Wrench,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Truck
} from 'lucide-react';
import { formatIndianCurrency, formatIndianDateTime } from '../../utils/formatters';

const EXPENSE_CATEGORIES = [
  { label: 'Diesel / Fuel (डीजल)', value: 'diesel' },
  { label: 'Tractor Repair & Maintenance (मरम्मत)', value: 'maintenance' },
  { label: 'Spare Parts & Implements (स्पेयर पार्ट्स)', value: 'parts' },
  { label: 'Driver / Operator Wages (चालक मज़दूरी)', value: 'operator_wages' },
  { label: 'Oil & Lubricants (मोबिल / ग्रीस)', value: 'oil_lubricants' },
  { label: 'Tractor Insurance / Taxes', value: 'insurance' },
  { label: 'Other Farm Expense', value: 'other' }
];

const OwnerExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [tractors, setTractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    category: 'diesel',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    tractorId: '',
    dieselLiters: '',
    description: '',
    vendorName: '',
    billInvoiceNumber: ''
  });

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (categoryFilter) params.category = categoryFilter;

      const [eRes, tRes] = await Promise.all([
        apiClient.get('/expenses', { params }),
        apiClient.get('/tractors')
      ]);

      if (eRes.data?.success) {
        setExpenses(eRes.data.data.expenses || []);
      }
      if (tRes.data?.success) {
        setTractors(tRes.data.data.tractors || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const openAddModal = () => {
    setFormData({
      category: 'diesel',
      amount: '',
      date: new Date().toISOString().slice(0, 10),
      tractorId: tractors.length > 0 ? tractors[0]._id : '',
      dieselLiters: '',
      description: '',
      vendorName: '',
      billInvoiceNumber: ''
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
        category: formData.category,
        amount: Number(formData.amount),
        date: formData.date,
        tractorId: formData.tractorId || undefined,
        dieselLiters: formData.category === 'diesel' && formData.dieselLiters ? Number(formData.dieselLiters) : undefined,
        description: formData.description.trim() || undefined,
        vendorName: formData.vendorName.trim() || undefined,
        billInvoiceNumber: formData.billInvoiceNumber.trim() || undefined
      };

      const res = await apiClient.post('/expenses', payload);
      if (res.data?.success) {
        setSuccess('Expense logged successfully!');
        setIsModalOpen(false);
        await fetchExpenses();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this expense?')) return;
    try {
      await apiClient.delete(`/expenses/${id}`);
      setSuccess('Expense removed.');
      await fetchExpenses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalDieselLiters = expenses
    .filter((e) => e.category === 'diesel')
    .reduce((sum, e) => sum + (e.dieselLiters || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Receipt className="w-6 h-6 text-amber-700" />
            <span>Diesel & Fleet Expenses</span>
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Track fuel purchases, maintenance costs, spare parts, and driver wages to calculate true operational profits.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Log Expense</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <p className="text-xs font-semibold text-slate-500">Total Operational Expenses (कुल व्यय)</p>
          <p className="text-2xl font-extrabold text-slate-900">{formatIndianCurrency(totalExpense)}</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <p className="text-xs font-semibold text-slate-500">Total Bulk Diesel Purchased (डीजल खरीद)</p>
          <p className="text-2xl font-extrabold text-blue-900">
            {totalDieselLiters.toFixed(1)} <span className="text-sm font-normal text-slate-500">Liters</span>
          </p>
        </div>
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

      {/* Categories Filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 bg-white p-2 rounded-2xl border border-slate-200">
        <button
          type="button"
          onClick={() => setCategoryFilter('')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap cursor-pointer transition-colors ${
            categoryFilter === '' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Categories
        </button>
        {EXPENSE_CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCategoryFilter(c.value)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap cursor-pointer transition-colors ${
              categoryFilter === c.value
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs flex justify-center">
            <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No expenses logged under this category.
          </div>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="w-full text-left text-xs text-slate-700 min-w-[620px]">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category & Machine</th>
                  <th className="py-3 px-4">Description / Vendor</th>
                  <th className="py-3 px-4">Fuel Quantity</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((e) => (
                  <tr key={e._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500">
                      {formatIndianDateTime(e.date)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-xs capitalize text-slate-900">
                        {e.category?.replace('_', ' ')}
                      </span>
                      {e.tractor && (
                        <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                          <Truck className="w-3 h-3 text-slate-400" />
                          <span>{e.tractor.name}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-800">{e.description || 'Expense entry'}</div>
                      {e.vendorName && (
                        <div className="text-[10px] text-slate-400 mt-0.5">Vendor: {e.vendorName}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {e.dieselLiters ? (
                        <span className="font-semibold text-blue-800">{e.dieselLiters} Liters</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-sm text-slate-900">
                      {formatIndianCurrency(e.amount)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(e._id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-lg cursor-pointer"
                        title="Delete expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Log Operational Expense
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category (श्रेणी) *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 font-medium"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount (₹ राशि) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 2500"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date (दिनांक) *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tractor (if applicable)
                  </label>
                  <select
                    value={formData.tractorId}
                    onChange={(e) => setFormData({ ...formData, tractorId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">-- Fleet Wide --</option>
                    {tractors.map((t) => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.category === 'diesel' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fuel Quantity (Liters / डीजल लीटर)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 35"
                    value={formData.dieselLiters}
                    onChange={(e) => setFormData({ ...formData, dieselLiters: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Item (विवरण)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hydraulic oil filter and 2 grease cartridges"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vendor / Pump Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kisan Fuel Station"
                    value={formData.vendorName}
                    onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Receipt / Bill No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-9988"
                    value={formData.billInvoiceNumber}
                    onChange={(e) => setFormData({ ...formData, billInvoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.amount}
                  className="px-4 py-1.5 text-xs bg-amber-600 text-white font-bold hover:bg-amber-700 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerExpenses;

