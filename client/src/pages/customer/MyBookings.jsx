import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, ArrowRight, XCircle, AlertCircle, PlusCircle } from 'lucide-react';
import apiClient from '../../api/axios';
import { formatINR, formatISTDate } from '../../utils/formatters';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/bookings/my?status=${statusFilter}` : '/bookings/my';
      const res = await apiClient.get(url);
      if (res.data?.success) {
        setBookings(res.data.data.bookings || []);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleCancelClick = (bookingId) => {
    setCancellingBookingId(bookingId);
    setCancellationReason('Change of farm plan');
    setActionError('');
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancellationReason.trim()) {
      setActionError('Please provide a reason for cancellation');
      return;
    }

    try {
      const res = await apiClient.patch(`/bookings/my/${cancellingBookingId}/cancel`, {
        cancellationReason
      });
      if (res.data?.success) {
        setCancelModalOpen(false);
        fetchBookings();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">My Tractor Bookings</h1>
          <p className="text-xs text-slate-500 mt-1">
            बुकिंग इतिहास / View historical orders, arrival timings, and assigned tractors
          </p>
        </div>

        <Link
          to="/customer/book"
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Booking</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { label: 'All', value: '' },
          { label: 'Pending', value: 'pending' },
          { label: 'Accepted', value: 'accepted' },
          { label: 'Scheduled', value: 'scheduled' },
          { label: 'In Progress', value: 'in_progress' },
          { label: 'Completed', value: 'completed' },
          { label: 'Cancelled', value: 'cancelled' }
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === tab.value
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200 animate-pulse"></div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">No bookings found</p>
          <Link
            to="/customer/book"
            className="text-xs text-brand-700 font-bold hover:underline inline-block mt-2"
          >
            Create your first booking &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking._id}
              className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-300 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className="text-base font-bold text-slate-900">{booking.service?.name}</span>
                  {getStatusBadge(booking.status)}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                  <span>Date: <strong>{formatISTDate(booking.requestedDate, false)}</strong> ({booking.requestedTimeSlot})</span>
                  <span>Quantity: <strong>{booking.estimatedQuantity} {booking.serviceSnapshot?.pricingUnit}</strong></span>
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{booking.fieldLocation?.village}, {booking.fieldLocation?.district}</span>
                  </span>
                  {booking.assignedTractor && (
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                      Tractor: {booking.assignedTractor.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-4 self-end md:self-center">
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Est. Cost</span>
                  <span className="text-base font-extrabold text-slate-900">
                    {formatINR(booking.estimatedCost)}
                  </span>
                </div>

                {['pending', 'accepted', 'scheduled'].includes(booking.status) && (
                  <button
                    type="button"
                    onClick={() => handleCancelClick(booking._id)}
                    className="px-3 py-1.5 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                )}

                <Link
                  to={`/customer/bookings/${booking._id}`}
                  className="inline-flex items-center space-x-1 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold"
                >
                  <span>Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Cancel Tractor Booking</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to cancel this booking? Please share why you are cancelling.
            </p>

            {actionError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for cancellation *
              </label>
              <textarea
                rows={2}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="e.g. Unseasonal rain, work delayed, etc."
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;

