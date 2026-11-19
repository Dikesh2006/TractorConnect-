import React, { useState, useEffect } from 'react';
import { Banknote, Plus, Search, AlertCircle, CheckCircle2, RotateCcw, X } from 'lucide-react';
import apiClient from '../../api/axios';
import { formatINR, formatISTDate } from '../../utils/formatters';

const PaymentsManagement = () => {
  const [payments, setPayments] = useState([]);
  const [workRecords, setWorkRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [voidReason, setVoidReason] = useState('');

  const [paymentForm, setPaymentForm] = useState({
    workRecordId: '',
    amount: '',
    method: 'cash',
    upiTransactionId: '',
    notes: ''
  });
  const [apiError, setApiError] = useState('');

  const fetchData = async () => {
    try {
      const [payRes, wrRes] = await Promise.all([
        apiClient.get('/payments/admin/all?limit=50'),
        apiClient.get('/work-records/admin/all?paymentStatus=unpaid&limit=50')
      ]);

      if (payRes.data?.success) setPayments(payRes.data.data.payments || []);
      if (wrRes.data?.success) setWorkRecords(wrRes.data.data.records || []);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenRecord = () => {
    const firstDue = workRecords[0];
    setPaymentForm({
      workRecordId: firstDue?._id || '',
      amount: firstDue?.balanceDue || '',
      method: 'cash',
      upiTransactionId: '',
      notes: ''
    });
    setApiError('');
    setRecordModalOpen(true);
  };

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    try {
      setApiError('');
      await apiClient.post('/payments', {
        ...paymentForm,
        amount: parseFloat(paymentForm.amount)
      });
      setRecordModalOpen(false);
      fetchData();
    } catch (err) {
      setApiError(err.response?.data?.message || err.message || 'Failed to record payment');
    }
  };

  const handleOpenVoid = (payment) => {
    setSelectedPayment(payment);
    setVoidReason('');
    setApiError('');
    setVoidModalOpen(true);
  };

  const handleConfirmVoid = async () => {
    if (!voidReason.trim()) {
      setApiError('Please enter a reason for voiding this payment');
      return;
    }

    try {
      setApiError('');
      await apiClient.patch(`/payments/${selectedPayment._id}/void`, {
        voidReason
      });
      setVoidModalOpen(false);
      fetchData();
    } catch (err) {
      setApiError(err.response?.data?.message || err.message || 'Failed to void payment');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payments & Dues Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Record manual cash and UPI payments received from farmers. Void corrections with full audit logging.
          </p>
        </div>

        <button
          onClick={handleOpenRecord}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Record Payment (भुगतान दर्ज करें)</span>
        </button>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="table-responsive-wrapper">
          <table className="w-full text-xs text-left min-w-[680px]">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Farmer Details</th>
                <th className="py-3 px-4">Amount (₹)</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Recorded By / Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 text-slate-700">
                    {formatISTDate(p.paidAt)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{p.customer?.name}</span>
                    <span className="text-[11px] text-slate-400">{p.customer?.mobile}</span>
                  </td>
                  <td className="py-3 px-4 font-extrabold text-emerald-700 text-sm">
                    {formatINR(p.amount)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-800 uppercase px-2 py-0.5 rounded bg-slate-100 text-[10px]">
                      {p.method}
                    </span>
                    {p.upiTransactionId && (
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        Ref: {p.upiTransactionId}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {p.status === 'paid' ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                        Verified
                      </span>
                    ) : (
                      <span className="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded-full border border-red-200 text-[10px]">
                        Voided
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                    {p.notes || '—'}
                    {p.voidReason && <span className="text-red-500 block italic text-[10px]">&ldquo;Void: {p.voidReason}&rdquo;</span>}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {p.status === 'paid' && (
                      <button
                        onClick={() => handleOpenVoid(p)}
                        className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-lg text-[11px]"
                      >
                        Void
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {recordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Record Payment</h3>
            <p className="text-xs text-slate-500">
              Log a partial or full payment received in Cash or via UPI against a field work bill.
            </p>

            {apiError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            <form onSubmit={handleRecordSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Field Bill *</label>
                <select
                  value={paymentForm.workRecordId}
                  onChange={(e) => {
                    const match = workRecords.find((r) => r._id === e.target.value);
                    setPaymentForm({
                      ...paymentForm,
                      workRecordId: e.target.value,
                      amount: match ? match.balanceDue : paymentForm.amount
                    });
                  }}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                  required
                >
                  <option value="">-- Choose work bill with due --</option>
                  {workRecords.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.customer?.name} &bull; {r.service?.name} (Due: {formatINR(r.balanceDue)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Amount (₹) *</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  placeholder="Enter collected amount"
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Mode *</label>
                <select
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                >
                  <option value="cash">Cash (नकद)</option>
                  <option value="upi">UPI (PhonePe / GPay / Paytm)</option>
                  <option value="bank_transfer">Bank Transfer / IMPS</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {paymentForm.method === 'upi' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">UPI Reference / UTR Number</label>
                  <input
                    type="text"
                    value={paymentForm.upiTransactionId}
                    onChange={(e) => setPaymentForm({ ...paymentForm, upiTransactionId: e.target.value })}
                    placeholder="e.g. 331456789012"
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Notes</label>
                <input
                  type="text"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="e.g. Cash collected by driver Raju"
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setRecordModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  Confirm & Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Void Modal */}
      {voidModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Void Payment Receipt</h3>
            <p className="text-xs text-slate-500">
              Voiding will reverse ₹{selectedPayment.amount} and re-add it to the farmer's outstanding due balance.
            </p>

            {apiError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for voiding *
              </label>
              <textarea
                rows={2}
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="e.g. Mistyped amount, duplicate entry, cheque bounced"
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setVoidModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmVoid}
                className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl"
              >
                Confirm Void
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsManagement;

