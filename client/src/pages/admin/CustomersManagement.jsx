import React, { useState, useEffect } from 'react';
import { Users, Search, Phone, MapPin, Eye, X, AlertCircle } from 'lucide-react';
import apiClient from '../../api/axios';
import { formatINR, formatISTDate } from '../../utils/formatters';

const CustomersManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Customer Details Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCustomerData, setSelectedCustomerData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchCustomers = async () => {
    try {
      let url = `/customers?limit=50`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await apiClient.get(url);
      if (res.data?.success) {
        setCustomers(res.data.data.customers || []);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const handleOpenDetail = async (customerId) => {
    setLoadingDetail(true);
    setDetailModalOpen(true);
    try {
      const res = await apiClient.get(`/customers/${customerId}`);
      if (res.data?.success) {
        setSelectedCustomerData(res.data.data);
      }
    } catch (err) {
      alert('Failed to load customer details');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleToggleStatus = async (customerId, currentStatus) => {
    try {
      await apiClient.patch(`/customers/${customerId}/status`, {
        isActive: !currentStatus
      });
      fetchCustomers();
      if (selectedCustomerData?.customer?._id === customerId) {
        setSelectedCustomerData({
          ...selectedCustomerData,
          customer: {
            ...selectedCustomerData.customer,
            isActive: !currentStatus
          }
        });
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Farmer Customer Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered farmers across Sehore and neighboring villages. View booking records, payment history, and account activity.
          </p>
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search farmer name or mobile..."
            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Farmer Name</th>
                <th className="py-3 px-4">Mobile Number</th>
                <th className="py-3 px-4">Village</th>
                <th className="py-3 px-4">District & State</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                  <td className="py-3 px-4 font-mono text-slate-700">{c.mobile}</td>
                  <td className="py-3 px-4 text-slate-800">{c.village || '—'}</td>
                  <td className="py-3 px-4 text-slate-500">{c.district}, {c.state}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleStatus(c._id, c.isActive)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.isActive
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {c.isActive ? 'Active' : 'Deactivated'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleOpenDetail(c._id)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>History & Dues</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Drawer */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedCustomerData?.customer?.name || 'Loading...'}
                </h3>
                <p className="text-xs text-slate-500">
                  Mobile: {selectedCustomerData?.customer?.mobile} &bull; Village: {selectedCustomerData?.customer?.village}
                </p>
              </div>
              <button onClick={() => setDetailModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading history...</div>
            ) : (
              <div className="space-y-4">
                {/* Financial Dues Card */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total Billed</span>
                    <strong className="text-slate-900 font-extrabold">
                      {formatINR(selectedCustomerData?.dues?.totalBilled || 0)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total Paid</span>
                    <strong className="text-emerald-700 font-extrabold">
                      {formatINR(selectedCustomerData?.dues?.totalPaid || 0)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Balance Due</span>
                    <strong className={`font-extrabold ${selectedCustomerData?.dues?.totalDue > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
                      {formatINR(selectedCustomerData?.dues?.totalDue || 0)}
                    </strong>
                  </div>
                </div>

                {/* Booking History */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Recent Bookings
                  </h4>
                  {selectedCustomerData?.bookings?.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No bookings recorded.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedCustomerData?.bookings?.map((b) => (
                        <div key={b._id} className="p-3 bg-white border border-slate-200 rounded-xl text-xs flex justify-between items-center">
                          <div>
                            <span className="font-bold text-slate-900">{b.service?.name}</span>
                            <span className="text-slate-400 text-[10px] block">
                              {formatISTDate(b.requestedDate, false)} &bull; {b.status}
                            </span>
                          </div>
                          <span className="font-extrabold text-slate-900">
                            {formatINR(b.estimatedCost)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersManagement;

