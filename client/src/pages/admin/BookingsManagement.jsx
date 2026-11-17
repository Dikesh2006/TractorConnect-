import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Check,
  X,
  Clock,
  Play,
  CheckCircle,
  Truck,
  MapPin,
  ExternalLink,
  AlertCircle,
  Search
} from 'lucide-react';
import apiClient from '../../api/axios';
import { formatINR, formatISTDate } from '../../utils/formatters';
import CompleteWorkModal from './CompleteWorkModal';

const BookingsManagement = () => {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || '';

  const [bookings, setBookings] = useState([]);
  const [tractors, setTractors] = useState([]);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [villageFilter, setVillageFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [scheduleForm, setScheduleForm] = useState({
    tractorId: '',
    scheduledStart: '',
    scheduledEnd: '',
    operatorName: '',
    adminNotes: ''
  });
  const [conflictError, setConflictError] = useState('');

  const fetchBookings = async () => {
    try {
      let url = `/bookings/admin/all?limit=50`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (villageFilter) url += `&village=${encodeURIComponent(villageFilter)}`;

      const res = await apiClient.get(url);
      if (res.data?.success) {
        setBookings(res.data.data.bookings || []);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTractors = async () => {
    try {
      const res = await apiClient.get('/tractors');
      if (res.data?.success) {
        setTractors(res.data.data.tractors || []);
      }
    } catch (err) {
      console.error('Failed to load tractors:', err);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchTractors();
  }, [statusFilter, villageFilter]);

  // Actions
  const handleAccept = async (bookingId) => {
    try {
      await apiClient.patch(`/bookings/admin/${bookingId}/accept`);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept booking');
    }
  };

  const handleOpenReject = (booking) => {
    setSelectedBooking(booking);
    setRejectionReason('All tractors occupied during requested hours');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    try {
      await apiClient.patch(`/bookings/admin/${selectedBooking._id}/reject`, {
        rejectionReason
      });
      setRejectModalOpen(false);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject booking');
    }
  };

  const handleOpenSchedule = (booking) => {
    setSelectedBooking(booking);
    const dateStr = new Date(booking.requestedDate).toISOString().split('T')[0];
    const defaultStart = `${dateStr}T08:00`;
    const defaultEnd = `${dateStr}T12:00`;

    setScheduleForm({
      tractorId: tractors[0]?._id || '',
      scheduledStart: defaultStart,
      scheduledEnd: defaultEnd,
      operatorName: tractors[0]?.currentOperatorName || '',
      adminNotes: ''
    });
    setConflictError('');
    setScheduleModalOpen(true);
  };

  const handleConfirmSchedule = async (e) => {
    e.preventDefault();
    try {
      setConflictError('');
      await apiClient.patch(`/bookings/admin/${selectedBooking._id}/schedule`, {
        ...scheduleForm,
        scheduledStart: new Date(scheduleForm.scheduledStart).toISOString(),
        scheduledEnd: new Date(scheduleForm.scheduledEnd).toISOString()
      });
      setScheduleModalOpen(false);
      fetchBookings();
    } catch (err) {
      setConflictError(err.response?.data?.message || 'Scheduling conflict detected');
    }
  };

  const handleStartWork = async (bookingId) => {
    try {
      await apiClient.patch(`/bookings/admin/${bookingId}/start`);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start work');
    }
  };

  const handleOpenComplete = (booking) => {
    setSelectedBooking(booking);
    setCompleteModalOpen(true);
  };

  const handleOpenDetail = (booking) => {
    setSelectedBooking(booking);
    setDetailModalOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">Pending</span>;
      case 'accepted':
        return <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">Accepted</span>;
      case 'scheduled':
        return <span className="bg-indigo-100 text-indigo-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">Scheduled</span>;
      case 'in_progress':
        return <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full animate-pulse">In Progress</span>;
      case 'completed':
        return <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">Completed</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">Rejected</span>;
      case 'cancelled':
        return <span className="bg-slate-200 text-slate-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full">Cancelled</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bookings & Dispatch Management</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Accept requests, assign available tractors, detect scheduling conflicts, and track field completion.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
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
                  ? 'bg-brand-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-56">
          <input
            type="text"
            value={villageFilter}
            onChange={(e) => setVillageFilter(e.target.value)}
            placeholder="Filter by village..."
            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Farmer Details</th>
                <th className="py-3 px-4">Farming Service</th>
                <th className="py-3 px-4">Village / Location</th>
                <th className="py-3 px-4">Requested Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned Tractor</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((b) => (
                <tr key={b._id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{b.customer?.name}</span>
                    <span className="text-[11px] text-slate-400">{b.customer?.mobile}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800 block">{b.service?.name}</span>
                    <span className="text-[11px] text-slate-500">
                      {b.estimatedQuantity} {b.serviceSnapshot?.pricingUnit} &bull; {formatINR(b.estimatedCost)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-700 block">{b.fieldLocation?.village}</span>
                    <span className="text-[11px] text-slate-400">{b.fieldLocation?.district}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-800 block">
                      {formatISTDate(b.requestedDate, false)}
                    </span>
                    <span className="text-[11px] text-slate-500 capitalize">{b.requestedTimeSlot}</span>
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(b.status)}
                  </td>
                  <td className="py-3 px-4">
                    {b.assignedTractor ? (
                      <div>
                        <span className="font-semibold text-slate-900 block">{b.assignedTractor.name}</span>
                        <span className="text-[11px] text-slate-400">{b.assignedTractor.registrationNumber}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                    {/* Pending actions */}
                    {b.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAccept(b._id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleOpenReject(b)}
                          className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-semibold"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {/* Accepted actions */}
                    {b.status === 'accepted' && (
                      <button
                        onClick={() => handleOpenSchedule(b)}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                      >
                        Schedule Tractor
                      </button>
                    )}

                    {/* Scheduled actions */}
                    {b.status === 'scheduled' && (
                      <>
                        <button
                          onClick={() => handleStartWork(b._id)}
                          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold"
                        >
                          Start Work
                        </button>
                        <button
                          onClick={() => handleOpenSchedule(b)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                        >
                          Reschedule
                        </button>
                      </>
                    )}

                    {/* In Progress action */}
                    {b.status === 'in_progress' && (
                      <button
                        onClick={() => handleOpenComplete(b)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                      >
                        Complete Work
                      </button>
                    )}

                    {/* Details button */}
                    <button
                      onClick={() => handleOpenDetail(b)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg"
                    >
                      Map / Info
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Reject Booking Request</h3>
            <p className="text-xs text-slate-500">
              Provide a clear reason for the farmer (e.g. fully booked, rainfall, etc.)
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal (with Conflict Detection) */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              Schedule Tractor & Check Availability
            </h3>
            <p className="text-xs text-slate-500">
              Assign a tractor to {selectedBooking?.customer?.name}'s field in {selectedBooking?.fieldLocation?.village}.
            </p>

            {conflictError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
                <span>{conflictError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmSchedule} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Tractor *</label>
                <select
                  value={scheduleForm.tractorId}
                  onChange={(e) => {
                    const match = tractors.find((t) => t._id === e.target.value);
                    setScheduleForm({
                      ...scheduleForm,
                      tractorId: e.target.value,
                      operatorName: match?.currentOperatorName || scheduleForm.operatorName
                    });
                  }}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500"
                >
                  {tractors.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.registrationNumber}) &bull; {t.status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={scheduleForm.scheduledStart}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledStart: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={scheduleForm.scheduledEnd}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledEnd: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Driver / Operator</label>
                <input
                  type="text"
                  value={scheduleForm.operatorName}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, operatorName: e.target.value })}
                  placeholder="e.g. Raju Dhakad"
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Admin Dispatch Notes</label>
                <input
                  type="text"
                  value={scheduleForm.adminNotes}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, adminNotes: e.target.value })}
                  placeholder="e.g. Attach double disc plough"
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-brand-700 hover:bg-brand-800 rounded-xl shadow-xs"
                >
                  Verify & Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Work Modal */}
      {completeModalOpen && selectedBooking && (
        <CompleteWorkModal
          booking={selectedBooking}
          onClose={() => setCompleteModalOpen(false)}
          onSuccess={() => {
            setCompleteModalOpen(false);
            fetchBookings();
          }}
        />
      )}

      {/* Field Location / Info Detail Modal */}
      {detailModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">
                Booking Field Location: {selectedBooking.fieldLocation?.village}
              </h3>
              <button onClick={() => setDetailModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p><strong>Customer:</strong> {selectedBooking.customer?.name} ({selectedBooking.customer?.mobile})</p>
              <p><strong>Village:</strong> {selectedBooking.fieldLocation?.village}, District: {selectedBooking.fieldLocation?.district}</p>
              <p><strong>Coordinates:</strong> Lat {selectedBooking.fieldLocation?.latitude}, Lng {selectedBooking.fieldLocation?.longitude}</p>
              {selectedBooking.fieldLocation?.landmark && (
                <p><strong>Landmark:</strong> {selectedBooking.fieldLocation?.landmark}</p>
              )}
              {selectedBooking.customerNotes && (
                <p><strong>Customer Notes:</strong> {selectedBooking.customerNotes}</p>
              )}
            </div>

            <a
              href={`https://www.google.com/maps?q=${selectedBooking.fieldLocation?.latitude},${selectedBooking.fieldLocation?.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-50 text-brand-800 border border-brand-200 rounded-xl text-xs font-bold hover:bg-brand-100"
            >
              <span>Open Field in Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsManagement;

