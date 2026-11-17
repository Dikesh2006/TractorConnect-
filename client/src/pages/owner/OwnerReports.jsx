import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axios';
import {
  FileSpreadsheet,
  Download,
  TrendingUp,
  Banknote,
  Receipt,
  MapPin,
  Wrench,
  AlertCircle,
  FileCheck2
} from 'lucide-react';
import { formatIndianCurrency } from '../../utils/formatters';

const OwnerReports = () => {
  const [metrics, setMetrics] = useState(null);
  const [serviceStats, setServiceStats] = useState([]);
  const [villageStats, setVillageStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError('');

        const [dashRes, svcRes, vilRes] = await Promise.all([
          apiClient.get('/reports/dashboard'),
          apiClient.get('/reports/service-wise').catch(() => ({ data: { data: { services: [] } } })),
          apiClient.get('/reports/village-wise').catch(() => ({ data: { data: { villages: [] } } }))
        ]);

        if (dashRes.data?.success) {
          setMetrics(dashRes.data.data);
        }
        if (svcRes.data?.success) {
          setServiceStats(svcRes.data.data.services || []);
        }
        if (vilRes.data?.success) {
          setVillageStats(vilRes.data.data.villages || []);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load report analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const handleDownloadCSV = async (reportType, filenameLabel) => {
    try {
      setDownloading(reportType);
      const res = await apiClient.get('/reports/export/csv', {
        params: { type: reportType },
        responseType: 'blob'
      });

      // Trigger browser download
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filenameLabel}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert('Failed to download report. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const netRevenue = (metrics?.totalRevenue || 0) - (metrics?.totalExpenses || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-700" />
            <span>Earnings, Analytics & CSV Reports</span>
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Financial performance reports, village customer analysis, and one-click sanitized CSV exports.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <p className="text-xs font-semibold text-slate-500">Gross Billed (कुल बिलिंग)</p>
          <p className="text-2xl font-extrabold text-slate-900">{formatIndianCurrency(metrics?.totalRevenue || 0)}</p>
        </div>

        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 shadow-xs space-y-1">
          <p className="text-xs font-bold text-emerald-800">Cash/UPI Collected (वसूल)</p>
          <p className="text-2xl font-extrabold text-emerald-900">{formatIndianCurrency(metrics?.totalPaid || 0)}</p>
        </div>

        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 shadow-xs space-y-1">
          <p className="text-xs font-bold text-amber-800">Market Dues (बाकी)</p>
          <p className="text-2xl font-extrabold text-amber-900">{formatIndianCurrency(metrics?.totalDue || 0)}</p>
        </div>

        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 shadow-xs space-y-1">
          <p className="text-xs font-bold text-blue-800">Operational Profit (शुद्ध लाभ)</p>
          <p className="text-2xl font-extrabold text-blue-900">{formatIndianCurrency(netRevenue)}</p>
        </div>
      </div>

      {/* CSV Export Action Center */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
          <Download className="w-4 h-4 text-emerald-700" />
          <span>Official CSV Exports (Excel Compatible with UTF-8 BOM)</span>
        </h3>
        <p className="text-xs text-slate-500">
          Download sanitized accounting spreadsheets with formula-injection security protections enabled.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <button
            type="button"
            disabled={downloading === 'customer'}
            onClick={() => handleDownloadCSV('customer', 'Owner_Customer_Ledger')}
            className="p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left cursor-pointer transition-colors space-y-1 disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">Farmer Ledger CSV</span>
              <Download className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-[11px] text-slate-500">
              Customer-wise jobs, acres worked, total billed, paid, and balance due.
            </p>
          </button>

          <button
            type="button"
            disabled={downloading === 'service'}
            onClick={() => handleDownloadCSV('service', 'Owner_Service_Performance')}
            className="p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left cursor-pointer transition-colors space-y-1 disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">Service Wise CSV</span>
              <Download className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-[11px] text-slate-500">
              Breakdown by ploughing, rotavator, and sowing with total volume and revenue.
            </p>
          </button>

          <button
            type="button"
            disabled={downloading === 'village'}
            onClick={() => handleDownloadCSV('village', 'Owner_Village_Analytics')}
            className="p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left cursor-pointer transition-colors space-y-1 disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">Village Analytics CSV</span>
              <Download className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-[11px] text-slate-500">
              Geographical distribution of completed farm contracts across your service radius.
            </p>
          </button>
        </div>
      </div>

      {/* Service & Village Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Wise */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
            <Wrench className="w-4 h-4 text-amber-700" />
            <span>Service Wise Revenue</span>
          </h3>

          {serviceStats.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No service statistics available yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {serviceStats.map((s, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{s.serviceName || s.name}</p>
                    <p className="text-[10px] text-slate-400">{s.totalJobs || s.count || 0} completed jobs</p>
                  </div>
                  <span className="font-extrabold text-slate-900">
                    {formatIndianCurrency(s.totalRevenue || s.totalAmount || 0)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Village Wise */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-brand-700" />
            <span>Village Area Performance</span>
          </h3>

          {villageStats.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No village statistics available yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {villageStats.map((v, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{v.village || 'Unknown Village'}</p>
                    <p className="text-[10px] text-slate-400">{v.totalJobs || v.jobsCount || 0} jobs in this village</p>
                  </div>
                  <span className="font-extrabold text-slate-900">
                    {formatIndianCurrency(v.totalRevenue || v.totalAmount || 0)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerReports;

