import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/axios';
import {
  Banknote,
  Search,
  CheckCircle2,
  AlertCircle,
  Calendar,
  XCircle,
  FileCheck2,
  RefreshCw
} from 'lucide-react';
import { formatIndianCurrency, formatIndianDateTime } from '../../utils/formatters';

const OwnerPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [submittingVoid, setSubmittingVoid] = useState(false);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (methodFilter) params.paymentMethod = methodFilter;

      const res = await apiClient.get('/payments/admin/all', { params });
      if (res.data?.success) {
        setPayments(res.data.data.payments || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [methodFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleVoidPayment = async () => {
    if (!selectedPayment) return;
    try {
      setSubmittingVoid(true);
      setError('');

      const res = await apiClient.patch(`/payments/${selectedPayment._id}/void`, {
        reason: voidReason.trim() || 'Voided by owner'
      });

      if (res.data?.success) {
        setSuccess('Payment entry successfully voided. Work record balance updated.');
        setVoidModalOpen(false);
        setSelectedPayment(null);
        await fetchPayments();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to void payment');
    } finally {
      setSubmittingVoid(false);
    }
  };

  const totalCollected = payments
    .filter((p) => !p.isVoid)
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Banknote className="w-6 h-6 text-emerald-700" />
            <span>Payments Received (Cash & UPI)</span>
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Complete transaction register of all cash and digital UPI collections from farmers.
          </p>
        </div>

        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
              Total Collections
            </span>
            <span className="text-lg font-extrabold text-emerald-900">
              {formatIndianCurrency(totalCollected)}
            </span>
          </div>
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
          { label: 'All Methods', value: '' },
          { label: 'Cash (नकद)', value: 'cash' },
          { label: 'UPI (फोनपे / जीपे)', value: 'upi' },
          { label: 'Bank Transfer', value: 'bank_transfer' }
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setMethodFilter(tab.value)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl cursor-pointer transition-colors ${
              methodFilter === tab.value
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs flex justify-center">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No payments recorded yet.
          </div>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="w-full text-left text-xs text-slate-700 min-w-[650px]">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Work Job</th>
                  <th className="py-3 px-4">Method & Ref</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p._id} className={p.isVoid ? 'bg-red-50/40 text-slate-400 line-through' : 'hover:bg-slate-50/70 transition-colors'}>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {formatIndianDateTime(p.paymentDate || p.createdAt)}
                      </div>
                      <div className="text-[10px] text-slate-400">ID: {p._id.slice(-6)}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{p.customer?.name}</div>
                      <div className="text-[11px] text-slate-500">+91 {p.customer?.mobile}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">
                        {p.workRecord?.serviceSnapshot?.name || 'Farming Job'}
                      </div>
                      {p.notes && (
                        <div className="text-[10px] text-slate-500 italic mt-0.5">"{p.notes}"</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-xs uppercase text-slate-700">
                        {p.paymentMethod}
                      </span>
                      {p.transactionReference && (
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                          Ref: {p.transactionReference}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-sm text-emerald-800">
                      {formatIndianCurrency(p.amount)}
                    </td>

                    <td className="py-3.5 px-4">
                      {p.isVoid ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                          Voided
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Success
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {!p.isVoid && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPayment(p);
                            setVoidReason('');
                            setVoidModalOpen(true);
                          }}
                          className="text-[11px] text-red-600 hover:text-red-800 font-semibold cursor-pointer"
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
        )}
      </div>

      {/* Void Modal */}
      {voidModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Void Payment Entry
            </h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to void this payment of{' '}
              <span className="font-bold text-slate-900">{formatIndianCurrency(selectedPayment.amount)}</span>? The work record will immediately reflect the unpaid balance again.
            </p>

            <textarea
              rows={2}
              required
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="e.g. Wrong entry, duplicate record, or customer bounced check."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500"
            />

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
                disabled={submittingVoid}
                onClick={handleVoidPayment}
                className="px-4 py-1.5 text-xs bg-red-600 text-white font-bold hover:bg-red-700 rounded-xl shadow-xs disabled:opacity-50"
              >
                {submittingVoid ? 'Voiding...' : 'Confirm Void'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerPayments;

