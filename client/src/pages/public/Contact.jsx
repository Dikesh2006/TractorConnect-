import React from 'react';
import { Phone, Mail, MapPin, Clock, MessageSquare } from 'lucide-react';

const Contact = () => {
  const businessPhone = '9691742428';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-brand-700 uppercase tracking-wider block">
          Contact Us (संपर्क करें)
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          We are Here to Help Your Farm Succeed
        </h1>
        <p className="text-sm text-slate-600">
          Have questions about tractor availability, rates, or custom work? Contact our family team anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Direct Contact Cards */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center flex-shrink-0">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Helpline & Booking Call</h3>
              <p className="text-xs text-slate-500 mt-0.5">Call directly for instant booking assistance</p>
              <a
                href={`tel:+91${businessPhone}`}
                className="text-base font-bold text-brand-700 hover:text-brand-800 block mt-1"
              >
                +91 {businessPhone}
              </a>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">WhatsApp Support</h3>
              <p className="text-xs text-slate-500 mt-0.5">Share field location or ask questions</p>
              <a
                href={`https://wa.me/91${businessPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-emerald-700 hover:underline block mt-1"
              >
                Chat on WhatsApp (+91 {businessPhone})
              </a>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Working Hours</h3>
              <p className="text-xs text-slate-600 mt-1">Monday – Sunday: 6:00 AM – 9:00 PM</p>
              <p className="text-[11px] text-slate-500">Tractor field operations run 7 days a week</p>
            </div>
          </div>
        </div>

        {/* Operating Headquarters */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-brand-700 font-bold text-sm">
              <MapPin className="w-5 h-5" />
              <span>Headquarters & Yard Location</span>
            </div>

            <h3 className="text-xl font-bold text-slate-900">TractorConnect Rural Hub</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              RAJEGAVE , POST-SONEGAVE ,TH-AMLA <br />
              BETUL,MADHAYA PRADESH - 460661
            </p>

            <div className="pt-4 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Active Village Hubs:
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                KHEDLI BAZAR , BORDEHI ,AMLA, MULTAI ,RAJEGAVE , SONEGAVE etc.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            💡 <strong>Farmer Tip:</strong> You do not need to visit our office in person. You can easily pinpoint your field and place your booking directly through our website or via a phone call.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;

