import React from 'react';
import { Hospital } from '../../../types';
import { Building2, Info, IndianRupee, ShieldCheck, PhoneCall } from 'lucide-react';
import { SoundFX } from '../../../utils/speech';
import { StickyBottomActionBar } from '../StickyBottomActionBar';

interface CostBreakdownScreenProps {
  hospital: Hospital;
  onBack: () => void;
  onCallDesk: (phone: string) => void;
}

export const CostBreakdownScreen: React.FC<CostBreakdownScreenProps> = ({
  hospital,
  onBack,
  onCallDesk,
}) => {
  const items = hospital.estimatedCostBreakdown || [
    { service: 'Emergency Consultation', costRange: '₹ 1,000 - 2,000' },
    { service: 'Initial Tests (ECG, X-Ray etc.)', costRange: '₹ 2,000 - 5,000' },
    { service: 'General Ward (if needed)', costRange: '₹ 2,000 - 5,000' },
    { service: 'ICU (if required)', costRange: '₹ 10,000 - 25,000' },
  ];

  return (
    <div className="w-full flex flex-col justify-between min-h-[580px] animate-in fade-in duration-150 text-left">
      <div className="space-y-3 pb-3">
        {/* Top Header without any back arrow button */}
        <div className="pt-2 pb-1 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Estimated Treatment Cost
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Transparent rate card &amp; insurance empanelment
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>

        {/* Hospital Identity Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              {hospital.name}
            </h3>
            <p className="text-[11px] text-slate-500">
              Emergency &amp; Critical Care Department
            </p>
          </div>
        </div>

        {/* Breakdown Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-2.5 shadow-xs">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Estimated Cost Breakdown
          </h4>

          <div className="divide-y divide-slate-100 text-xs sm:text-sm">
            {items.map((item, i) => (
              <div key={i} className="py-2 flex items-center justify-between gap-2">
                <span className="text-slate-600 font-medium">{item.service}</span>
                <span className="font-extrabold text-slate-900 whitespace-nowrap">
                  {item.costRange}
                </span>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-slate-400 italic pt-1">
            *Standard baseline estimations. Actual cost depends on procedure &amp; clinical severity.
          </p>
        </div>

        {/* Blue Notice Box */}
        <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <p className="text-xs text-sky-900 leading-relaxed font-medium">
            Emergency stabilization cannot be withheld for lack of advance deposit as per MP healthcare guidelines.
          </p>
        </div>

        {/* Government Health Schemes Notice (Ayushman Bharat PM-JAY) */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-xs text-emerald-900 font-medium">
            Eligible for Ayushman Bharat (PM-JAY) cashless emergency admission up to ₹5 Lakh.
          </p>
        </div>
      </div>

      {/* Standardized Sticky Bottom Action Area */}
      <StickyBottomActionBar
        onBack={onBack}
        backLabel="Back"
        onNext={() => onCallDesk(hospital.contactNumber)}
        nextLabel="Confirm with Billing Desk →"
        stepInfo={{
          current: 5,
          total: 8,
          title: 'Cost Breakdown',
        }}
        emergencyAction={{
          label: 'Call 108',
          onEmergencyCall: () => {
            SoundFX.codeBlueAlarm();
            window.open('tel:108', '_self');
          },
        }}
      />
    </div>
  );
};
