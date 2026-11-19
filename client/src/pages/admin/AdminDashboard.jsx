import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Banknote,
  Receipt,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Users
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import apiClient from '../../api/axios';
import { formatINR, formatISTDate } from '../../utils/formatters';

const COLORS = ['#16a34a', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#64748b'];

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const res = await apiClient.get('/reports/dashboard');
      if (res.data?.success) {
        setAnalytics(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleQuickAccept = async (bookingId) => {
    try {
      await apiClient.patch(`/bookings/admin/${bookingId}/accept`);
      fetchAnalytics();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept booking');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-500">Loading operational analytics...</p>
      </div>
    );
  }

  const kpis = analytics?.kpis || {};
  const charts = analytics?.charts || {};
  const recentPending = analytics?.recentPendingBookings || [];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-harvest-600 uppercase tracking-wider block">
            Command Center & Analytics
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            TractorConnect Operations Dashboard
          </h1>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Link
            to="/admin/bookings"
            className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center space-x-1.5 flex-1 sm:flex-initial"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Manage All Bookings</span>
          </Link>
          <Link
            to="/admin/reports"
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold text-center flex-1 sm:flex-initial"
          >
            Export Reports (CSV)
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Bookings */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Bookings
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-slate-900 block">{kpis.totalBookings || 0}</span>
          <span className="text-[10px] text-slate-400 block">All orders</span>
        </div>

        {/* Pending Requests */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
              Pending Requests
            </span>
            {kpis.pendingRequests > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            )}
          </div>
          <span className="text-xl sm:text-2xl font-extrabold text-amber-700 block">{kpis.pendingRequests || 0}</span>
          <span className="text-[10px] text-amber-600 block">Requires action</span>
        </div>

        {/* Completed Acres */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Acres Worked
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-brand-700 block">{kpis.completedAcres || 0}</span>
          <span className="text-[10px] text-slate-400 block">Cultivated / Sown</span>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Revenue Paid
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-emerald-700 block">{formatINR(kpis.totalRevenue || 0)}</span>
          <span className="text-[10px] text-slate-400 block">Cash + UPI Collected</span>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Expenses
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-red-600 block">{formatINR(kpis.totalExpenses || 0)}</span>
          <span className="text-[10px] text-slate-400 block">Diesel, Maintenance, Labour</span>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Net Profit
          </span>
          <span className={`text-xl sm:text-2xl font-extrabold block ${kpis.netProfit >= 0 ? 'text-emerald-800' : 'text-red-700'}`}>
            {formatINR(kpis.netProfit || 0)}
          </span>
          <span className="text-[10px] text-slate-400 block">Revenue &minus; Expenses</span>
        </div>
      </div>

      {/* Pending Requests Quick Action Box */}
      {recentPending.length > 0 && (
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-amber-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <h2 className="text-base font-bold text-slate-900">
                New Pending Booking Requests ({recentPending.length})
              </h2>
            </div>
            <Link to="/admin/bookings?status=pending" className="text-xs font-bold text-brand-700 hover:underline">
              View All Pending &rarr;
            </Link>
          </div>

          <div className="table-responsive-wrapper">
            <table className="w-full text-xs text-left min-w-[620px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-2">Farmer</th>
                  <th className="py-2">Service</th>
                  <th className="py-2">Village</th>
                  <th className="py-2">Requested Date</th>
                  <th className="py-2">Est. Cost</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPending.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50">
                    <td className="py-2.5 font-bold text-slate-900">
                      {b.customer?.name}
                      <span className="text-slate-400 font-normal block">{b.customer?.mobile}</span>
                    </td>
                    <td className="py-2.5">{b.service?.name}</td>
                    <td className="py-2.5">{b.fieldLocation?.village}</td>
                    <td className="py-2.5">{formatISTDate(b.requestedDate, false)} ({b.requestedTimeSlot})</td>
                    <td className="py-2.5 font-bold">{formatINR(b.estimatedCost)}</td>
                    <td className="py-2.5 text-right space-x-2">
                      <button
                        onClick={() => handleQuickAccept(b._id)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                      >
                        Accept
                      </button>
                      <Link
                        to={`/admin/bookings?selected=${b._id}`}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Acres Completed by Service */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Acres Completed by Farming Service</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.acresByService || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="service" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [`${value} acres`, 'Total Acres']} />
                <Bar dataKey="acres" fill="#16a34a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bookings by Status */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Bookings by Status Distribution</h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.bookingsByStatus || []}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ status, count }) => `${status}: ${count}`}
                >
                  {(charts.bookingsByStatus || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Villages by Bookings */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-900">Top Service Villages (Volume)</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.bookingsByVillage || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="village" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#d97706" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

