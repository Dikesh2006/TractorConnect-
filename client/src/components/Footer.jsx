import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, ShieldCheck, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-3xl">🚜</span>
              <span className="font-extrabold text-xl text-white tracking-tight">
                Tractor<span className="text-harvest-400">Connect</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Family-owned tractor and agricultural mechanization services. Helping farmers in Madhya Pradesh prepare land, sow, and harvest with fair and transparent pricing.
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Tractors & Expert Drivers</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Farming Services
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/services" className="hover:text-white">Ploughing (गहरी जुताई)</Link></li>
              <li><Link to="/services" className="hover:text-white">Rotavator (रोटावेटर)</Link></li>
              <li><Link to="/services" className="hover:text-white">Seed Drilling (बोवनी)</Link></li>
              <li><Link to="/services" className="hover:text-white">Laser Leveling (समतलीकरण)</Link></li>
              <li><Link to="/services" className="hover:text-white">Tractor Trolley Transport</Link></li>
            </ul>
          </div>

          {/* Service Area */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Service Coverage (सेवा क्षेत्र)
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-2">
              Available across Sehore, Bhopal, Raisen, and Narmadapuram districts:
            </p>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {['Bilkisganj', 'Shyampur', 'Ichhawar', 'Mandi', 'Doraha', 'Ashta', 'Berasia', 'Bherunda'].map((v) => (
                <span key={v} className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
                  {v}
                </span>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Direct Contact
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <p className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-harvest-400" />
                <span>+91 98765 43210</span>
              </p>
              <p className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-harvest-400" />
                <span>support@tractorconnect.in</span>
              </p>
              <p className="flex items-start space-x-2">
                <MapPin className="w-3.5 h-3.5 text-harvest-400 mt-0.5 flex-shrink-0" />
                <span>Old Bus Stand Road, Sehore, Madhya Pradesh - 466001</span>
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} TractorConnect Rural Services. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 flex items-center space-x-1">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 inline fill-current" />
            <span>for Indian Farmers (भारतीय किसानों के लिए)</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

