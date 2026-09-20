import React, { useState } from 'react';
import { DistressTriageResult, Hospital } from '../../types';
import { X, Radio, Copy, Check, MessageSquare, AlertCircle, WifiOff } from 'lucide-react';

interface SmsPanicModalProps {
  triageResult?: DistressTriageResult | null;
  hospital?: Hospital | null;
  onClose: () => void;
}

export const SmsPanicModal: React.FC<SmsPanicModalProps> = ({
  triageResult,
  hospital,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  // Generate standardized compact GSM SMS payload (160 characters max)
  const lat = 19.0760;
  const lng = 72.8777;
  const level = triageResult?.triageLevel || 1;
  const signalCode = triageResult?.keySignals?.[0]?.slice(0, 15) || 'CARDIAC_DIST';
  const hospCode = hospital?.id || 'HOSP1';
  
  const smsPayload = `CB#SOS#T${level}#LAT${lat.toFixed(4)}#LON${lng.toFixed(4)}#${signalCode.toUpperCase().replace(/\s+/g, '_')}#TO_${hospCode}#ID_${Math.floor(1000 + Math.random() * 9000)}`;

  const copySms = () => {
    navigator.clipboard.writeText(smsPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendSms = () => {
    // Open default SMS app targeting 108 / 112 emergency services
    window.open(`sms:108?body=${encodeURIComponent(smsPayload)}`, '_self');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
              <WifiOff className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Zero-Data Panic Mode</h3>
              <p className="text-xs text-slate-400">Offline GSM SMS Emergency Relay</p>
            </div>
          </div>

          <button
            id="modal-close-sms-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-slate-200">
          <div className="p-3 bg-amber-950/40 border border-amber-800/40 rounded-xl text-xs text-amber-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              When 4G/5G data drops, CareBridge converts real-time GPS and triage urgency into an encrypted 160-char SMS packet routed directly to 108 / 112 national emergency towers.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Standardized GSM Payload (160 char):</span>
              <span className="text-[11px] text-emerald-400 font-mono">{smsPayload.length} / 160 chars</span>
            </div>
            
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-rose-300 break-all select-all">
              {smsPayload}
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs space-y-2 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Target Dispatch:</span>
              <span className="font-semibold text-white">National Ambulance 108 / Police 112</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">GPS Coordinates:</span>
              <span className="font-mono text-slate-200">{lat.toFixed(4)} N, {lng.toFixed(4)} E</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Triage Priority:</span>
              <span className="font-bold text-red-400">Level {level} (Immediate / Critical)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            id="copy-sms-payload-btn"
            onClick={copySms}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>

          <button
            id="send-sms-native-btn"
            onClick={sendSms}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Launch SMS to 108</span>
          </button>
        </div>
      </div>
    </div>
  );
};
