import React, { useState } from 'react';
import { Hospital } from '../../../types';
import { 
  Share2, 
  Download, 
  Check, 
  FileText 
} from 'lucide-react';
import { SoundFX } from '../../../utils/speech';
import { StickyBottomActionBar } from '../StickyBottomActionBar';

interface EmergencyHandoffScreenProps {
  hospital: Hospital;
  onBack: () => void;
  onProceedToShare: () => void;
  detectedInfo: {
    patient: string;
    symptoms: string[];
    urgency: 'High' | 'Moderate' | 'Low';
    language: string;
    location: string;
  };
}

export const EmergencyHandoffScreen: React.FC<EmergencyHandoffScreenProps> = ({
  hospital,
  onBack,
  onProceedToShare,
  detectedInfo,
}) => {
  const [downloaded, setDownloaded] = useState(false);
  const [shared, setShared] = useState(false);

  const formattedTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const handleShareWhatsApp = () => {
    SoundFX.tapTick();
    const text = `🚨 *CAREBRIDGE EMERGENCY HANDOFF* 🚨\n\n*Patient:* ${detectedInfo.patient || 'Father'}\n*Symptoms:* ${detectedInfo.symptoms.join(', ')}\n*Urgency:* ${detectedInfo.urgency || 'HIGH'}\n*Destination Hospital:* ${hospital.name} (${hospital.distanceKm} km)\n*Location:* 22.7196, 75.8577 (Indore, MP)\n*Reported at:* ${formattedTime}\n\nImmediate ER evaluation required.`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setShared(true);
  };

  const handleDownloadPdf = () => {
    SoundFX.tapTick();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div className="w-full flex flex-col justify-between min-h-[580px] animate-in fade-in duration-150 text-left">
      <div className="space-y-3 pb-3">
        {/* Top Header without any back arrow button */}
        <div className="pt-2 pb-1 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Emergency Handoff Card
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Immediate clinical dossier for paramedics &amp; ER doctors
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
        </div>

        {/* Main Handoff Card with Red Header */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Red Header Banner */}
          <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white p-3.5">
            <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase">
              EMERGENCY HANDOFF DOSSIER
            </h3>
            <p className="text-[10px] text-red-100 font-medium">
              Quick clinical triage summary for healthcare providers
            </p>
          </div>

          {/* Content Details */}
          <div className="p-3.5 space-y-2 text-xs sm:text-sm">
            {/* Patient */}
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Patient:</span>
              <span className="font-bold text-slate-900">{detectedInfo.patient || 'Father'}</span>
            </div>

            {/* Input Language */}
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Input Language:</span>
              <span className="font-semibold text-slate-800">{detectedInfo.language || 'Hinglish'}</span>
            </div>

            {/* Reported At */}
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Reported at:</span>
              <span className="font-semibold text-slate-800">{formattedTime}</span>
            </div>

            {/* Symptoms */}
            <div className="flex items-start justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Symptoms:</span>
              <span className="font-bold text-slate-900 text-right max-w-[200px]">
                {detectedInfo.symptoms.join(', ') || 'Breathing difficulty, Chest pain'}
              </span>
            </div>

            {/* Urgency Level */}
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Urgency Level:</span>
              <span className="px-2 py-0.5 rounded-md bg-red-600 text-white font-black text-[10px] uppercase tracking-wider">
                {detectedInfo.urgency || 'HIGH'}
              </span>
            </div>

            {/* Destination */}
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Destination:</span>
              <span className="font-bold text-slate-900 text-right truncate max-w-[180px]">
                {hospital.name}
              </span>
            </div>

            {/* Location */}
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">GPS Coordinates:</span>
              <span className="font-mono text-[10px] text-slate-800 font-bold">
                22.7196, 75.8577 (Indore)
              </span>
            </div>

            {/* Scannable QR Code Section */}
            <div className="pt-2 flex flex-col items-center justify-center text-center">
              <div className="p-2.5 bg-white rounded-2xl border-2 border-dashed border-slate-300 shadow-xs mb-1.5">
                <svg className="w-24 h-24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="5" y="5" width="26" height="26" rx="4" stroke="#0F172A" strokeWidth="4" />
                  <rect x="12" y="12" width="12" height="12" fill="#0F172A" />
                  <rect x="69" y="5" width="26" height="26" rx="4" stroke="#0F172A" strokeWidth="4" />
                  <rect x="76" y="12" width="12" height="12" fill="#0F172A" />
                  <rect x="5" y="69" width="26" height="26" rx="4" stroke="#0F172A" strokeWidth="4" />
                  <rect x="12" y="76" width="12" height="12" fill="#0F172A" />
                  <rect x="36" y="10" width="5" height="5" fill="#0F172A" />
                  <rect x="45" y="10" width="5" height="5" fill="#0F172A" />
                  <rect x="55" y="10" width="5" height="5" fill="#0F172A" />
                  <rect x="40" y="20" width="5" height="5" fill="#0F172A" />
                  <rect x="50" y="20" width="5" height="5" fill="#0F172A" />
                  <rect x="10" y="40" width="5" height="5" fill="#0F172A" />
                  <rect x="20" y="40" width="5" height="5" fill="#0F172A" />
                  <rect x="35" y="35" width="5" height="5" fill="#0F172A" />
                  <rect x="45" y="35" width="5" height="5" fill="#0F172A" />
                  <rect x="55" y="35" width="5" height="5" fill="#0F172A" />
                  <rect x="65" y="35" width="5" height="5" fill="#0F172A" />
                  <rect x="75" y="40" width="5" height="5" fill="#0F172A" />
                  <rect x="35" y="50" width="5" height="5" fill="#0F172A" />
                  <rect x="45" y="55" width="5" height="5" fill="#0F172A" />
                  <rect x="55" y="50" width="5" height="5" fill="#0F172A" />
                  <rect x="65" y="55" width="5" height="5" fill="#0F172A" />
                  <rect x="40" y="70" width="5" height="5" fill="#0F172A" />
                  <rect x="50" y="75" width="5" height="5" fill="#0F172A" />
                  <rect x="60" y="70" width="5" height="5" fill="#0F172A" />
                  <rect x="70" y="75" width="5" height="5" fill="#0F172A" />
                  <rect x="80" y="70" width="5" height="5" fill="#0F172A" />
                  <rect x="40" y="85" width="5" height="5" fill="#0F172A" />
                  <rect x="55" y="85" width="5" height="5" fill="#0F172A" />
                  <rect x="70" y="85" width="5" height="5" fill="#0F172A" />
                  <rect x="85" y="85" width="5" height="5" fill="#0F172A" />
                </svg>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">
                QR instantly imports vitals &amp; symptoms to Hospital ER Desk
              </p>
            </div>
          </div>
        </div>

        {/* Quick export shortcuts */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleShareWhatsApp}
            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{shared ? 'Opening...' : 'Direct WhatsApp'}</span>
          </button>
          <button
            onClick={handleDownloadPdf}
            className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            {downloaded ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Download className="w-3.5 h-3.5 text-slate-600" />}
            <span>{downloaded ? 'Saved' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      {/* Standardized Sticky Bottom Action Area */}
      <StickyBottomActionBar
        onBack={onBack}
        backLabel="Back"
        onNext={onProceedToShare}
        nextLabel="Share with Family →"
        stepInfo={{
          current: 7,
          total: 8,
          title: 'Emergency Handoff Card',
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
