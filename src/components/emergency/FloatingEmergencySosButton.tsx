import React, { useState, useEffect } from 'react';
import { EmergencyContact } from '../../types';
import { getPrimaryEmergencyContact, getStoredEmergencyContacts } from '../../utils/emergencyContacts';
import { PhoneCall, ShieldAlert } from 'lucide-react';

interface FloatingEmergencySosButtonProps {
  onTriggerSos: () => void;
  onOpenManageContacts?: () => void;
}

export const FloatingEmergencySosButton: React.FC<FloatingEmergencySosButtonProps> = ({
  onTriggerSos,
  onOpenManageContacts,
}) => {
  const [primaryContact, setPrimaryContact] = useState<EmergencyContact>(() => getPrimaryEmergencyContact());

  useEffect(() => {
    const handleUpdate = () => {
      setPrimaryContact(getPrimaryEmergencyContact());
    };
    window.addEventListener('carebridge:emergency_contacts_updated', handleUpdate);
    return () => window.removeEventListener('carebridge:emergency_contacts_updated', handleUpdate);
  }, []);

  return (
    <div className="fixed bottom-6 left-6 z-40 flex items-center gap-2">
      <button
        id="floating-emergency-sos-btn"
        onClick={onTriggerSos}
        className="group relative flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-xs sm:text-sm shadow-2xl shadow-red-950/80 ring-4 ring-red-500/40 hover:ring-red-400 hover:scale-105 active:scale-95 transition-all"
        title={`Click Emergency Icon to Auto-Call ${primaryContact.name} (${primaryContact.phone})`}
      >
        {/* Animated Ping Waves */}
        <span className="absolute -inset-1 rounded-2xl bg-red-500/30 animate-ping pointer-events-none" />

        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <PhoneCall className="w-4 h-4 text-white animate-bounce" />
        </div>

        <div className="text-left leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="font-hud tracking-wider">EMERGENCY SOS</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="text-[10px] text-red-100 font-mono font-medium truncate max-w-[130px] sm:max-w-[170px]">
            Auto-Call: {primaryContact.name}
          </div>
        </div>
      </button>

      {onOpenManageContacts && (
        <button
          type="button"
          onClick={onOpenManageContacts}
          className="w-9 h-9 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/80 shadow-lg flex items-center justify-center text-xs transition-all active:scale-90"
          title="Add / Manage Emergency Numbers"
        >
          ⚙️
        </button>
      )}
    </div>
  );
};
