import React from 'react';
import { AlertTriangle, BellRing, PhoneCall, ChevronRight, ShieldAlert } from 'lucide-react';
import { SoundFX } from '../../../utils/speech';
import { StickyBottomActionBar } from '../StickyBottomActionBar';

interface EmergencyDetectedScreenProps {
  onBack: () => void;
  onFindHospitals: () => void;
  onCallAmbulance: () => void;
}

export const EmergencyDetectedScreen: React.FC<EmergencyDetectedScreenProps> = ({
  onBack,
  onFindHospitals,
  onCallAmbulance,
}) => {
  return (
    <div className="w-full flex flex-col justify-between min-h-[580px] animate-in fade-in duration-150">
      <div className="space-y-3.5 text-left">
        {/* Top Header - Clean title with NO top back arrow */}
        <div className="pt-2 pb-1 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Emergency Detected
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              High acuity clinical indicator detected
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-red-600" />
          </div>
        </div>

        {/* Red Alert Card: HIGH URGENCY */}
        <div className="bg-rose-50/90 border border-red-200 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
            <BellRing className="w-6 h-6 text-red-600 animate-bounce" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-red-600 tracking-wide uppercase leading-tight">
              HIGH URGENCY
            </h3>
            <p className="text-xs font-semibold text-red-700 mt-0.5">
              Seek immediate medical care.
            </p>
          </div>
        </div>

        {/* Yellow Warning Card */}
        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 leading-relaxed font-medium">
            These symptoms may require urgent attention. Please contact emergency services or visit the nearest hospital.
          </p>
        </div>

        {/* "What should you do now?" Steps */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
          <h4 className="text-xs sm:text-sm font-bold text-slate-900">
            What should you do now?
          </h4>

          <div className="space-y-3">
            {/* Step 1 */}
            <div className="flex items-center gap-3 text-xs font-medium text-slate-800">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                1
              </div>
              <span>Find nearby emergency facilities</span>
            </div>

            {/* Step 2 */}
            <div className="flex items-center gap-3 text-xs font-medium text-slate-800">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                2
              </div>
              <span>Get contact &amp; route information</span>
            </div>

            {/* Step 3 */}
            <div className="flex items-center gap-3 text-xs font-medium text-slate-800">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                3
              </div>
              <span>Call emergency services (if needed)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Standardized Sticky Bottom Action Area */}
      <StickyBottomActionBar
        onBack={onBack}
        backLabel="Back"
        onNext={onFindHospitals}
        nextLabel="Find Nearby Hospitals →"
        isHighUrgency={true}
        stepInfo={{
          current: 3,
          total: 8,
          title: 'Triage & Acuity',
        }}
        emergencyAction={{
          label: 'Call 108',
          onEmergencyCall: onCallAmbulance,
        }}
      />
    </div>
  );
};
