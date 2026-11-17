import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { defaultIcon } from '../utils/leafletIcons';
import { MapPin, Navigation, Search, AlertCircle, CheckCircle } from 'lucide-react';

const NOMINATIM_BASE =
  import.meta.env.VITE_NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org';

// Default center: Sehore, Madhya Pradesh, India
const DEFAULT_CENTER = [23.1989, 77.0845];
const DEFAULT_ZOOM = 12;

// Map click listener component
function LocationMarker({ position, setPosition, onLocationChange }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      onLocationChange(lat, lng);
    }
  });

  return position ? <Marker position={position} icon={defaultIcon} /> : null;
}

const FieldLocationPicker = ({ value, onChange, errors }) => {
  const [position, setPosition] = useState(() => {
    if (value?.latitude && value?.longitude) {
      return [value.latitude, value.longitude];
    }
    return DEFAULT_CENTER;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('info'); // 'info' | 'success' | 'error'

  const mapRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Debounced Nominatim reverse geocode when marker moves
  const handleLocationChange = useCallback(
    async (lat, lng) => {
      setStatusMessage('Locating address details...');
      setStatusType('info');

      try {
        const response = await fetch(
          `${NOMINATIM_BASE}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'en,hi'
            }
          }
        );

        if (!response.ok) throw new Error('Geocoding service unavailable');
        const data = await response.json();
        const address = data.address || {};

        const detectedVillage =
          address.village || address.suburb || address.town || address.hamlet || address.city || '';
        const detectedDistrict =
          address.state_district || address.county || address.district || 'Sehore';
        const detectedState = address.state || 'Madhya Pradesh';
        const detectedPincode = address.postcode || '';

        onChange({
          latitude: lat,
          longitude: lng,
          village: detectedVillage || value?.village || '',
          tehsil: address.county || value?.tehsil || '',
          district: detectedDistrict || value?.district || '',
          state: detectedState,
          pincode: detectedPincode || value?.pincode || '',
          fullAddress: data.display_name || value?.fullAddress || '',
          landmark: value?.landmark || ''
        });

        setStatusMessage(
          detectedVillage ? `Pinned: ${detectedVillage}, ${detectedDistrict}` : 'Coordinates pinned'
        );
        setStatusType('success');
      } catch {
        // Fallback: keep manual coordinates without failing
        onChange({
          ...value,
          latitude: lat,
          longitude: lng
        });
        setStatusMessage('Location marked on map (you can edit village/district below)');
        setStatusType('info');
      }
    },
    [onChange, value]
  );

  // Geolocation button ("Use My Current Location")
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setStatusMessage('Geolocation is not supported by your browser');
      setStatusType('error');
      return;
    }

    setIsLocating(true);
    setStatusMessage('Acquiring your GPS location...');
    setStatusType('info');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 15);
        }
        handleLocationChange(latitude, longitude);
      },
      (err) => {
        setIsLocating(false);
        let msg = 'Could not get current location.';
        if (err.code === 1) msg = 'Location access denied. Please click on the map or type village name.';
        setStatusMessage(msg);
        setStatusType('error');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Village search with Nominatim (debounced)
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const url = `${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(
          query + ', Madhya Pradesh, India'
        )}&limit=5&addressdetails=1`;
        const res = await fetch(url);
        const data = await res.json();
        setSearchResults(data);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 600); // 600ms debounce
  };

  const handleSelectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setPosition([lat, lng]);
    setSearchResults([]);
    setSearchQuery(result.display_name.split(',')[0]);

    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 14);
    }
    handleLocationChange(lat, lng);
  };

  return (
    <div className="space-y-4">
      {/* Search and Current Location bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="गाँव या जगह खोजें / Search village or area..."
            className="block w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />

          {/* Autocomplete dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSearchResult(item)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-100 border-b border-slate-100 last:border-0 truncate"
                >
                  <span className="font-semibold text-slate-800">{item.display_name.split(',')[0]}</span>
                  <span className="text-slate-500 block text-[10px] truncate">{item.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-brand-50 hover:bg-brand-100 text-brand-800 border border-brand-200 rounded-xl text-xs font-semibold disabled:opacity-60 transition-all"
        >
          <Navigation className={`w-3.5 h-3.5 text-brand-700 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Locating...' : 'Use My Current Location'}</span>
        </button>
      </div>

      {/* Map Container */}
      <div className="relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
        <MapContainer
          center={position}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom={false}
          className="h-full w-full"
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker
            position={position}
            setPosition={setPosition}
            onLocationChange={handleLocationChange}
          />
        </MapContainer>

        {/* Tip overlay */}
        <div className="absolute bottom-2 left-2 right-2 sm:right-auto bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[11px] text-slate-700 shadow-xs z-10 border border-slate-200 flex items-center space-x-1.5">
          <MapPin className="w-3.5 h-3.5 text-brand-700 flex-shrink-0" />
          <span>Click anywhere on the map to place your farm pin</span>
        </div>
      </div>

      {/* Feedback banner */}
      {statusMessage && (
        <div
          className={`p-2.5 rounded-xl text-xs flex items-center space-x-2 ${
            statusType === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : statusType === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          {statusType === 'error' ? (
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
          ) : (
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          )}
          <span className="truncate">{statusMessage}</span>
        </div>
      )}

      {/* Manual Fallback & Confirmation Inputs */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Field Location Details (खेत का पता) *
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Village (गाँव) *
            </label>
            <input
              type="text"
              value={value?.village || ''}
              onChange={(e) => onChange({ ...value, village: e.target.value })}
              placeholder="e.g. Bilkisganj"
              className={`block w-full px-3 py-2 text-sm bg-white rounded-lg border ${
                errors?.village ? 'border-red-400' : 'border-slate-300'
              } focus:ring-1 focus:ring-brand-500 focus:outline-none`}
            />
            {errors?.village && (
              <p className="mt-1 text-[11px] text-red-600">{errors.village.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              District (ज़िला) *
            </label>
            <input
              type="text"
              value={value?.district || ''}
              onChange={(e) => onChange({ ...value, district: e.target.value })}
              placeholder="e.g. Sehore"
              className={`block w-full px-3 py-2 text-sm bg-white rounded-lg border ${
                errors?.district ? 'border-red-400' : 'border-slate-300'
              } focus:ring-1 focus:ring-brand-500 focus:outline-none`}
            />
            {errors?.district && (
              <p className="mt-1 text-[11px] text-red-600">{errors.district.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tehsil / Taluka (तहसील)
            </label>
            <input
              type="text"
              value={value?.tehsil || ''}
              onChange={(e) => onChange({ ...value, tehsil: e.target.value })}
              placeholder="e.g. Sehore"
              className="block w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-300 focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Landmark / Khasra No. (खसरा / पहचान)
            </label>
            <input
              type="text"
              value={value?.landmark || ''}
              onChange={(e) => onChange({ ...value, landmark: e.target.value })}
              placeholder="e.g. Near Tube-well / Canal / Khasra 145"
              className="block w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-300 focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldLocationPicker;

