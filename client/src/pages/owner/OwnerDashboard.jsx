import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  CalendarDays,
  Banknote,
  Fuel,
  Truck,
  TrendingUp,
  AlertCircle,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  Wrench,
  ChevronRight
} from 'lucide-react';
import { formatIndianCurrency, formatIndianDateTime } from '../../utils/formatters';

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [tractors, setTractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        const [reportRes, bookingsRes, tractorsRes] = await Promise.all([
          apiClient.get('/reports/dashboard').catch(() => ({ data: { data: {} } })),
          apiClient.get('/bookings/owner/all', { params: { limit: 5 } }).catch(() => ({ data: { data: { bookings: [] } } })),
          apiClient.get('/tractors').catch(() => ({ data: { data: { tractors: [] } } }))
        ]);

        if (reportRes.data?.success) {
          setMetrics(reportRes.data.data);
        }
        if (bookingsRes.data?.success) {
          setRecentBookings(bookingsRes.data.data.bookings || []);
        }
        if (tractorsRes.data?.success) {
          setTractors(tractorsRes.data.data.tractors || []);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const totalRevenue = metrics?.totalRevenue || 0;
  const totalPaid = metrics?.totalPaid || 0;
  const totalDue = metrics?.totalDue || 0;
  const totalFuel = metrics?.totalDieselLiters || 0;
  const availableTractors = tractors.filter((t) => t.status === 'available').length;

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome, {user?.name || 'Tractor Owner'}!
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            {user?.businessName || 'TractorConnect Operations'} &bull; Base: {user?.village || 'Sehore'} ({user?.serviceRadiusKm || 25} km radius)
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/owner/services"
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Service</span>
          </Link>
          <Link
            to="/owner/tractors"
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Manage Fleet</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Billed Revenue */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold">Total Revenue (कुल आय)</span>
            <Banknote className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900">
            {formatIndianCurrency(totalRevenue)}
          </p>
          <p className="text-[10px] text-emerald-700 font-medium">
            Collected: {formatIndianCurrency(totalPaid)}
          </p>
        </div>

        {/* Pending Customer Dues */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold">Pending Dues (बाकी राशि)</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-amber-900">
            {formatIndianCurrency(totalDue)}
          </p>
          <p className="text-[10px] text-slate-500">
            From {metrics?.unpaidRecordsCount || 0} unpaid jobs
          </p>
        </div>

        {/* Diesel Consumed */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold">Diesel Used (डीजल खपत)</span>
            <Fuel className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900">
            {totalFuel.toFixed(1)} <span className="text-sm font-normal text-slate-500">L</span>
          </p>
          <p className="text-[10px] text-slate-500">Recorded across completed jobs</p>
        </div>

        {/* Fleet Status */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold">Tractor Fleet (उपलब्ध)</span>
            <Truck className="w-4 h-4 text-brand-600" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900">
            {availableTractors} / {tractors.length}
          </p>
          <p className="text-[10px] text-emerald-700 font-medium">
            {availableTractors} available for booking
          </p>
        </div>
      </div>

      {/* Recent Bookings & Fleet Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Bookings */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
              <CalendarDays className="w-4 h-4 text-amber-700" />
              <span>Recent Booking Requests</span>
            </h3>
            <Link
              to="/owner/bookings"
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500 flex justify-center">
              <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed rounded-xl">
              No booking requests received yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentBookings.map((b) => (
                <div key={b._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 text-xs">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                      <span>{b.customer?.name || 'Farmer'}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({b.customer?.mobile})
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      <span className="font-medium text-amber-900">{b.serviceSnapshot?.name}</span> &bull; {b.estimatedQuantity} {b.serviceSnapshot?.pricingUnit?.replace('per_', '')}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Field: {b.fieldLocation?.village}, {b.fieldLocation?.district} &bull; Requested: {formatIndianDateTime(b.requestedDate)}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start space-x-2 sm:space-x-0 space-y-0 sm:space-y-1">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        b.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : b.status === 'scheduled'
                          ? 'bg-blue-100 text-blue-800'
                          : b.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {b.status}
                    </span>
                    <span className="font-bold text-slate-900">
                      {formatIndianCurrency(b.estimatedCost)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Fleet Status & Quick Info */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
              <Truck className="w-4 h-4 text-slate-700" />
              <span>Fleet Summary</span>
            </h3>

            {tractors.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 border border-dashed rounded-xl">
                No tractors registered yet.{' '}
                <Link to="/owner/tractors" className="text-amber-700 font-semibold underline block mt-1">
                  Add your first tractor
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {tractors.slice(0, 4).map((t) => (
                  <div key={t._id} className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{t.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {t.registrationNumber} &bull; {t.horsepower} HP
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'available'
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.status === 'in_use'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 space-y-2 text-xs text-amber-900">
            <p className="font-bold text-sm flex items-center space-x-1.5">
              <span>💡</span>
              <span>Owner Tip</span>
            </p>
            <p className="text-amber-800 leading-relaxed text-[11px]">
              Keep your tractors set to "Available" and update your prices at the beginning of each cropping season (Kharif / Rabi) to get maximum bookings from local farmers!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;

