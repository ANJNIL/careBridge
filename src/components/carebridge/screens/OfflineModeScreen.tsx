import React, { useState } from 'react';
import { WifiOff, Check, RefreshCw, PhoneCall, AlertTriangle } from 'lucide-react';
import { SoundFX } from '../../../utils/speech';
import { StickyBottomActionBar } from '../StickyBottomActionBar';

interface OfflineModeScreenProps {
  onBack: () => void;
  onRetry: () => void;
}

export const OfflineModeScreen: React.FC<OfflineModeScreenProps> = ({
  onBack,
  onRetry,
}) => {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = () => {
    SoundFX.tapTick();
    setRetrying(true);
    setTimeout(() => {
      setRetrying(false);
      onRetry();
    }, 1200);
  };

  const offlineChecklist = [
    'Use emergency keywords in Hindi & English',
    'Get basic CPR & first-aid triage guidance',
    'Access cached Indore emergency hospital list',
    'Use device GPS for exact location coordinates',
    'Send emergency SMS via direct GSM relay',
  ];

  return (
    <div className="w-full flex flex-col justify-between min-h-[580px] animate-in fade-in duration-150 text-left">
      <div className="space-y-3.5 pb-3">
        {/* Top Header without any back arrow button */}
        <div className="pt-2 pb-1 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Offline Fallback
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Zero-bandwidth SMS &amp; cached critical triage
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
            <WifiOff className="w-4 h-4" />
          </div>
        </div>

        {/* Dark Offline Banner */}
        <div className="bg-slate-900 text-white rounded-3xl p-5 text-center shadow-md space-y-1.5">
          <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center mx-auto text-slate-300">
            <WifiOff className="w-5 h-5" />
          </div>
          <h3 className="text-base sm:text-lg font-extrabold tracking-tight">
            Offline Mode Active
          </h3>
          <p className="text-xs text-slate-400">
            Internet connection unavailable • Local triage operative
          </p>
        </div>

        {/* "You can still:" Capabilities Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-2.5 shadow-xs">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            You can still:
          </h4>

          <div className="space-y-2 text-xs text-slate-700 font-medium">
            {offlineChecklist.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Data Notice */}
        <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-3">
          <p className="text-xs text-sky-900 leading-relaxed font-medium">
            Live ICU bed telemetry and GPS routing updates will automatically restore once internet signal is detected.
          </p>
        </div>

        {/* Offline SMS Dispatch */}
        <a
          href="sms:108?body=EMERGENCY%3A%20Need%20Immediate%20Ambulance%20at%20Indore%20MP"
          className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
        >
          <PhoneCall className="w-4 h-4" />
          <span>Send Emergency SMS via GSM Relay</span>
        </a>
      </div>

      {/* Standardized Sticky Bottom Action Area */}
      <StickyBottomActionBar
        onBack={onBack}
        backLabel="Back"
        onNext={handleRetry}
        nextLabel={retrying ? 'Checking Network...' : 'Try Reconnecting →'}
        isNextLoading={retrying}
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
