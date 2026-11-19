import React from 'react';
import { ShieldCheck, Users, Heart, Award, CheckCircle } from 'lucide-react';

const About = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 sm:space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-brand-700 uppercase tracking-wider block">
          About TractorConnect (हमारे बारे में)
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Empowering Indian Farmers with Fair & Reliable Tractor Mechanization
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          TractorConnect is a family-run agricultural services business operating in Sehore, Madhya Pradesh. We bridge the gap between hardworking farmers and modern tractor implements.
        </p>
      </div>

      {/* Story */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 md:p-10 border border-slate-200 shadow-xs space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Our Story & Commitment</h2>
        <p className="text-slate-600 leading-relaxed text-xs sm:text-sm md:text-base">
          For years, small and medium farmers in central India have struggled with unpredictable tractor availability, inflated peak-season rates, and unreliable operators. Founded by the Sharma family in Sehore, TractorConnect was built to bring transparency, dignity, and technological efficiency to every farmer in our region.
        </p>
        <p className="text-slate-600 leading-relaxed text-xs sm:text-sm md:text-base">
          We maintain our fleet of modern 45–50 HP tractors equipped with precision zero-till seed drills, high-speed rotavators, heavy disc ploughs, and laser land levelers. We publish all our rates per acre openly, confirm bookings on-demand, and let farmers pay after inspecting the field.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-6 border-t border-slate-100">
          <div className="space-y-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-brand-700">500+</span>
            <p className="text-xs text-slate-600 font-medium">Farmers Served across Sehore & Bhopal</p>
          </div>
          <div className="space-y-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-harvest-600">3,500+</span>
            <p className="text-xs text-slate-600 font-medium">Acres Cultivated & Sown</p>
          </div>
          <div className="space-y-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">100%</span>
            <p className="text-xs text-slate-600 font-medium">Transparent Per-Acre Pricing</p>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 text-brand-700 flex-shrink-0" />
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">Reliable Machinery</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Strictly maintained tractors with sharp rotavator blades and properly calibrated seed drills for zero crop loss.
          </p>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <Users className="w-7 h-7 sm:w-8 sm:h-8 text-harvest-600 flex-shrink-0" />
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">Local Experienced Drivers</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Our operators are local farmers themselves who understand field moisture, soil depth, and respect your boundary lines.
          </p>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-red-600 flex-shrink-0" />
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">Kisan-First Support</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Direct helpline, WhatsApp support, and flexible cash or UPI payments to accommodate harvest cash-flow cycles.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;

