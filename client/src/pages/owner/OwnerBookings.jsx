import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/axios';
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  CheckSquare,
  Truck,
  User,
  Phone,
  MapPin,
  AlertCircle,
  FileCheck2,
  ChevronRight
} from 'lucide-react';
import { formatIndianCurrency, formatIndianDateTime } from '../../utils/formatters';

const STATUS_TABS = [
  { label: 'All Requests', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled / Rejected', value: 'cancelled' }
];

const OwnerBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [tractors, setTractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Modals
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null);

  // Modal forms
  const [rejectionReason, setRejectionReason] = useState('');
  const [scheduleForm, setScheduleForm] = useState({
    tractorId: '',
    scheduledStart: '',
    scheduledEnd: '',
    operatorName: ''
  });
  const [completeForm, setCompleteForm] = useState({
    actualQuantity: '',
    dieselUsedLiters: 0,
    operatorName: '',
    notes: ''
  });

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (statusFilter) params.status = statusFilter;

      const [bRes, tRes] = await Promise.all([
        apiClient.get('/bookings/owner/all', { params }),
        apiClient.get('/tractors')
      ]);

      if (bRes.data?.success) {
        setBookings(bRes.data.data.bookings || []);
      }
      if (tRes.data?.success) {
        setTractors(tRes.data.data.tractors || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Status transitions
  const handleAccept = async (bookingId) => {
    try {
      setActionLoading(bookingId);
      setError('');
      const res = await apiClient.patch(`/bookings/owner/${bookingId}/accept`);
      if (res.data?.success) {
        setSuccess('Booking accepted! You can now assign a tractor and schedule the date.');
        await fetchBookings();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!activeBooking) return;
    try {
      setActionLoading(activeBooking._id);
      setError('');
      const res = await apiClient.patch(`/bookings/owner/${activeBooking._id}/reject`, {
        rejectionReason: rejectionReason.trim()
      });
      if (res.data?.success) {
        setSuccess('Booking rejected.');
        setRejectModalOpen(false);
        setActiveBooking(null);
        await fetchBookings();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject booking');
    } finally {
      setActionLoading(null);
    }
  };

  const openScheduleModal = (b) => {
    setActiveBooking(b);
    // Suggest default start/end dates
    const dateStr = b.requestedDate ? b.requestedDate.slice(0, 10) : new Date().toISOString().slice(0, 10);
    setScheduleForm({
      tractorId: tractors.length > 0 ? tractors[0]._id : '',
      scheduledStart: `${dateStr}T08:00`,
      scheduledEnd: `${dateStr}T13:00`,
      operatorName: ''
    });
    setScheduleModalOpen(true);
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!activeBooking) return;
    try {
      setActionLoading(activeBooking._id);
      setError('');

      const res = await apiClient.patch(`/bookings/owner/${activeBooking._id}/schedule`, {
        tractorId: scheduleForm.tractorId,
        scheduledStart: new Date(scheduleForm.scheduledStart).toISOString(),
        scheduledEnd: new Date(scheduleForm.scheduledEnd).toISOString(),
        operatorName: scheduleForm.operatorName.trim() || undefined
      });

      if (res.data?.success) {
        setSuccess('Tractor successfully assigned and booking scheduled!');
        setScheduleModalOpen(false);
        setActiveBooking(null);
        await fetchBookings();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartWork = async (bookingId) => {
    try {
      setActionLoading(bookingId);
      setError('');
      const res = await apiClient.patch(`/bookings/owner/${bookingId}/start`);
      if (res.data?.success) {
        setSuccess('Job marked as in progress (कार्य प्रारंभ)!');
        await fetchBookings();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start work');
    } finally {
      setActionLoading(null);
    }
  };

  const openCompleteModal = (b) => {
    setActiveBooking(b);
    setCompleteForm({
      actualQuantity: b.estimatedQuantity || '',
      dieselUsedLiters: 0,
      operatorName: b.assignedOperatorName || '',
      notes: ''
    });
    setCompleteModalOpen(true);
  };

  const handleCompleteWork = async (e) => {
    e.preventDefault();
    if (!activeBooking) return;
    try {
      setActionLoading(activeBooking._id);
      setError('');

      const res = await apiClient.post(`/work-records/complete-booking/${activeBooking._id}`, {
        actualQuantity: Number(completeForm.actualQuantity),
        dieselUsedLiters: Number(completeForm.dieselUsedLiters) || 0,
        operatorName: completeForm.operatorName.trim() || undefined,
        workNotes: completeForm.notes.trim() || undefined
      });

      if (res.data?.success) {
        setSuccess('Work completed successfully! Work record & billing ledger created.');
        setCompleteModalOpen(false);
        setActiveBooking(null);
        await fetchBookings();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete job');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <CalendarDays className="w-6 h-6 text-amber-700" />
            <span>Booking Requests & Job Schedule</span>
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Accept farmer requests, schedule available tractors without overlap, track fieldwork, and generate bills.
          </p>
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
      <div className="flex gap-1.5 overflow-x-auto pb-1 bg-white p-2 rounded-2xl border border-slate-200">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap cursor-pointer transition-colors ${
              statusFilter === tab.value
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 flex justify-center bg-white rounded-2xl border">
            <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 border border-dashed rounded-2xl bg-white">
            No bookings found under this filter.
          </div>
        ) : (
          bookings.map((b) => {
            const isAction = actionLoading === b._id;
            return (
              <div
                key={b._id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-amber-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-sm text-slate-900">
                        {b.customer?.name}
                      </span>
                      <a
                        href={`tel:+91${b.customer?.mobile}`}
                        className="text-xs text-amber-700 font-semibold hover:underline inline-flex items-center space-x-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>+91 {b.customer?.mobile}</span>
                      </a>
                    </div>

                    <p className="text-xs font-bold text-amber-900">
                      Service: {b.serviceSnapshot?.name} &bull; {b.estimatedQuantity} {b.serviceSnapshot?.pricingUnit?.replace('per_', '')}
                    </p>

                    <p className="text-xs text-slate-500 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Field Location: {b.fieldLocation?.village}, {b.fieldLocation?.district}
                        {b.fieldLocation?.landmark ? ` (Landmark: ${b.fieldLocation.landmark})` : ''}
                      </span>
                    </p>
                    {b.customerNotes && (
                      <p className="text-[11px] text-slate-500 italic">Farmer note: "{b.customerNotes}"</p>
                    )}
                  </div>

                  <div className="flex flex-col sm:items-end space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500">
                        Requested: {formatIndianDateTime(b.requestedDate)} ({b.requestedTimeSlot})
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          b.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : b.status === 'accepted'
                            ? 'bg-purple-100 text-purple-800'
                            : b.status === 'scheduled'
                            ? 'bg-blue-100 text-blue-800'
                            : b.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-800 animate-pulse'
                            : b.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    <div className="text-base font-extrabold text-slate-900">
                      Est. {formatIndianCurrency(b.estimatedCost)}
                    </div>
                  </div>
                </div>

                {/* Assigned Tractor Info (if scheduled) */}
                {b.assignedTractor && (
                  <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between text-xs text-blue-900">
                    <div className="flex items-center space-x-2">
                      <Truck className="w-4 h-4 text-blue-700" />
                      <span>
                        Assigned Machine: <span className="font-bold">{b.assignedTractor.name}</span> ({b.assignedTractor.registrationNumber})
                      </span>
                    </div>
                    {b.assignedOperatorName && (
                      <span className="text-blue-800 font-medium">Driver: {b.assignedOperatorName}</span>
                    )}
                  </div>
                )}

                {/* Actions Bar */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400">
                    Booking ID: <span className="font-mono text-slate-600">{b._id}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {b.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          disabled={isAction}
                          onClick={() => handleAccept(b._id)}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer inline-flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Accept Request</span>
                        </button>
                        <button
                          type="button"
                          disabled={isAction}
                          onClick={() => {
                            setActiveBooking(b);
                            setRejectionReason('');
                            setRejectModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 font-bold text-xs rounded-xl cursor-pointer inline-flex items-center space-x-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}

                    {b.status === 'accepted' && (
                      <button
                        type="button"
                        disabled={isAction}
                        onClick={() => openScheduleModal(b)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer inline-flex items-center space-x-1"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Assign Tractor & Schedule</span>
                      </button>
                    )}

                    {b.status === 'scheduled' && (
                      <button
                        type="button"
                        disabled={isAction}
                        onClick={() => handleStartWork(b._id)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer inline-flex items-center space-x-1"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Start Work (कार्य प्रारंभ)</span>
                      </button>
                    )}

                    {b.status === 'in_progress' && (
                      <button
                        type="button"
                        disabled={isAction}
                        onClick={() => openCompleteModal(b)}
                        className="px-4 py-1.5 bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer inline-flex items-center space-x-1"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Complete Work & Bill Farmer</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && activeBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Reject Booking Request
            </h3>
            <p className="text-xs text-slate-600">
              Please enter the reason for rejecting this booking from {activeBooking.customer?.name}:
            </p>
            <textarea
              rows={3}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Tractor currently undergoing servicing, or distance outside operational window."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
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
                disabled={!rejectionReason.trim()}
                onClick={handleReject}
                className="px-4 py-1.5 text-xs bg-red-600 text-white font-bold hover:bg-red-700 rounded-xl shadow-xs disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {scheduleModalOpen && activeBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Schedule Tractor & Assign Machine
            </h3>
            <p className="text-xs text-slate-600">
              Assign one of your tractors for <span className="font-semibold">{activeBooking.serviceSnapshot?.name}</span>. The system will ensure this machine is not double-booked.
            </p>

            <form onSubmit={handleSchedule} className="space-y-4" noValidate>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Tractor from Fleet *
                </label>
                <select
                  required
                  value={scheduleForm.tractorId}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, tractorId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Tractor --</option>
                  {tractors.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.registrationNumber}) - {t.status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduleForm.scheduledStart}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledStart: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estimated End Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduleForm.scheduledEnd}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledEnd: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Operator / Driver (चालक)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mukesh Yadav"
                  value={scheduleForm.operatorName}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, operatorName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!scheduleForm.tractorId}
                  className="px-4 py-1.5 text-xs bg-blue-600 text-white font-bold hover:bg-blue-700 rounded-xl shadow-xs disabled:opacity-50"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Work & Create Work Record Modal */}
      {completeModalOpen && activeBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Complete Job & Generate Billing Record
            </h3>
            <p className="text-xs text-slate-600">
              Log actual work completed for {activeBooking.customer?.name}. The unit rate of{' '}
              <span className="font-semibold">{formatIndianCurrency(activeBooking.serviceSnapshot?.unitPrice)}</span>/
              {activeBooking.serviceSnapshot?.pricingUnit?.replace('per_', '')} will be applied automatically.
            </p>

            <form onSubmit={handleCompleteWork} className="space-y-4" noValidate>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Actual Quantity ({activeBooking.serviceSnapshot?.pricingUnit?.replace('per_', '')}) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={completeForm.actualQuantity}
                    onChange={(e) => setCompleteForm({ ...completeForm, actualQuantity: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Diesel Used (Liters / डीजल खपत)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="e.g. 12.5"
                    value={completeForm.dieselUsedLiters}
                    onChange={(e) => setCompleteForm({ ...completeForm, dieselUsedLiters: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operating Driver (चालक का नाम)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mukesh Yadav"
                  value={completeForm.operatorName}
                  onChange={(e) => setCompleteForm({ ...completeForm, operatorName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Completion Notes / Field Condition
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5 acres double ploughing completed smoothly."
                  value={completeForm.notes}
                  onChange={(e) => setCompleteForm({ ...completeForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex justify-between items-center">
                <span>Calculated Total:</span>
                <span className="font-extrabold text-sm">
                  {formatIndianCurrency(
                    Number(completeForm.actualQuantity || 0) * (activeBooking.serviceSnapshot?.unitPrice || 0)
                  )}
                </span>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setCompleteModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!completeForm.actualQuantity}
                  className="px-4 py-1.5 text-xs bg-brand-700 text-white font-bold hover:bg-brand-800 rounded-xl shadow-xs disabled:opacity-50"
                >
                  Generate Work Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerBookings;

