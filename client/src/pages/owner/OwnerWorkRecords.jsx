import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/axios';
import {
  FileCheck2,
  Banknote,
  Search,
  Fuel,
  User,
  Truck,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Plus
} from 'lucide-react';
import { formatIndianCurrency, formatIndianDateTime } from '../../utils/formatters';

const OwnerWorkRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Payment modal state
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (statusFilter) params.paymentStatus = statusFilter;

      const res = await apiClient.get('/work-records', { params });
      if (res.data?.success) {
        setRecords(res.data.data.records || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load work records');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const openPaymentModal = (rec) => {
    setSelectedRecord(rec);
    setPaymentAmount(rec.balanceDue || '');
    setPaymentMethod('cash');
    setPaymentRef('');
    setPaymentNotes('');
    setPayModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedRecord) return;
    try {
      setSubmittingPayment(true);
      setError('');

      const res = await apiClient.post('/payments', {
        workRecordId: selectedRecord._id,
        amount: Number(paymentAmount),
        paymentMethod,
        transactionReference: paymentRef.trim() || undefined,
        notes: paymentNotes.trim() || undefined
      });

      if (res.data?.success) {
        setSuccess(`Payment of ${formatIndianCurrency(Number(paymentAmount))} recorded successfully!`);
        setPayModalOpen(false);
        setSelectedRecord(null);
        await fetchRecords();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <FileCheck2 className="w-6 h-6 text-amber-700" />
            <span>Work Records & Farm Billing</span>
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Official ledger of completed tractor jobs, verified acres, diesel consumption, and customer payment balances.
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

      {/* Filter Tabs */}
      <div className="flex gap-1.5 bg-white p-2 rounded-2xl border border-slate-200">
        {[
          { label: 'All Jobs', value: '' },
          { label: 'Pending Dues (Unpaid)', value: 'unpaid' },
          { label: 'Partially Paid', value: 'partial' },
          { label: 'Fully Paid', value: 'paid' }
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl cursor-pointer transition-colors ${
              statusFilter === tab.value
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs flex justify-center">
            <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No work records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date & Service</th>
                  <th className="py-3 px-4">Customer & Village</th>
                  <th className="py-3 px-4">Machine & Diesel</th>
                  <th className="py-3 px-4">Billed Amount</th>
                  <th className="py-3 px-4">Paid / Balance Due</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{r.serviceSnapshot?.name || 'Farming Service'}</div>
                      <div className="text-[11px] text-amber-800 font-semibold mt-0.5">
                        {r.actualQuantity} {r.serviceSnapshot?.pricingUnit?.replace('per_', '')} @ {formatIndianCurrency(r.serviceSnapshot?.unitPrice)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {formatIndianDateTime(r.completedDate || r.createdAt)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{r.customer?.name}</div>
                      <div className="text-[11px] text-slate-500">+91 {r.customer?.mobile}</div>
                      <div className="text-[10px] text-slate-400">
                        {r.fieldLocation?.village}, {r.fieldLocation?.district}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 flex items-center space-x-1">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                        <span>{r.tractor?.name || 'Tractor'}</span>
                      </div>
                      {r.dieselUsedLiters > 0 && (
                        <div className="text-[11px] text-blue-700 flex items-center space-x-1 mt-0.5">
                          <Fuel className="w-3 h-3 text-blue-500" />
                          <span>{r.dieselUsedLiters} Liters</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-sm text-slate-900">
                      {formatIndianCurrency(r.totalAmount)}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-emerald-700 font-bold">
                        Paid: {formatIndianCurrency(r.amountPaid)}
                      </div>
                      <div className="text-amber-800 font-bold text-xs mt-0.5">
                        Due: {formatIndianCurrency(r.balanceDue)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          r.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.paymentStatus === 'partial'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.paymentStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {r.balanceDue > 0 ? (
                        <button
                          type="button"
                          onClick={() => openPaymentModal(r)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-xs cursor-pointer inline-flex items-center space-x-1"
                        >
                          <Banknote className="w-3 h-3" />
                          <span>Record Payment</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-bold">Settled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {payModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Record Customer Payment (Cash / UPI)
            </h3>
            <p className="text-xs text-slate-600">
              Recording payment from <span className="font-semibold">{selectedRecord.customer?.name}</span> for{' '}
              {selectedRecord.serviceSnapshot?.name}. Balance due is{' '}
              <span className="font-bold text-amber-900">{formatIndianCurrency(selectedRecord.balanceDue)}</span>.
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-4" noValidate>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Amount (₹ प्राप्त राशि) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedRecord.balanceDue}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold text-slate-900 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Method (माध्यम) *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="cash">Cash (नकद)</option>
                    <option value="upi">UPI (PhonePe / GPay / Paytm)</option>
                    <option value="bank_transfer">Bank Transfer (खाता)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    UTR / Receipt / Ref No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UPI-123456"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Note (टिप्पणी)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Received at farm gate after rotavation"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment || !paymentAmount}
                  className="px-4 py-1.5 text-xs bg-emerald-600 text-white font-bold hover:bg-emerald-700 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {submittingPayment ? 'Recording...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerWorkRecords;

