import React, { useState, useEffect } from 'react';
import { Hospital, SBARCard, TriageLevel } from '../../types';
import { 
  X, 
  Navigation, 
  PhoneCall, 
  Share2, 
  QrCode, 
  Clock, 
  MapPin, 
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface MapRoutingModalProps {
  hospital: Hospital;
  triageLevel: TriageLevel;
  sbar?: SBARCard;
  onClose: () => void;
  onOpenHandshake: () => void;
  onSendSbarToHospital: () => void;
  sbarSent: boolean;
}

export const MapRoutingModal: React.FC<MapRoutingModalProps> = ({
  hospital,
  triageLevel,
  sbar,
  onClose,
  onOpenHandshake,
  onSendSbarToHospital,
  sbarSent,
}) => {
  const [navStep, setNavStep] = useState(0);
  const [etaRemaining, setEtaRemaining] = useState(hospital.etaMinutes);

  const steps = [
    { text: 'Start from current GPS location (Bandra Kurla Junction)', distance: '0.4 km', time: '1 min' },
    { text: 'Merge onto Western Express Arterial Flyover (Green Corridor alert active)', distance: '1.8 km', time: '4 mins' },
    { text: 'Take Emergency Lane Exit 4 towards Hospital Trauma Avenue', distance: '0.8 km', time: '2 mins' },
    { text: `Arrive at ${hospital.name} — Dedicated Emergency Ambulance Bay 2`, distance: '0.2 km', time: '1 min' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setNavStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const openGoogleMaps = () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`,
      '_blank'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-600/20 text-rose-400 flex items-center justify-center">
              <Navigation className="w-5 h-5 text-rose-500 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
                <span>Emergency Routing & ETA</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-mono">
                  ETA: {etaRemaining} mins ({hospital.distanceKm} km)
                </span>
              </h3>
              <p className="text-xs text-slate-400">{hospital.name}</p>
            </div>
          </div>

          <button
            id="modal-close-routing-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-200">
          {/* Simulated Interactive Map Display */}
          <div className="relative w-full h-52 sm:h-64 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex flex-col justify-between p-4 shadow-inner">
            {/* Map Grid and Route Line Simulation */}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
            
            {/* Simulated Road Canvas SVG */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-rose-500" fill="none">
              <path
                d="M 40 180 Q 150 140 240 160 T 420 70 T 560 50"
                strokeWidth="6"
                strokeLinecap="round"
                className="opacity-70"
              />
              <path
                d="M 40 180 Q 150 140 240 160 T 420 70 T 560 50"
                strokeWidth="3"
                strokeDasharray="8 6"
                strokeLinecap="round"
                className="stroke-amber-300 animate-[dash_2s_linear_infinite]"
              />
            </svg>

            {/* Top Map Overlays */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-lg text-xs backdrop-blur-sm flex items-center gap-2 text-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-semibold">GPS Active: Mumbai Transit Corridor</span>
              </div>
              <div className="bg-rose-950/80 border border-rose-800/80 px-2.5 py-1 rounded-md text-xs font-bold text-rose-300">
                Golden Hour Priority 🚨
              </div>
            </div>

            {/* Waypoints */}
            <div className="relative z-10 flex items-center justify-between text-xs mt-auto">
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700 px-2.5 py-1.5 rounded-lg">
                <div className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
                <span>You (Distress Origin)</span>
              </div>

              <div className="flex items-center gap-2 bg-rose-950/90 border border-rose-800 px-2.5 py-1.5 rounded-lg text-rose-200">
                <Building className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-bold">{hospital.name.slice(0, 24)}...</span>
              </div>
            </div>
          </div>

          {/* Turn-by-Turn Navigation Progress */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-slate-200 uppercase tracking-wider">Live Route Guidance</span>
              <span>Step {navStep + 1} of {steps.length}</span>
            </div>

            <div className="space-y-2">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-2.5 rounded-lg text-xs transition-all ${
                    idx === navStep
                      ? 'bg-rose-950/50 border border-rose-800/80 text-white font-medium'
                      : idx < navStep
                      ? 'text-slate-500 line-through'
                      : 'text-slate-400 opacity-60'
                  }`}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    idx === navStep ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p>{step.text}</p>
                    <span className="text-[11px] text-slate-400">{step.distance} • {step.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SBAR Pre-Arrival Status */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Pre-Arrival ER Digital Handshake</span>
              </div>
              <p className="text-xs text-slate-400">
                {sbarSent
                  ? '✓ SBAR emergency card received by ER desk. Triage pre-cleared.'
                  : 'Transmit standardized clinical SBAR card now to hold ICU bed before arrival.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="send-sbar-hospital-btn"
                onClick={onSendSbarToHospital}
                disabled={sbarSent}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  sbarSent
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
                }`}
              >
                {sbarSent ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>SBAR Shared with ER</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Send SBAR to ER Desk</span>
                  </>
                )}
              </button>

              <button
                id="view-qr-handshake-btn"
                onClick={onOpenHandshake}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1"
              >
                <QrCode className="w-3.5 h-3.5 text-amber-400" />
                <span>QR Token</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <a
            href={`tel:${hospital.emergencyDeskDirect}`}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold border border-slate-700"
          >
            <PhoneCall className="w-4 h-4 text-emerald-400" />
            <span>Call ER: {hospital.emergencyDeskDirect}</span>
          </a>

          <button
            id="open-google-maps-btn"
            onClick={openGoogleMaps}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open in Google Maps / Mapbox</span>
          </button>
        </div>
      </div>
    </div>
  );
};
