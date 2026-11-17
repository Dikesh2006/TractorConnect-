import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/axios';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  MapPin,
  Phone,
  Compass,
  Building2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { formatIndianDateTime } from '../../utils/formatters';

const AdminOwners = () => {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchOwners = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await apiClient.get('/auth/owners', { params });
      if (res.data?.success) {
        setOwners(res.data.data.owners || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch tractor owners');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    fetchOwners();
  }, [fetchOwners]);

  const handleUpdateApproval = async (ownerId, approvalStatus, reason = '') => {
    try {
      setActionLoading(ownerId);
      setError('');
      setActionSuccess('');

      const res = await apiClient.patch(`/auth/owners/${ownerId}/approval`, {
        approvalStatus,
        rejectionReason: reason
      });

      if (res.data?.success) {
        setActionSuccess(`Owner account successfully marked as ${approvalStatus}!`);
        // Refresh owners
        await fetchOwners();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Action failed');
    } finally {
      setActionLoading(null);
      setRejectModalOpen(false);
      setSelectedOwner(null);
      setRejectionReason('');
    }
  };

  const openRejectModal = (owner) => {
    setSelectedOwner(owner);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  // Metrics
  const totalCount = owners.length;
  const pendingCount = owners.filter((o) => o.approvalStatus === 'pending').length;
  const approvedCount = owners.filter((o) => o.approvalStatus === 'approved').length;
  const otherCount = owners.filter((o) => ['rejected', 'suspended'].includes(o.approvalStatus)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-brand-700" />
            <span>Tractor Owners & Marketplace Fleet</span>
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Review, verify, and approve independent tractor contractors serving farmers on TractorConnect.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchOwners}
          disabled={loading}
          className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-200 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">All Owners</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalCount}</p>
        </div>

        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 shadow-xs">
          <div className="flex justify-between items-center">
            <p className="text-xs text-amber-800 font-bold">Pending Review</p>
            {pendingCount > 0 && (
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping"></span>
            )}
          </div>
          <p className="text-2xl font-extrabold text-amber-900 mt-1">{pendingCount}</p>
        </div>

        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 shadow-xs">
          <p className="text-xs text-emerald-800 font-bold">Approved & Active</p>
          <p className="text-2xl font-extrabold text-emerald-900 mt-1">{approvedCount}</p>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-600 font-medium">Suspended / Rejected</p>
          <p className="text-2xl font-extrabold text-slate-800 mt-1">{otherCount}</p>
        </div>
      </div>

      {/* Notification alerts */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-2xl border border-slate-200">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by business name, owner name, mobile, village, or district..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { label: 'All', value: '' },
            { label: 'Pending', value: 'pending' },
            { label: 'Approved', value: 'approved' },
            { label: 'Suspended', value: 'suspended' },
            { label: 'Rejected', value: 'rejected' }
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === tab.value
                  ? 'bg-brand-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Owners Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs flex flex-col items-center space-y-2">
            <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading tractor owners...</span>
          </div>
        ) : owners.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No tractor owners found matching your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Business & Owner</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Base Location & Radius</th>
                  <th className="py-3 px-4">Registered On</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {owners.map((owner) => {
                  const isAction = actionLoading === owner._id;
                  const isPending = owner.approvalStatus === 'pending';
                  const isApproved = owner.approvalStatus === 'approved';

                  return (
                    <tr key={owner._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                          <Building2 className="w-4 h-4 text-amber-700 flex-shrink-0" />
                          <span>{owner.businessName || `${owner.name}'s Tractor Seva`}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Owner: <span className="font-medium text-slate-700">{owner.name}</span>
                        </div>
                        {owner.serviceDescription && (
                          <p className="text-[10px] text-slate-500 italic mt-1 max-w-xs truncate">
                            "{owner.serviceDescription}"
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <a
                          href={`tel:+91${owner.mobile}`}
                          className="font-semibold text-brand-700 hover:underline flex items-center space-x-1"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>+91 {owner.mobile}</span>
                        </a>
                        {owner.email && (
                          <div className="text-[10px] text-slate-400 mt-0.5">{owner.email}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1 text-slate-700 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {owner.village ? `${owner.village}, ` : ''}
                            {owner.district || 'Sehore'}
                          </span>
                        </div>
                        <div className="text-[11px] text-amber-800 font-semibold flex items-center space-x-1 mt-0.5">
                          <Compass className="w-3 h-3 text-amber-600" />
                          <span>Radius: {owner.serviceRadiusKm || 25} km</span>
                        </div>
                        {owner.location?.latitude && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            GPS: {owner.location.latitude.toFixed(3)}, {owner.location.longitude.toFixed(3)}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{formatIndianDateTime(owner.createdAt)}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            owner.approvalStatus === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : owner.approvalStatus === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : owner.approvalStatus === 'suspended'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {owner.approvalStatus}
                        </span>
                        {owner.rejectionReason && (
                          <p className="text-[10px] text-red-600 mt-1 max-w-xs">
                            Reason: {owner.rejectionReason}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {isPending && (
                            <>
                              <button
                                type="button"
                                disabled={isAction}
                                onClick={() => handleUpdateApproval(owner._id, 'approved')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-xs cursor-pointer disabled:opacity-50 inline-flex items-center space-x-1"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                disabled={isAction}
                                onClick={() => openRejectModal(owner)}
                                className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 font-bold text-[11px] rounded-lg cursor-pointer disabled:opacity-50 inline-flex items-center space-x-1"
                              >
                                <XCircle className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {isApproved && (
                            <button
                              type="button"
                              disabled={isAction}
                              onClick={() => handleUpdateApproval(owner._id, 'suspended', 'Suspended by admin')}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg cursor-pointer disabled:opacity-50 inline-flex items-center space-x-1"
                            >
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>Suspend</span>
                            </button>
                          )}

                          {['suspended', 'rejected'].includes(owner.approvalStatus) && (
                            <button
                              type="button"
                              disabled={isAction}
                              onClick={() => handleUpdateApproval(owner._id, 'approved')}
                              className="px-2.5 py-1 bg-brand-700 hover:bg-brand-800 text-white font-bold text-[11px] rounded-lg shadow-xs cursor-pointer disabled:opacity-50 inline-flex items-center space-x-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Reactivate / Approve</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && selectedOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Reject Tractor Owner Application
            </h3>
            <p className="text-xs text-slate-600">
              You are rejecting <span className="font-semibold">{selectedOwner.businessName}</span> ({selectedOwner.name}). Please provide a brief reason for this decision:
            </p>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Incomplete details, outside operational area, or unverified contact number."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
            />

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 font-semibold hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdateApproval(selectedOwner._id, 'rejected', rejectionReason)}
                className="px-4 py-1.5 text-xs bg-red-600 text-white font-bold hover:bg-red-700 rounded-xl shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOwners;

