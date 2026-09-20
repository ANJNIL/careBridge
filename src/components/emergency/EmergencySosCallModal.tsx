import React, { useState, useEffect } from 'react';
import { EmergencyContact } from '../../types';
import {
  getStoredEmergencyContacts,
  getPrimaryEmergencyContact,
  getAutoCallPreference,
  dialPhoneNumber,
} from '../../utils/emergencyContacts';
import { SoundFX } from '../../utils/speech';
import {
  PhoneCall,
  PhoneOff,
  ShieldAlert,
  Send,
  MapPin,
  Settings,
  Star,
  Check,
  Radio,
  Volume2,
  X,
  ExternalLink,
} from 'lucide-react';

interface EmergencySosCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenManageContacts: () => void;
  overrideContact?: EmergencyContact | null;
}

export const EmergencySosCallModal: React.FC<EmergencySosCallModalProps> = ({
  isOpen,
  onClose,
  onOpenManageContacts,
  overrideContact,
}) => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [activeContact, setActiveContact] = useState<EmergencyContact | null>(null);
  const [callState, setCallState] = useState<'countdown' | 'dialing' | 'connected' | 'cancelled'>('countdown');
  const [countdown, setCountdown] = useState<number>(3);
  const [autoCallEnabled, setAutoCallEnabled] = useState<boolean>(true);
  const [copiedLocation, setCopiedLocation] = useState<boolean>(false);

  // Load contacts and determine target on open
  useEffect(() => {
    if (isOpen) {
      const list = getStoredEmergencyContacts();
      setContacts(list);
      const target = overrideContact || getPrimaryEmergencyContact(list);
      setActiveContact(target);

      const isAuto = getAutoCallPreference();
      setAutoCallEnabled(isAuto);

      SoundFX.init();
      SoundFX.codeBlueAlarm();

      if (isAuto) {
        setCallState('countdown');
        setCountdown(3);
      } else {
        setCallState('connected');
      }
    }
  }, [isOpen, overrideContact]);

  // Countdown timer effect
  useEffect(() => {
    if (!isOpen || callState !== 'countdown') return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        SoundFX.beep(600 + countdown * 200, 0.08);
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Countdown reached 0 -> execute auto-call!
      executeCall();
    }
  }, [isOpen, callState, countdown]);

  const executeCall = (contactToCall?: EmergencyContact) => {
    const target = contactToCall || activeContact;
    if (!target) return;

    setCallState('dialing');
    SoundFX.sirenBurst();
    dialPhoneNumber(target.phone);
  };

  const handleCancelCall = () => {
    setCallState('cancelled');
    SoundFX.tapTick();
  };

  const handleManualDial = (contact: EmergencyContact) => {
    setActiveContact(contact);
    executeCall(contact);
  };

  const emergencySmsText = `🚨 EMERGENCY MEDICAL SOS ALERT!
I am experiencing a severe medical emergency. Please send immediate help.
My current live location: Indore, MP (GPS: 22.7196° N, 75.8577° E)
Nearest ER Hub: Choithram Hospital & Bombay Hospital (CareBridge Route Active).`;

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(emergencySmsText)}`, '_blank');
  };

  const handleCopyLocation = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText('https://maps.google.com/?q=22.7196,75.8577');
      setCopiedLocation(true);
      setTimeout(() => setCopiedLocation(false), 2500);
    }
  };

  if (!isOpen || !activeContact) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-red-600 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] ring-4 ring-red-950/60">
        {/* Top High-Urgency Header */}
        <div className="bg-gradient-to-r from-red-700 via-rose-600 to-red-700 text-white p-4 sm:p-5 flex items-center justify-between shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-inner animate-bounce">
              <PhoneCall className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-hud font-black text-lg sm:text-xl text-white tracking-wide">
                  EMERGENCY AUTO-CALL
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/30 text-white font-bold uppercase tracking-wider">
                  Live SOS
                </span>
              </div>
              <p className="text-xs text-red-100 font-medium">
                CareBridge Golden Hour Emergency Auto-Dispatch Protocol
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors relative z-10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Active Auto-Calling Contact Card */}
          <div className="bg-gradient-to-b from-slate-950 to-red-950/40 border-2 border-red-500/80 rounded-3xl p-5 text-center space-y-4 shadow-xl relative overflow-hidden">
            {/* Animated Radio Wave Rings */}
            <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-red-600/20 animate-ping" />
              <div className="absolute -inset-2 rounded-full border-2 border-red-500/40 animate-pulse" />
              <div className="w-20 h-20 rounded-full bg-red-600 border-4 border-white/20 flex items-center justify-center shadow-2xl relative z-10">
                <PhoneCall className="w-9 h-9 text-white animate-pulse" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-amber-400 mb-1">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>PRIMARY EMERGENCY CONTACT ({activeContact.relation.toUpperCase()})</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">{activeContact.name}</h2>
              <p className="text-base sm:text-lg font-mono font-bold text-red-400 mt-1">
                {activeContact.phone}
              </p>
              {activeContact.notes && (
                <p className="text-xs text-slate-400 mt-1">{activeContact.notes}</p>
              )}
            </div>

            {/* Countdown or Dialing Indicator */}
            {callState === 'countdown' ? (
              <div className="bg-red-950/80 border border-red-500/50 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm sm:text-base font-extrabold text-white font-hud">
                  <span className="animate-spin text-red-400">⏳</span>
                  <span>Auto-Calling in {countdown} second{countdown !== 1 ? 's' : ''}...</span>
                </div>
                <p className="text-[11px] text-red-200">
                  Phone dialer will open automatically. Tap &quot;Call Now&quot; to dial instantly or &quot;Cancel&quot; to abort.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => executeCall()}
                    className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-red-950/60 active:scale-95"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Call Now ({countdown}s)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelCall}
                    className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700"
                  >
                    Cancel Auto-Call
                  </button>
                </div>
              </div>
            ) : callState === 'dialing' ? (
              <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm sm:text-base font-extrabold text-emerald-300 font-hud">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                  <span>Call Dispatched to Device Dialer!</span>
                </div>
                <p className="text-xs text-slate-300">
                  If your browser did not automatically open the call, tap the red button below to dial directly:
                </p>
                <a
                  href={`tel:${activeContact.phone.replace(/[^\d+]/g, '')}`}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-red-950/70 transition-transform active:scale-95"
                >
                  <PhoneCall className="w-5 h-5 animate-bounce" />
                  <span>TAP TO DIAL {activeContact.phone}</span>
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                <a
                  href={`tel:${activeContact.phone.replace(/[^\d+]/g, '')}`}
                  onClick={() => SoundFX.codeBlueAlarm()}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-red-950/70 transition-transform active:scale-95"
                >
                  <PhoneCall className="w-5 h-5 animate-bounce" />
                  <span>CALL {activeContact.name.toUpperCase()} NOW</span>
                </a>
              </div>
            )}
          </div>

          {/* Backup Emergency Contacts Deck */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                All Emergency Contacts ({contacts.length}):
              </span>
              <button
                type="button"
                id="btn-modal-manage-contacts"
                onClick={() => {
                  onClose();
                  onOpenManageContacts();
                }}
                className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1 font-mono"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Manage / Add Numbers</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                    contact.id === activeContact.id
                      ? 'bg-slate-800/90 border-red-500/60'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span className="text-base shrink-0">
                      {contact.relation === 'Ambulance'
                        ? '🚑'
                        : contact.relation === 'Police'
                        ? '🚓'
                        : contact.relation === 'Doctor'
                        ? '🩺'
                        : '📞'}
                    </span>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">{contact.name}</span>
                        {contact.isPrimary && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            ★ Primary
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-red-400 font-semibold block">
                        {contact.phone}
                      </span>
                    </div>
                  </div>

                  <a
                    href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`}
                    onClick={() => {
                      SoundFX.codeBlueAlarm();
                      setActiveContact(contact);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1 shrink-0 shadow-sm active:scale-95"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>Call</span>
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Quick SOS Location & WhatsApp Broadcast */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>Broadcast Live SOS Location:</span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-sos-whatsapp"
                onClick={handleShareWhatsApp}
                className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/60 active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>WhatsApp SOS</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLocation}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>{copiedLocation ? '✓ Copied GPS!' : 'Copy GPS Link'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenManageContacts();
            }}
            className="text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono text-[11px]"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings: Auto-Call {autoCallEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            id="close-emergency-sos-modal-btn"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
          >
            Close Emergency HUD
          </button>
        </div>
      </div>
    </div>
  );
};
