import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { defaultIcon } from '../../utils/leafletIcons';
import {
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Truck,
  FileCheck2,
  Banknote
} from 'lucide-react';
import apiClient from '../../api/axios';
import { formatINR, formatISTDate } from '../../utils/formatters';

const BookingDetail = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [workRecord, setWorkRecord] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await apiClient.get(`/bookings/my/${id}`);
        if (res.data?.success) {
          const b = res.data.data.booking;
          setBooking(b);

          // If booking is completed, fetch associated WorkRecord & payments
          if (b.status === 'completed') {
            const wrRes = await apiClient.get(`/work-records/booking/${id}`);
            if (wrRes.data?.success && wrRes.data.data.workRecord) {
              const wr = wrRes.data.data.workRecord;
              setWorkRecord(wr);

              const payRes = await apiClient.get(`/payments/work-record/${wr._id}`);
              if (payRes.data?.success) {
                setPayments(payRes.data.data.payments || []);
              }
            }
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-500 mt-3">Loading booking details...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">{error || 'Booking Not Found'}</h2>
        <Link to="/customer/my-bookings" className="text-xs text-brand-700 font-bold hover:underline">
          &larr; Back to My Bookings
        </Link>
      </div>
    );
  }

  const { fieldLocation } = booking;
  const lat = fieldLocation?.latitude || 23.1989;
  const lng = fieldLocation?.longitude || 77.0845;
  const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Top back button & title */}
      <div className="flex items-center space-x-3">
        <Link
          to="/customer/my-bookings"
          className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Booking ID: #{booking._id.slice(-6).toUpperCase()}
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">{booking.service?.name}</h1>
        </div>
      </div>

      {/* Overview Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-200 shadow-xs space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
          <div>
            <span className="text-xs text-slate-500 block">Booking Status (स्थिति)</span>
            <span className="inline-block mt-1 font-bold text-sm uppercase px-3 py-1 rounded-full bg-brand-50 text-brand-800 border border-brand-200">
              {booking.status}
            </span>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-500 block">Pricing Snapshot at Booking Time</span>
            <span className="text-xl font-extrabold text-slate-900">
              {formatINR(booking.serviceSnapshot.unitPrice)} / {booking.serviceSnapshot.pricingUnit}
            </span>
            <span className="text-xs text-slate-500 block">
              Estimated Total: <strong>{formatINR(booking.estimatedCost)}</strong> ({booking.estimatedQuantity} units)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
          <div>
            <span className="text-slate-400 block mb-0.5">Requested Date:</span>
            <strong className="text-slate-800">{formatISTDate(booking.requestedDate, false)}</strong>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Preferred Slot:</span>
            <strong className="text-slate-800 capitalize">{booking.requestedTimeSlot}</strong>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Crop Type:</span>
            <strong className="text-slate-800">{booking.cropType || 'Not specified'}</strong>
          </div>
        </div>

        {booking.customerNotes && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
            <strong>Customer Instructions:</strong> {booking.customerNotes}
          </div>
        )}
      </div>

      {/* Field Location with Map */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-brand-700" />
            <span>Field Location (खेत का स्थान)</span>
          </h2>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-xs font-semibold text-brand-700 hover:text-brand-800 hover:underline"
          >
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <p className="text-xs text-slate-600">
          Village: <strong>{fieldLocation.village}</strong>, District: {fieldLocation.district}, State: {fieldLocation.state}
          {fieldLocation.landmark && ` (Landmark: ${fieldLocation.landmark})`}
        </p>

        {/* Embedded Leaflet Map */}
        <div className="h-56 w-full rounded-2xl overflow-hidden border border-slate-200">
          <MapContainer center={[lat, lng]} zoom={14} scrollWheelZoom={false} className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[lat, lng]} icon={defaultIcon} />
          </MapContainer>
        </div>
      </div>

      {/* Assigned Tractor Info (if scheduled) */}
      {booking.assignedTractor && (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Truck className="w-4 h-4 text-brand-700" />
            <span>Assigned Tractor & Driver Details</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-slate-400 block mb-0.5">Tractor Model:</span>
              <strong className="text-slate-900">{booking.assignedTractor.name}</strong>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Registration Number:</span>
              <strong className="text-slate-900">{booking.assignedTractor.registrationNumber}</strong>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Assigned Driver:</span>
              <strong className="text-slate-900">{booking.assignedOperatorName || 'Field Operator'}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Completed Work Record (if completed) */}
      {workRecord && (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-emerald-200 shadow-xs space-y-5 sm:space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <FileCheck2 className="w-5 h-5 text-emerald-600" />
              <span>Completed Field Work Record</span>
            </h2>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
              Work Confirmed
            </span>
          </div>

          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block">Actual Quantity Worked</span>
              <strong className="text-base font-extrabold text-slate-900">
                {workRecord.actualQuantity} {workRecord.serviceSnapshot.pricingUnit}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block">Working Hours</span>
              <strong className="text-base font-extrabold text-slate-900">
                {workRecord.workingHours} hrs
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block">Total Final Charge</span>
              <strong className="text-base font-extrabold text-slate-900">
                {formatINR(workRecord.totalAmount)}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block">Balance Due</span>
              <strong className={`text-base font-extrabold ${workRecord.balanceDue > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                {formatINR(workRecord.balanceDue)}
              </strong>
            </div>
          </div>

          {/* Payment Receipts */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Payments Received ({payments.length})
            </h3>
            {payments.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No payments recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div
                    key={p._id}
                    className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800 uppercase">{p.method} Payment</span>
                      <span className="text-slate-400 block text-[11px]">{formatISTDate(p.paidAt)}</span>
                    </div>
                    <span className="font-extrabold text-emerald-700 text-sm">
                      {formatINR(p.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status History Timeline */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">Order Progress Timeline</h2>
        <div className="border-l-2 border-brand-200 pl-4 space-y-4 text-xs">
          {booking.statusHistory?.map((h, idx) => (
            <div key={idx} className="relative">
              <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-brand-600 ring-4 ring-white"></div>
              <p className="font-bold text-slate-900 capitalize">{h.status}</p>
              <p className="text-slate-500">{h.note || 'Status updated'}</p>
              <span className="text-[10px] text-slate-400">{formatISTDate(h.changedAt)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;

