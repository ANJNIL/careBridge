import React, { useState, useRef, useEffect } from 'react';
import { AuthUser } from '../../types';
import { 
  User, 
  Building2, 
  ShieldCheck, 
  LogOut, 
  Phone, 
  Mail, 
  HeartPulse, 
  Stethoscope, 
  ChevronDown,
  Sparkles,
  RefreshCw,
  BadgeAlert
} from 'lucide-react';
import { SoundFX } from '../../utils/speech';

interface UserProfileMenuProps {
  currentUser: AuthUser | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onSwitchRole: () => void;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  currentUser,
  onOpenLogin,
  onLogout,
  onSwitchRole,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) {
    return (
      <button
        id="nav-btn-open-login"
        onClick={() => {
          SoundFX.init();
          SoundFX.cardiacPulse();
          onOpenLogin();
        }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-tactical-surface to-slate-800 hover:from-slate-800 hover:to-slate-700 text-slate-100 border border-tactical-border hover:border-tactical-cyan text-xs font-hud font-bold shadow-md transition-all active:scale-95"
      >
        <User className="w-3.5 h-3.5 text-tactical-cyan" />
        <span>DIRECT LOGIN</span>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-tactical-cyan/20 text-tactical-cyan border border-tactical-cyan/30">
          USER / HOSPITAL
        </span>
      </button>
    );
  }

  const isHospital = currentUser.role === 'hospital_staff';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="nav-user-profile-badge"
        onClick={() => {
          SoundFX.init();
          SoundFX.cardiacPulse();
          setIsOpen((prev) => !prev);
        }}
        className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border text-xs font-mono transition-all ${
          isHospital
            ? 'bg-tactical-surface border-tactical-red text-white shadow-md shadow-tactical-red/20'
            : 'bg-tactical-surface border-tactical-cyan text-white shadow-md shadow-tactical-cyan/20'
        }`}
      >
        <div className="relative">
          {currentUser.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-6 h-6 rounded-full object-cover border border-white/40"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-1 ring-black ${
              isHospital ? 'bg-tactical-red' : 'bg-tactical-emerald'
            }`}
          />
        </div>

        <div className="text-left hidden md:block">
          <div className="font-bold text-[11px] truncate max-w-[130px] leading-tight flex items-center gap-1">
            <span>{currentUser.name}</span>
            <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
          </div>
          <div className="text-[9px] text-slate-400 truncate max-w-[130px]">
            {isHospital ? currentUser.hospitalName || 'Hospital Staff' : currentUser.phone || currentUser.email}
          </div>
        </div>

        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          id="user-profile-dropdown"
          className="absolute right-0 mt-2 w-72 bg-tactical-card border border-tactical-border rounded-2xl shadow-2xl z-50 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* User Header */}
          <div className="flex items-start gap-3 pb-3 border-b border-tactical-border">
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-10 h-10 rounded-xl object-cover border-2 border-tactical-border"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-white">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="font-hud font-bold text-sm text-white truncate">
                  {currentUser.name}
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  VERIFIED
                </span>
              </div>
              <div className="text-xs font-mono text-slate-400 truncate">
                {currentUser.email || currentUser.phone}
              </div>
              <div className="text-[10px] font-mono text-tactical-cyan mt-0.5">
                {isHospital ? (
                  <span className="text-tactical-red font-bold">
                    {currentUser.staffDesignation} • {currentUser.badgeId}
                  </span>
                ) : (
                  <span>Citizen Patient • Blood {currentUser.bloodGroup || 'B+'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Details / Emergency Medical ID */}
          {isHospital ? (
            <div className="bg-tactical-surface p-2.5 rounded-xl border border-tactical-border space-y-1 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-400">
                <span>Facility:</span>
                <span className="text-white font-bold truncate max-w-[150px]">
                  {currentUser.hospitalName}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Department:</span>
                <span className="text-tactical-cyan">{currentUser.department || 'Emergency Bay'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Auth Level:</span>
                <span className="text-emerald-400">Level 1 Triage Clear</span>
              </div>
            </div>
          ) : (
            <div className="bg-tactical-surface p-2.5 rounded-xl border border-tactical-border space-y-1 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-400">
                <span>Emergency Contact:</span>
                <span className="text-white">{currentUser.emergencyContactName}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Contact Phone:</span>
                <span className="text-tactical-cyan">{currentUser.emergencyContactPhone}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Allergies:</span>
                <span className="text-tactical-red">{currentUser.allergies?.join(', ') || 'None'}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-1.5 pt-1">
            <button
              onClick={() => {
                setIsOpen(false);
                onSwitchRole();
              }}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-tactical-cyan" />
                <span>Switch Account / Hospital</span>
              </div>
              <span className="text-[10px] text-slate-400">Change</span>
            </button>

            <button
              id="btn-logout"
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full py-2 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-xs font-mono flex items-center gap-2 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Log Out ({currentUser.name.split(' ')[0]})</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
