import React from 'react';
import { ActiveAppView, AuthUser } from '../types';
import { UserProfileMenu } from './auth/UserProfileMenu';
import { 
  ShieldAlert, 
  Smartphone, 
  Building2, 
  SplitSquareVertical, 
  FileText, 
  PhoneCall, 
  Activity,
  Radio,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  activeView: ActiveAppView;
  onSelectView: (view: ActiveAppView) => void;
  pendingDispatchesCount: number;
  onQuickSos: () => void;
  onOpenEmergencyContacts?: () => void;
  currentUser: AuthUser | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onSwitchRole: () => void;
  onOpenAIAnalyzer?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  onSelectView,
  pendingDispatchesCount,
  onQuickSos,
  onOpenEmergencyContacts,
  currentUser,
  onOpenLogin,
  onLogout,
  onSwitchRole,
  onOpenAIAnalyzer,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-950/50 ring-2 ring-rose-400/30">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white">CareBridge</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 tracking-wide uppercase">
                Emergency Triage
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Multilingual Emergency Healthcare & Hospital Resource Navigator
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-tactical-surface p-1 rounded-xl border border-tactical-border text-xs sm:text-sm overflow-x-auto no-scrollbar">
          <button
            id="nav-btn-carebridge"
            onClick={() => onSelectView('carebridge_ui')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeView === 'carebridge_ui'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-tactical-card'
            }`}
          >
            <Smartphone className="w-4 h-4 text-white" />
            <span>CareBridge App</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-white/20 text-white rounded font-mono font-bold">11 Screens</span>
          </button>

          <button
            id="nav-btn-tactical"
            onClick={() => onSelectView('tactical_hud')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-hud font-bold transition-all ${
              activeView === 'tactical_hud'
                ? 'bg-tactical-red text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-tactical-card'
            }`}
          >
            <Radio className="w-4 h-4 text-white" />
            <span className="hidden md:inline">Tactical HUD</span>
            <span className="md:hidden">HUD</span>
          </button>

          <button
            id="nav-btn-patient"
            onClick={() => onSelectView('patient_mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeView === 'patient_mobile'
                ? 'bg-tactical-red text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-tactical-card'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden md:inline">Patient Mobile</span>
            <span className="md:hidden">Patient</span>
          </button>

          <button
            id="nav-btn-hospital"
            onClick={() => onSelectView('hospital_portal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all relative ${
              activeView === 'hospital_portal'
                ? 'bg-tactical-red text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-tactical-card'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span className="hidden md:inline">Hospital ER Portal</span>
            <span className="md:hidden">Hospital</span>
            {pendingDispatchesCount > 0 && (
              <span className="ml-1 w-5 h-5 rounded-full bg-tactical-red text-white text-[10px] flex items-center justify-center font-bold animate-pulse">
                {pendingDispatchesCount}
              </span>
            )}
          </button>

          <button
            id="nav-btn-split"
            onClick={() => onSelectView('split_live_loop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeView === 'split_live_loop'
                ? 'bg-tactical-red text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-tactical-card'
            }`}
            title="Live Demo Verification Loop (Side-by-side Patient + Hospital)"
          >
            <SplitSquareVertical className="w-4 h-4 text-tactical-amber" />
            <span className="hidden lg:inline">Live Demo Loop</span>
            <span className="lg:hidden">Live Loop</span>
            <span className="text-[10px] px-1 py-0.2 bg-tactical-amber/20 text-tactical-amber rounded font-semibold font-mono">
              Live
            </span>
          </button>

          <button
            id="nav-btn-spec"
            onClick={() => onSelectView('pm_spec')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeView === 'pm_spec'
                ? 'bg-tactical-red text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-tactical-card'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="hidden md:inline">PM Spec</span>
            <span className="md:hidden">Spec</span>
          </button>
        </div>

        {/* User Auth Profile & SOS Action */}
        <div className="flex items-center gap-2">
          {/* AI Problem Auto-Analyzer & Hospital Suggester Button */}
          {onOpenAIAnalyzer && (
            <button
              id="navbar-ai-analyzer-btn"
              onClick={onOpenAIAnalyzer}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/50 hover:to-blue-600/50 border border-cyan-500/40 text-cyan-200 text-xs sm:text-sm font-semibold shadow-sm transition-all active:scale-95 group"
              title="Auto-Analyze Problem by AI & Suggest Best Hospitals"
            >
              <Sparkles className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
              <span className="hidden md:inline font-hud tracking-wide">AI Auto-Analyze</span>
              <span className="md:hidden font-hud">AI</span>
              <span className="hidden lg:inline text-[10px] px-1.5 py-0.2 bg-cyan-400/20 text-cyan-300 rounded font-mono font-bold">
                Suggest
              </span>
            </button>
          )}

          {/* User and Hospital Login Badge / Menu */}
          <UserProfileMenu
            currentUser={currentUser}
            onOpenLogin={onOpenLogin}
            onLogout={onLogout}
            onSwitchRole={onSwitchRole}
          />

          {/* Manage Emergency Numbers Option */}
          {onOpenEmergencyContacts && (
            <button
              id="navbar-emergency-numbers-btn"
              onClick={onOpenEmergencyContacts}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition-all active:scale-95 group"
              title="Add / Manage Emergency Numbers (Family, Doctor, Ambulance)"
            >
              <PhoneCall className="w-3.5 h-3.5 text-red-400 group-hover:scale-110 transition-transform" />
              <span className="hidden lg:inline font-mono">Emergency Numbers</span>
              <span className="lg:hidden font-mono">Numbers</span>
            </button>
          )}

          {/* Emergency SOS Auto-Call Button */}
          <button
            id="global-sos-call-btn"
            onClick={onQuickSos}
            className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-hud font-black text-xs sm:text-sm shadow-md shadow-red-950/60 transition-transform active:scale-95 ring-2 ring-red-400/40 relative overflow-hidden group"
            title="Emergency: Click to Auto-Call Primary Emergency Number"
          >
            <span className="absolute -inset-1 rounded-xl bg-white/20 animate-pulse pointer-events-none" />
            <PhoneCall className="w-4 h-4 animate-bounce shrink-0" />
            <span className="hidden sm:inline tracking-wide font-extrabold">SOS AUTO-CALL</span>
            <span className="sm:hidden font-bold">SOS</span>
          </button>
        </div>
      </div>
    </header>
  );
};

