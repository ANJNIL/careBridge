import React from 'react';
import { Hospital } from '../../../types';
import { 
  MapPin, 
  Phone, 
  Navigation, 
  CheckCircle2, 
  IndianRupee, 
  Check, 
  ShieldCheck, 
  ChevronRight, 
  Building2 
} from 'lucide-react';
import { SoundFX } from '../../../utils/speech';
import { StickyBottomActionBar } from '../StickyBottomActionBar';

interface HospitalDetailsScreenProps {
  hospital: Hospital;
  onBack: () => void;
  onNavigateRoute: () => void;
  onOpenCostBreakdown: () => void;
  onCallHospital: (phone: string) => void;
  onBookOrDispatch: () => void;
}

export const HospitalDetailsScreen: React.FC<HospitalDetailsScreenProps> = ({
  hospital,
  onBack,
  onNavigateRoute,
  onOpenCostBreakdown,
  onCallHospital,
  onBookOrDispatch,
}) => {
  const defaultImage = 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&auto=format&fit=crop&q=80';
  const hospitalImage = hospital.image || defaultImage;

  const whyList = hospital.whyFeatures || [
    '24x7 Emergency Department',
    'ICU & Oxygen Support Available',
    'Cardiology Specialist On Call',
    'Closest suitable facility based on your needs',
  ];

  return (
    <div className="w-full flex flex-col justify-between min-h-[580px] animate-in fade-in duration-150 text-left">
      <div className="space-y-3.5 pb-3">
        {/* Top Header without any back arrow button */}
        <div className="pt-2 pb-1 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Facility Overview
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Verified clinical infrastructure &amp; emergency access
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
        </div>

        {/* Hospital Photo Banner */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm h-44 sm:h-48 bg-slate-100">
          <img
            src={hospitalImage}
            alt={hospital.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          {/* Verified Badge */}
          <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-bold flex items-center gap-1 shadow-md backdrop-blur-xs">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Verified 24x7 ER</span>
          </div>
        </div>

        {/* Hospital Title & Location */}
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
            {hospital.name}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="font-bold text-slate-800">{hospital.distanceKm} km</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">{hospital.address}</span>
          </div>
        </div>

        {/* Specialty Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold text-xs border border-rose-100">
            Emergency
          </span>
          <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-xs border border-blue-100">
            ICU
          </span>
          <span className="px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-700 font-bold text-xs border border-sky-100">
            Oxygen
          </span>
          <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-100">
            Cardiology
          </span>
        </div>

        {/* Contact Information Cards */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2.5 shadow-xs">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Direct Emergency Contact
          </h4>

          <div className="flex items-center justify-between py-0.5">
            <div className="text-xs font-bold text-slate-800">
              {hospital.contactNumber}
            </div>
            <button
              onClick={() => {
                SoundFX.tapTick();
                onCallHospital(hospital.contactNumber);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Reception</span>
            </button>
          </div>
        </div>

        {/* Why This Facility? */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2 shadow-xs">
          <h4 className="text-xs font-bold text-slate-900">
            Why this facility?
          </h4>

          <div className="space-y-1.5 text-xs text-slate-700 font-medium">
            {whyList.map((feature, i) => (
              <div key={i} className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5 stroke-[2.5]" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Estimated Cost (Approx.) Clickable Card */}
        <div
          id="card-estimated-cost"
          onClick={() => {
            SoundFX.tapTick();
            onOpenCostBreakdown();
          }}
          className="bg-rose-50/70 hover:bg-rose-50 border border-rose-200/80 rounded-2xl p-3.5 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                <IndianRupee className="w-3.5 h-3.5 text-rose-600" />
                <span>Estimated Treatment Cost (Tap to view breakdown)</span>
              </div>
              <div className="text-base font-black text-rose-900">
                {hospital.estimatedCostRange || '₹ 5,000 - ₹ 12,000'}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all mt-1" />
          </div>
        </div>
      </div>

      {/* Standardized Sticky Bottom Action Area */}
      <StickyBottomActionBar
        onBack={onBack}
        backLabel="Back"
        onNext={onNavigateRoute}
        nextLabel="View Route & Directions →"
        stepInfo={{
          current: 5,
          total: 8,
          title: 'Facility Overview',
        }}
        emergencyAction={{
          label: 'Call ER',
          onEmergencyCall: () => onCallHospital(hospital.contactNumber),
        }}
      />
    </div>
  );
};
