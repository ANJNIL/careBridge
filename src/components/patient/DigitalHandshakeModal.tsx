import React from 'react';
import { Hospital, SBARCard, TriageLevel } from '../../types';
import { X, QrCode, ShieldCheck, Copy, Check, Hospital as HospIcon, PhoneCall } from 'lucide-react';
import { useState } from 'react';

interface DigitalHandshakeModalProps {
  hospital: Hospital;
  triageLevel: TriageLevel;
  sbar?: SBARCard;
  token: string;
  onClose: () => void;
}

export const DigitalHandshakeModal: React.FC<DigitalHandshakeModalProps> = ({
  hospital,
  triageLevel,
  sbar,
  token,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const copyToken = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Pre-Arrival Digital Handshake</h3>
              <p className="text-xs text-slate-400">Zero-Delay Triage Intake Clearance</p>
            </div>
          </div>

          <button
            id="modal-close-handshake-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center text-center space-y-4 text-slate-200">
          <div className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted Offline Emergency Token</span>
          </div>

          {/* QR Code Simulation */}
          <div className="p-4 bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col items-center">
            {/* SVG QR Code Pattern */}
            <svg className="w-44 h-44" viewBox="0 0 100 100" fill="none">
              <rect width="100" height="100" fill="white" />
              {/* Corner 1 */}
              <rect x="5" y="5" width="28" height="28" fill="black" />
              <rect x="9" y="9" width="20" height="20" fill="white" />
              <rect x="13" y="13" width="12" height="12" fill="black" />
              {/* Corner 2 */}
              <rect x="67" y="5" width="28" height="28" fill="black" />
              <rect x="71" y="9" width="20" height="20" fill="white" />
              <rect x="75" y="13" width="12" height="12" fill="black" />
              {/* Corner 3 */}
              <rect x="5" y="67" width="28" height="28" fill="black" />
              <rect x="9" y="71" width="20" height="20" fill="white" />
              <rect x="13" y="75" width="12" height="12" fill="black" />
              {/* Data modules */}
              <rect x="38" y="8" width="6" height="6" fill="black" />
              <rect x="48" y="14" width="8" height="6" fill="black" />
              <rect x="38" y="24" width="16" height="6" fill="black" />
              <rect x="10" y="40" width="8" height="8" fill="black" />
              <rect x="24" y="44" width="8" height="8" fill="black" />
              <rect x="38" y="38" width="24" height="24" fill="#e11d48" rx="2" />
              <rect x="44" y="44" width="12" height="12" fill="white" rx="1" />
              <rect x="68" y="40" width="12" height="6" fill="black" />
              <rect x="84" y="44" width="6" height="12" fill="black" />
              <rect x="38" y="68" width="14" height="8" fill="black" />
              <rect x="58" y="74" width="12" height="8" fill="black" />
              <rect x="74" y="68" width="16" height="16" fill="black" />
            </svg>
            <span className="text-[11px] font-mono text-slate-800 mt-2 font-bold tracking-widest">
              {token}
            </span>
          </div>

          <div className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-left space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Emergency Desk Token:</span>
              <button
                id="copy-token-btn"
                onClick={copyToken}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-sm font-mono font-bold text-white">{token}</p>
            <p className="text-[11px] text-slate-400">
              Show this screen to {hospital.name} ER triage nurse upon arrival for zero-form registration.
            </p>
          </div>

          {sbar && (
            <div className="w-full text-left bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Transmitted SBAR Payload</span>
              <p className="text-slate-300 line-clamp-2 italic">"{sbar.situation}"</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            id="dismiss-handshake-btn"
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
          >
            Ready for ER Arrival
          </button>
        </div>
      </div>
    </div>
  );
};
