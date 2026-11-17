import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  Compass,
  MapPin,
  Truck,
  Building2,
  Phone,
  ArrowRight,
  CheckCircle2,
  SlidersHorizontal,
  Navigation,
  Scale,
  X,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { formatIndianCurrency } from '../../utils/formatters';

const FindTractorOwners = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Farmer's field location coordinates & address
  const [coordinates, setCoordinates] = useState({
    latitude: user?.location?.latitude || 22.955,
    longitude: user?.location?.longitude || 76.955,
    village: user?.village || 'Bilkisganj',
    district: user?.district || 'Sehore'
  });

  const [sortBy, setSortBy] = useState('distance');
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);

  // Comparison feature state (up to 3 owners)
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);

  const fetchNearbyOwners = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        village: coordinates.village,
        district: coordinates.district,
        sortBy
      };

      const res = await apiClient.get('/discovery/nearby-owners', { params });
      if (res.data?.success) {
        setOwners(res.data.data.owners || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to find nearby tractor owners');
    } finally {
      setLoading(false);
    }
  }, [coordinates, sortBy]);

  useEffect(() => {
    fetchNearbyOwners();
  }, [fetchNearbyOwners]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoordinates((prev) => ({
          ...prev,
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6))
        }));
        setGpsLoading(false);
      },
      (err) => {
        console.error(err);
        setGpsLoading(false);
        alert('Could not detect GPS location. You can specify your village name above.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const toggleComparison = (owner) => {
    if (selectedForComparison.some((o) => o._id === owner._id)) {
      setSelectedForComparison(selectedForComparison.filter((o) => o._id !== owner._id));
    } else {
      if (selectedForComparison.length >= 3) {
        alert('You can compare a maximum of 3 tractor owners at a time.');
        return;
      }
      setSelectedForComparison([...selectedForComparison, owner]);
    }
  };

  const handleBookOwner = (owner, service = null) => {
    navigate('/customer/book', {
      state: {
        preselectedOwnerId: owner._id,
        preselectedOwner: owner,
        preselectedServiceId: service ? service._id : (owner.services?.[0]?._id || '')
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-full text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Multi-Owner Tractor Marketplace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Find Nearby Tractor Owners
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            अपने खेत के पास उपलब्ध ट्रैक्टर मालिकों की खोज करें &bull; Compare real-time distance, custom prices, machine availability, and select your preferred contractor.
          </p>
        </div>

        {selectedForComparison.length > 0 && (
          <button
            type="button"
            onClick={() => setComparisonModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Scale className="w-4 h-4" />
            <span>Compare {selectedForComparison.length} Owners Side-by-Side</span>
          </button>
        )}
      </div>

      {/* Field Location Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs sm:text-sm">
            <MapPin className="w-4 h-4 text-brand-700" />
            <span>Farmer's Field Location (खेत का स्थान):</span>
          </div>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={gpsLoading}
            className="inline-flex items-center space-x-1.5 text-xs text-brand-700 font-semibold hover:text-brand-800 cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>{gpsLoading ? 'Detecting GPS...' : 'Use My Live GPS Location'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Village (गाँव)</label>
            <input
              type="text"
              value={coordinates.village}
              onChange={(e) => setCoordinates({ ...coordinates, village: e.target.value })}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
              placeholder="e.g. Bilkisganj"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">District (ज़िला)</label>
            <input
              type="text"
              value={coordinates.district}
              onChange={(e) => setCoordinates({ ...coordinates, district: e.target.value })}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
              placeholder="e.g. Sehore"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Latitude</label>
            <input
              type="number"
              step="any"
              value={coordinates.latitude || ''}
              onChange={(e) => setCoordinates({ ...coordinates, latitude: parseFloat(e.target.value) || null })}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Longitude</label>
            <input
              type="number"
              step="any"
              value={coordinates.longitude || ''}
              onChange={(e) => setCoordinates({ ...coordinates, longitude: parseFloat(e.target.value) || null })}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Sorting & Results Count Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-200">
        <div className="text-xs text-slate-600">
          Showing <span className="font-bold text-slate-900">{owners.length}</span> approved tractor contractors serving your area.
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-500 font-semibold flex items-center space-x-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Sort By:</span>
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-brand-500 cursor-pointer"
          >
            <option value="distance">Nearest Distance (निकटतम दूरी)</option>
            <option value="price">Lowest Starting Price (न्यूनतम दर)</option>
            <option value="availability">Tractor Availability (उपलब्ध मशीनें)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Owners Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full p-16 text-center text-xs text-slate-500 flex flex-col items-center space-y-2">
            <div className="w-7 h-7 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Locating approved tractor contractors near your field...</span>
          </div>
        ) : owners.length === 0 ? (
          <div className="col-span-full p-16 text-center text-xs text-slate-500 border border-dashed rounded-2xl bg-white space-y-2">
            <p className="text-sm font-semibold text-slate-700">No tractor owners found in this radius.</p>
            <p>Try adjusting your field village or selecting coordinates closer to neighboring towns.</p>
          </div>
        ) : (
          owners.map((owner) => {
            const isComparing = selectedForComparison.some((o) => o._id === owner._id);
            return (
              <div
                key={owner._id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-amber-400 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Bar: Comparison Checkbox & Distance Badge */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-1.5 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isComparing}
                        onChange={() => toggleComparison(owner)}
                        className="rounded-md border-slate-300 text-brand-700 focus:ring-brand-500 cursor-pointer"
                      />
                      <span className="font-semibold text-[11px]">Compare</span>
                    </label>

                    {owner.distanceKm !== null ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                        <Compass className="w-3 h-3 text-emerald-600" />
                        <span>{owner.distanceKm} km away</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Nearby District</span>
                    )}
                  </div>

                  {/* Business Name & Owner Info */}
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 flex items-center space-x-1.5">
                      <Building2 className="w-4 h-4 text-amber-700 flex-shrink-0" />
                      <span>{owner.businessName}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Owner: <span className="font-medium text-slate-700">{owner.name}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>Depot: {owner.village}, {owner.district} (Service Radius: {owner.serviceRadiusKm} km)</span>
                    </p>
                  </div>

                  {/* Machine Availability Pill */}
                  <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5 text-slate-700">
                      <Truck className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-semibold">
                        {owner.availableTractorsCount} of {owner.tractorsCount} Tractors Free
                      </span>
                    </div>
                    {owner.hasAvailableTractors ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        Available Now
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                        Currently Working
                      </span>
                    )}
                  </div>

                  {/* Services & Independent Prices */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Offered Services & Prices:
                    </p>
                    {owner.services && owner.services.length > 0 ? (
                      <div className="space-y-1">
                        {owner.services.map((svc) => (
                          <div
                            key={svc._id}
                            className="p-1.5 bg-amber-50/50 rounded-lg flex items-center justify-between text-xs border border-amber-100"
                          >
                            <span className="font-medium text-slate-800 truncate mr-2">{svc.name}</span>
                            <span className="font-bold text-amber-900 whitespace-nowrap">
                              {formatIndianCurrency(svc.currentPrice)}/{svc.pricingUnit?.replace('per_', '')}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No specific services listed yet.</p>
                    )}
                  </div>
                </div>

                {/* Book With This Owner Button */}
                <div className="pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleBookOwner(owner)}
                    className="w-full py-2.5 px-3 bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
                  >
                    <span>Book With This Owner</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Side-by-Side Comparison Modal */}
      {comparisonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Scale className="w-5 h-5 text-brand-700" />
                <span>Compare Tractor Contractors Side-by-Side</span>
              </h3>
              <button
                type="button"
                onClick={() => setComparisonModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {selectedForComparison.map((owner) => (
                <div
                  key={owner._id}
                  className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{owner.businessName}</h4>
                      <p className="text-xs text-slate-500">Owner: {owner.name}</p>
                    </div>

                    <div className="p-2 bg-white rounded-xl text-xs space-y-1 border">
                      <p className="font-semibold text-emerald-800">
                        Distance: {owner.distanceKm !== null ? `${owner.distanceKm} km` : 'Local Area'}
                      </p>
                      <p className="text-slate-600">
                        Fleet: {owner.availableTractorsCount} of {owner.tractorsCount} free
                      </p>
                      <p className="text-slate-600">
                        Radius: {owner.serviceRadiusKm} km
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-slate-500">Service Rates:</p>
                      {owner.services?.map((s) => (
                        <div key={s._id} className="text-xs flex justify-between py-0.5 border-b border-slate-200">
                          <span className="text-slate-700 truncate pr-1">{s.name}</span>
                          <span className="font-bold text-slate-900 whitespace-nowrap">
                            {formatIndianCurrency(s.currentPrice)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setComparisonModalOpen(false);
                      handleBookOwner(owner);
                    }}
                    className="w-full py-2 bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                  >
                    Select & Book This Owner
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindTractorOwners;

