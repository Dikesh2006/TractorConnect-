import React, { useState, useEffect } from 'react';
import { FileCheck2, Search, Banknote, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import apiClient from '../../api/axios';
import { formatINR, formatISTDate } from '../../utils/formatters';

const WorkRecordsList = ({ onRecordPaymentClick }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [villageFilter, setVillageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchRecords = async () => {
    try {
      let url = `/work-records/admin/all?limit=50`;
      if (villageFilter) url += `&village=${encodeURIComponent(villageFilter)}`;
      if (statusFilter) url += `&paymentStatus=${statusFilter}`;

      const res = await apiClient.get(url);
      if (res.data?.success) {
        setRecords(res.data.data.records || []);
      }
    } catch (err) {
      console.error('Failed to load work records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [villageFilter, statusFilter]);

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Paid</span>;
      case 'partially_paid':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Partially Paid</span>;
      case 'unpaid':
        return <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Unpaid</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Completed Field Work Records</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Audited log of completed farming operations, actual acres worked, bills generated, and outstanding farmer balances.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex gap-1.5">
          {['', 'paid', 'partially_paid', 'unpaid'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize ${
                statusFilter === st
                  ? 'bg-brand-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st ? st.replace('_', ' ') : 'All Payments'}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-56">
          <input
            type="text"
            value={villageFilter}
            onChange={(e) => setVillageFilter(e.target.value)}
            placeholder="Filter by village..."
            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
          />
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date & Farmer</th>
                <th className="py-3 px-4">Farming Service</th>
                <th className="py-3 px-4">Actual Quantity & Acres</th>
                <th className="py-3 px-4">Tractor Assigned</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Paid / Due</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{r.customer?.name}</span>
                    <span className="text-[11px] text-slate-400">
                      {formatISTDate(r.workDate, false)} &bull; {r.fieldLocation?.village}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">
                    {r.service?.name}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">
                      {r.actualQuantity} {r.serviceSnapshot?.pricingUnit}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {r.actualAcres} acres &bull; {r.workingHours} hrs
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {r.tractor ? `${r.tractor.name}` : 'N/A'}
                  </td>
                  <td className="py-3 px-4 font-extrabold text-slate-900 text-sm">
                    {formatINR(r.totalAmount)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-emerald-700 font-bold block">
                      Paid: {formatINR(r.amountPaid)}
                    </span>
                    <span className={`text-[11px] font-semibold ${r.balanceDue > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                      Due: {formatINR(r.balanceDue)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {getPaymentStatusBadge(r.paymentStatus)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WorkRecordsList;

