import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle2, Clock, Banknote, ArrowRight, MapPin, AlertCircle, PlusCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/axios';
import { formatINR, formatISTDate } from '../../utils/formatters';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [dues, setDues] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingsRes, duesRes] = await Promise.all([
          apiClient.get('/bookings/my?limit=5'),
          apiClient.get('/payments/dues/my')
        ]);

        if (bookingsRes.data?.success) {
          setBookings(bookingsRes.data.data.bookings || []);
        }
        if (duesRes.data?.success) {
          setDues(duesRes.data.data.dues);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">Pending (प्रतीक्षारत)</span>;
      case 'accepted':
        return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">Accepted (स्वीकृत)</span>;
      case 'scheduled':
        return <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-0.5 rounded-full">Scheduled (तय)</span>;
      case 'in_progress':
        return <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-0.5 rounded-full animate-pulse">In Progress (चालू)</span>;
      case 'completed':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">Completed (पूर्ण)</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-0.5 rounded-full">Rejected</span>;
      case 'cancelled':
        return <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full">Cancelled</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-bold text-brand-700 uppercase tracking-wider block">
            Kisan Dashboard (किसान डैशबोर्ड)
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            राम राम, {user?.name}!
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Village: <strong>{user?.village || 'Not set'}</strong> &bull; District: {user?.district || 'Sehore'}
          </p>
        </div>

        <Link
          to="/customer/book"
          className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-sm shadow-sm transition-all"
        >
          <PlusCircle className="w-5 h-5" />
          <span>New Tractor Booking</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Recent Bookings</span>
            <Calendar className="w-4 h-4 text-brand-700 flex-shrink-0" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 block">
            {bookings.length}
          </span>
          <Link to="/customer/my-bookings" className="text-xs text-brand-700 hover:underline font-semibold block pt-1">
            View booking history &rarr;
          </Link>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Completed Jobs</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 block">
            {dues?.totalRecords || 0}
          </span>
          <span className="text-xs text-slate-500 block pt-1">
            Total Billed: {formatINR(dues?.totalBilled || 0)}
          </span>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-1 sm:col-span-2 lg:col-span-1">
          <div className="flex justify-between items-center text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Outstanding Balance Due</span>
            <Banknote className="w-4 h-4 text-amber-600 flex-shrink-0" />
          </div>
          <span className={`text-2xl font-extrabold block ${dues?.totalDue > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
            {formatINR(dues?.totalDue || 0)}
          </span>
          <span className="text-xs text-slate-500 block pt-1">
            {dues?.totalDue > 0 ? 'Payable via Cash or UPI after harvest' : 'All previous dues cleared'}
          </span>
        </div>
      </div>

      {/* Recent Bookings List */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 lg:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Recent Booking Requests</h2>
            <p className="text-xs text-slate-500 mt-0.5">Track status, assigned tractors, and arrival schedules</p>
          </div>
          <Link to="/customer/my-bookings" className="text-xs font-bold text-brand-700 hover:underline">
            View All ({bookings.length})
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl p-6 space-y-3">
            <span className="text-3xl">🚜</span>
            <p className="text-sm font-semibold text-slate-700">You have no tractor bookings yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Ready to plough, rotavate, or sow? Book a tractor online with fair per-acre rates.
            </p>
            <Link
              to="/customer/book"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-700 text-white text-xs font-bold shadow-xs"
            >
              <span>Book First Service</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <Link
                key={booking._id}
                to={`/customer/bookings/${booking._id}`}
                className="block p-4 rounded-2xl border border-slate-200 hover:border-brand-300 hover:bg-slate-50/60 transition-all shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-sm">{booking.service?.name}</span>
                      {getStatusBadge(booking.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5">
                      <span>Requested: <strong>{formatISTDate(booking.requestedDate, false)}</strong> ({booking.requestedTimeSlot})</span>
                      <span>&bull;</span>
                      <span>Quantity: {booking.estimatedQuantity} {booking.serviceSnapshot?.pricingUnit}</span>
                      <span>&bull;</span>
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{booking.fieldLocation?.village}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-4">
                    <div className="text-left sm:text-right">
                      <span className="text-xs text-slate-500 block">Est. Cost</span>
                      <span className="font-extrabold text-slate-900 text-sm">
                        {formatINR(booking.estimatedCost)}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;

