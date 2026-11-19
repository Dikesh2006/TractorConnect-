import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Phone, ArrowRight, ShieldCheck, CheckCircle2, Clock, MapPin, Sparkles, AlertCircle } from 'lucide-react';
import apiClient from '../../api/axios';
import { formatINR } from '../../utils/formatters';

const Home = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const businessPhone = '9876543210';

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await apiClient.get('/services');
        if (res.data?.success) {
          setServices(res.data.data.services || []);
        }
      } catch (err) {
        setError('Could not load services currently. Please try calling us directly.');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const formatUnit = (unit) => {
    switch (unit) {
      case 'per_acre': return 'प्रति एकड़ / acre';
      case 'per_hour': return 'प्रति घंटा / hour';
      case 'per_trip': return 'प्रति चक्कर / trip';
      case 'per_day': return 'प्रति दिन / day';
      default: return unit;
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-brand-900 via-brand-800 to-brand-900 text-white py-12 sm:py-20 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-harvest-500/20 text-harvest-300 border border-harvest-400/30 text-xs font-semibold mb-4 sm:mb-6">
              <Sparkles className="w-3.5 h-3.5 text-harvest-400 flex-shrink-0" />
              <span>भरोसेमंद किसान ट्रैक्टर सेवा &bull; Trusted by 500+ Farmers</span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight sm:leading-tight mb-4 sm:mb-6">
              Modern Tractor & Farming Services at Your Doorstep
            </h1>

            <p className="text-sm sm:text-lg lg:text-xl text-brand-100 mb-6 sm:mb-8 leading-relaxed font-normal">
              खेत की गहरी जुताई, रोटावेटर, बोवनी और ट्राली ढुलाई के लिए सीधा ऑनलाइन ट्रैक्टर बुक करें। उचित दाम, अनुभवी चालक, और खेत पर काम पूरा होने के बाद आसान भुगतान।
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
              <Link
                to="/customer/book"
                className="inline-flex items-center justify-center space-x-2 w-full sm:w-auto px-6 py-3.5 rounded-xl bg-harvest-500 hover:bg-harvest-600 text-slate-950 font-bold text-sm sm:text-base shadow-lg transition-all min-h-[44px]"
              >
                <span>Book Tractor Now (ट्रैक्टर बुक करें)</span>
                <ArrowRight className="w-5 h-5 flex-shrink-0" />
              </Link>
              <a
                href={`tel:+91${businessPhone}`}
                className="inline-flex items-center justify-center space-x-2 w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm sm:text-base border border-white/20 backdrop-blur-xs transition-all min-h-[44px]"
              >
                <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-harvest-400 flex-shrink-0" />
                <span>Call Helpline: +91 {businessPhone}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Feature highlights bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 flex items-start space-x-3.5 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg sm:text-xl flex-shrink-0">
              ₹
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Transparent Fixed Rates</h3>
              <p className="text-xs text-slate-600 mt-1">
                Zero hidden charges. Real-time rate per acre or hour calculated upfront.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 flex items-start space-x-3.5 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-lg sm:text-xl flex-shrink-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">On-Time Arrival</h3>
              <p className="text-xs text-slate-600 mt-1">
                Tractors dispatched on scheduled morning or evening time slots with GPS field pinning.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 flex items-start space-x-3.5 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-lg sm:text-xl flex-shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Pay After Work</h3>
              <p className="text-xs text-slate-600 mt-1">
                Inspect your field quality after work completion. Pay easily via Cash or UPI.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Services Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 sm:mb-8 gap-2">
          <div>
            <span className="text-xs font-bold text-brand-700 uppercase tracking-wider block mb-1">
              Live Services Catalog (हमारी सेवाएं)
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900">
              Available Farming & Tractor Implements
            </h2>
          </div>
          <Link
            to="/services"
            className="text-xs sm:text-sm font-bold text-brand-700 hover:text-brand-800 flex items-center space-x-1"
          >
            <span>View All Services</span>
            <ArrowRight className="w-4 h-4 flex-shrink-0" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 animate-pulse space-y-4">
                <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-100 rounded w-full"></div>
                <div className="h-8 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {services.slice(0, 6).map((service) => (
              <div
                key={service._id}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {service.category}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Active
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-2">{service.name}</h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-2">
                    {service.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Rate (दर)</span>
                    <span className="text-lg sm:text-xl font-extrabold text-slate-900">
                      {formatINR(service.currentPrice)}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {formatUnit(service.pricingUnit)}
                    </span>
                  </div>

                  <Link
                    to="/customer/book"
                    state={{ preselectedServiceId: service._id }}
                    className="inline-flex items-center space-x-1 px-3.5 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold shadow-xs min-h-[36px]"
                  >
                    <span>Book Now</span>
                    <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* How It Works (3 Steps) */}
      <section className="bg-slate-100 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <span className="text-xs font-bold text-brand-700 uppercase tracking-wider block mb-1">
              Easy 3-Step Process (काम कैसे करता है)
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900">
              How TractorConnect Works for You
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <div className="bg-white rounded-2xl p-5 sm:p-6 text-center border border-slate-200 shadow-xs space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-brand-100 text-brand-800 font-extrabold text-lg flex items-center justify-center">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Book Your Service</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Choose your farming service (Ploughing, Rotavator, Sowing), select estimated acres, and pinpoint your farm location on the map.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 sm:p-6 text-center border border-slate-200 shadow-xs space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-brand-100 text-brand-800 font-extrabold text-lg flex items-center justify-center">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Tractor Arrives at Farm</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We assign a well-maintained tractor and experienced operator for your scheduled slot. Work starts on time.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 sm:p-6 text-center border border-slate-200 shadow-xs space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-brand-100 text-brand-800 font-extrabold text-lg flex items-center justify-center">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Inspect & Pay</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                After field work is completed to your satisfaction, exact acres are confirmed and you pay simply via Cash or UPI.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp / Direct Support Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-brand-900 rounded-3xl p-6 sm:p-10 lg:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl text-center md:text-left">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">Need Immediate Tractor Assistance?</h3>
            <p className="text-xs sm:text-sm text-brand-200">
              Call us directly or WhatsApp your field location. Our local family support team is available from 6:00 AM to 9:00 PM every day.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <a
              href={`https://wa.me/91${businessPhone}?text=Namaste%20TractorConnect,%20I%20need%20tractor%20service`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md min-h-[44px]"
            >
              <span>WhatsApp Us (व्हाट्सएप)</span>
            </a>
            <a
              href={`tel:+91${businessPhone}`}
              className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-white text-slate-900 font-bold text-xs sm:text-sm hover:bg-slate-100 shadow-md min-h-[44px]"
            >
              <Phone className="w-4 h-4 text-brand-700 flex-shrink-0" />
              <span>Call: +91 {businessPhone}</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

