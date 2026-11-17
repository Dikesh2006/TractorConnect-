import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, Filter, Search, Calendar } from 'lucide-react';
import apiClient from '../../api/axios';
import { formatINR } from '../../utils/formatters';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('customers'); // 'customers' | 'villages' | 'services' | 'datewise'
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [villageFilter, setVillageFilter] = useState('');
  const [downloading, setDownloading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let endpoint = `/reports/${activeTab}`;
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (villageFilter) params.append('village', villageFilter);

      const res = await apiClient.get(`${endpoint}?${params.toString()}`);
      if (res.data?.success) {
        setReportData(res.data.data.report || []);
      }
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab, villageFilter]);

  const handleExportCSV = async () => {
    setDownloading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (villageFilter) params.append('village', villageFilter);

      const res = await apiClient.get(`/reports/export/${activeTab}?${params.toString()}`, {
        responseType: 'blob'
      });

      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tractorconnect_${activeTab}_report.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert('Failed to export CSV');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Financial Audits</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational summaries and downloadable CSV spreadsheets with Indian numbering formatting and Excel compatibility (UTF-8 BOM).
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={downloading || reportData.length === 0}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{downloading ? 'Downloading...' : 'Export to CSV (Excel)'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 gap-2 sm:gap-4 pb-1">
        {[
          { id: 'customers', label: 'Farmer-wise Summary' },
          { id: 'villages', label: 'Village-wise Summary' },
          { id: 'services', label: 'Service-wise Analytics' },
          { id: 'datewise', label: 'Date-wise Work Records' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-brand-700 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'customers' && (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Farmer Name</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">Village</th>
                  <th className="py-3 px-4">Completed Bookings</th>
                  <th className="py-3 px-4">Acres Worked</th>
                  <th className="py-3 px-4">Total Billed</th>
                  <th className="py-3 px-4">Total Paid</th>
                  <th className="py-3 px-4">Balance Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{r.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{r.mobile}</td>
                    <td className="py-3 px-4 text-slate-700">{r.village}</td>
                    <td className="py-3 px-4 font-bold">{r.totalBookings}</td>
                    <td className="py-3 px-4 font-semibold text-brand-700">{r.totalAcres} acres</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{formatINR(r.totalBilled)}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">{formatINR(r.totalPaid)}</td>
                    <td className={`py-3 px-4 font-bold ${r.totalDue > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                      {formatINR(r.totalDue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'villages' && (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Village Name</th>
                  <th className="py-3 px-4">District</th>
                  <th className="py-3 px-4">Completed Jobs</th>
                  <th className="py-3 px-4">Acres Cultivated</th>
                  <th className="py-3 px-4">Total Billed</th>
                  <th className="py-3 px-4">Total Paid</th>
                  <th className="py-3 px-4">Balance Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.map((v, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{v.village}</td>
                    <td className="py-3 px-4 text-slate-600">{v.district}</td>
                    <td className="py-3 px-4 font-bold">{v.totalCompletedJobs}</td>
                    <td className="py-3 px-4 font-semibold text-brand-700">{v.totalAcres} acres</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{formatINR(v.totalBilled)}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">{formatINR(v.totalPaid)}</td>
                    <td className={`py-3 px-4 font-bold ${v.totalDue > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                      {formatINR(v.totalDue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'services' && (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Farming Service</th>
                  <th className="py-3 px-4">Pricing Unit</th>
                  <th className="py-3 px-4">Completed Orders</th>
                  <th className="py-3 px-4">Total Quantity</th>
                  <th className="py-3 px-4">Total Acres</th>
                  <th className="py-3 px-4">Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.map((s, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{s.serviceName}</td>
                    <td className="py-3 px-4 capitalize text-slate-600">{s.pricingUnit.replace('_', ' ')}</td>
                    <td className="py-3 px-4 font-bold">{s.totalJobs}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{s.totalQuantity}</td>
                    <td className="py-3 px-4 font-bold text-brand-700">{s.totalAcres}</td>
                    <td className="py-3 px-4 font-extrabold text-emerald-700">{formatINR(s.totalRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'datewise' && (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Work Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Village</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Tractor</th>
                  <th className="py-3 px-4">Total Bill</th>
                  <th className="py-3 px-4">Paid</th>
                  <th className="py-3 px-4">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-700">{d.workDate}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{d.customerName}</td>
                    <td className="py-3 px-4 text-slate-600">{d.village}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{d.service}</td>
                    <td className="py-3 px-4">{d.quantity}</td>
                    <td className="py-3 px-4 text-slate-600">{d.tractor}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{formatINR(d.totalAmount)}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">{formatINR(d.amountPaid)}</td>
                    <td className={`py-3 px-4 font-bold ${d.balanceDue > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                      {formatINR(d.balanceDue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;

