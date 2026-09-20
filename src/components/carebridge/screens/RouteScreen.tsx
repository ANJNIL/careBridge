import React, { useState, useEffect } from 'react';
import { Hospital } from '../../../types';
import { 
  MapPin, 
  Navigation, 
  Share2, 
  Building2, 
  ExternalLink 
} from 'lucide-react';
import { SoundFX } from '../../../utils/speech';
import { StickyBottomActionBar } from '../StickyBottomActionBar';

interface RouteScreenProps {
  hospital: Hospital;
  onBack: () => void;
  onProceedToHandoff: () => void;
  onShareRoute?: () => void;
}

export const RouteScreen: React.FC<RouteScreenProps> = ({
  hospital,
  onBack,
  onProceedToHandoff,
  onShareRoute,
}) => {
  const [navigating, setNavigating] = useState(false);

  const handleStartAndProceed = () => {
    SoundFX.tapTick();
    setNavigating(true);
    // Open Google Maps GPS in new tab if requested
    const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}&travelmode=driving`;
    window.open(gmapsUrl, '_blank');
    // Proceed to Step 7: Emergency Handoff Card
    onProceedToHandoff();
  };

  return (
    <div className="w-full flex flex-col justify-between min-h-[580px] animate-in fade-in duration-150 text-left">
      <div className="space-y-2.5 pb-2">
        {/* Top Header without any back arrow button */}
        <div className="pt-2 pb-1 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Route &amp; Navigation
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Real-time fastest route via Indore Emergency Corridor
            </p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
            ETA {hospital.etaMinutes} MIN
          </span>
        </div>

        {/* Interactive Map Visual Area */}
        <div className="relative h-64 sm:h-72 rounded-3xl overflow-hidden border border-slate-200/90 bg-[#F1F5F9] my-1 shadow-inner flex flex-col justify-between p-4">
          {/* Stylized SVG Map Canvas Background with Streets & Waterways */}
          <div className="absolute inset-0 pointer-events-none opacity-85">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="streetGrid2" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="1.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="#F8FAFC" />
              <rect width="100%" height="100%" fill="url(#streetGrid2)" />
              
              {/* Waterway / Khan River curved path */}
              <path
                d="M 50 0 Q 140 120 120 300 T 260 500"
                fill="none"
                stroke="#BAE6FD"
                strokeWidth="22"
                strokeLinecap="round"
                opacity="0.6"
              />

              {/* Arterial Roads */}
              <path d="M 0 160 L 400 160" stroke="#CBD5E1" strokeWidth="6" />
              <path d="M 180 0 L 180 500" stroke="#CBD5E1" strokeWidth="6" />
              <path d="M 0 340 L 400 340" stroke="#CBD5E1" strokeWidth="6" />

              {/* Primary Route Path (Blue Curve) */}
              <path
                d="M 90 230 C 130 200, 180 180, 220 140 S 260 90, 310 60"
                fill="none"
                stroke="#2563EB"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={navigating ? "8 4" : "none"}
                className={navigating ? "animate-[dash_1s_linear_infinite]" : ""}
              />
            </svg>
          </div>

          {/* Floating Destination Pin */}
          <div className="absolute top-8 right-8 flex flex-col items-center animate-bounce duration-1000">
            <div className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-bold shadow-md whitespace-nowrap mb-1">
              {hospital.name}
            </div>
            <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg border-2 border-white">
              <Building2 className="w-4 h-4" />
            </div>
          </div>

          {/* Floating ETA Badge on Route */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="px-3 py-1 rounded-full bg-white/95 border border-blue-200 text-blue-700 text-xs font-black shadow-md flex items-center gap-1.5 backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <span>{hospital.distanceKm} km • {hospital.etaMinutes} min</span>
            </div>
          </div>

          {/* Floating Origin "Your Location" */}
          <div className="absolute bottom-6 left-8 flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white animate-ping" />
            </div>
            <span className="text-[10px] font-bold text-slate-700 bg-white/90 px-1.5 py-0.5 rounded shadow-xs mt-1">
              Your Location
            </span>
          </div>
        </div>

        {/* Facility Info Snapshot */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                {hospital.name}
              </h3>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-blue-600" />
                <span>{hospital.distanceKm} km • {hospital.etaMinutes} min driving</span>
              </p>
            </div>
          </div>

          {onShareRoute && (
            <button
              onClick={() => {
                SoundFX.tapTick();
                onShareRoute();
              }}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <Share2 className="w-3 h-3" />
              <span>Share</span>
            </button>
          )}
        </div>
      </div>

      {/* Standardized Sticky Bottom Action Area */}
      <StickyBottomActionBar
        onBack={onBack}
        backLabel="Back"
        onNext={handleStartAndProceed}
        nextLabel="Start Navigation & Generate Handoff →"
        stepInfo={{
          current: 6,
          total: 8,
          title: 'Route & Navigation',
        }}
        emergencyAction={{
          label: 'SOS 108',
          onEmergencyCall: () => {
            SoundFX.codeBlueAlarm();
            window.open('tel:108', '_self');
          },
        }}
      />
    </div>
  );
};
