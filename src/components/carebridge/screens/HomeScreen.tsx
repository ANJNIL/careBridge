import React, { useState } from 'react';
import { CareBridgeScreen } from '../types';
import { SupportedLanguage, AuthUser, UserRole } from '../../../types';
import { 
  Heart, 
  Mic, 
  AlertOctagon, 
  Building2, 
  Droplets, 
  Pill, 
  Users, 
  ChevronRight, 
  Globe, 
  Radio, 
  PhoneCall, 
  Activity,
  WifiOff,
  Zap,
  User,
  ShieldCheck
} from 'lucide-react';

interface HomeScreenProps {
  onNavigate: (screen: CareBridgeScreen) => void;
  selectedLanguage: SupportedLanguage;
  onChangeLanguage: (lang: SupportedLanguage) => void;
  problemText: string;
  setProblemText: (val: string) => void;
  onQuickSos: () => void;
  onSelectCategory?: (category: 'all' | 'hospitals' | 'emergency' | 'blood_bank' | 'pharmacy') => void;
  currentUser?: AuthUser | null;
  onOpenAuthModal?: (role?: UserRole) => void;
  onDirectLogin?: (role: UserRole) => void;
  onLogout?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  selectedLanguage,
  onChangeLanguage,
  problemText,
  setProblemText,
  onQuickSos,
  onSelectCategory,
  currentUser,
  onOpenAuthModal,
  onDirectLogin,
  onLogout,
}) => {
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  const languageLabels: Record<SupportedLanguage, string> = {
    hi: 'हिंदी',
    en: 'English',
    ta: 'தமிழ்',
    te: 'తెలుగు',
    mr: 'मराठी',
  };

  return (
    <div className="w-full space-y-4 pb-20">
      {/* Header with CareBridge Logo & Language Dropdown */}
      <header className="flex items-center justify-between pt-1 pb-2">
        <div className="flex items-center gap-2.5">
          {/* Heart Beat Logo */}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-md shadow-red-500/20 text-white">
            <Heart className="w-6 h-6 fill-white stroke-red-600 stroke-1" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 leading-tight tracking-tight">
              CareBridge
            </h1>
            <p className="text-[11px] font-medium text-slate-500 leading-none">
              Emergency Healthcare Navigator
            </p>
          </div>
        </div>

        {/* Language Pill Dropdown */}
        <div className="relative">
          <button
            id="btn-lang-dropdown"
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm transition-all"
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>{languageLabels[selectedLanguage]}</span>
            <span className="text-[10px] text-slate-400">▾</span>
          </button>

          {showLangDropdown && (
            <div className="absolute right-0 top-full mt-1.5 w-36 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs font-medium text-slate-700 animate-in fade-in zoom-in-95 duration-150">
              {(Object.keys(languageLabels) as SupportedLanguage[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    onChangeLanguage(lang);
                    setShowLangDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-sky-50 transition-colors ${
                    selectedLanguage === lang ? 'text-blue-600 font-bold bg-sky-50/60' : ''
                  }`}
                >
                  <span>{languageLabels[lang]}</span>
                  {selectedLanguage === lang && <span className="text-blue-600 font-bold">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Direct Login for User and Hospital Banner */}
      <div 
        id="home-direct-login-banner"
        className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 p-3 text-white shadow-md relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
              <Zap className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold tracking-tight text-white">Direct 1-Click Login</span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  INSTANT
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                {currentUser ? (
                  <span>Verified: <strong className="text-white">{currentUser.name}</strong> ({currentUser.role === 'hospital_staff' ? currentUser.hospitalName?.split(' ')[0] + ' ER' : 'Citizen Patient'})</span>
                ) : (
                  <span>Instant access for Citizen Patient or Hospital ER Staff</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {currentUser ? (
              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                <button
                  id="btn-switch-account-home"
                  onClick={() => onOpenAuthModal && onOpenAuthModal(currentUser.role === 'hospital_staff' ? 'patient' : 'hospital_staff')}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
                >
                  Switch Role
                </button>
                {onLogout && (
                  <button
                    id="btn-logout-home"
                    onClick={onLogout}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all"
                  >
                    Logout
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  id="btn-home-direct-user"
                  onClick={() => {
                    if (onDirectLogin) onDirectLogin('patient');
                    else if (onOpenAuthModal) onOpenAuthModal('patient');
                  }}
                  className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Direct User Login</span>
                </button>
                <button
                  id="btn-home-direct-hospital"
                  onClick={() => {
                    if (onDirectLogin) onDirectLogin('hospital_staff');
                    else if (onOpenAuthModal) onOpenAuthModal('hospital_staff');
                  }}
                  className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Direct Hospital Login</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hero Card: "Your Health is Our Priority" */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-sky-100/90 via-sky-50/80 to-white border border-sky-200/70 p-5 sm:p-6 text-center shadow-sm">
        {/* Soft decorative background circles */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-sky-200/40 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-200/30 rounded-full blur-2xl pointer-events-none" />

        {/* Heart Pulse Emblem */}
        <div className="relative mx-auto mb-3 w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500 to-red-500 shadow-lg shadow-red-500/30 flex items-center justify-center text-white">
          <Activity className="w-8 h-8 text-white animate-pulse" />
          <div className="absolute inset-0 rounded-full border-2 border-white/40" />
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Your Health is Our Priority
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          Instant triage, verified emergency beds, and rapid route navigation across Indore, MP.
        </p>
      </div>

      {/* Problem Search Bar: "Tell your problem... Type or speak in Hindi / English" */}
      <div 
        id="home-problem-input-card"
        onClick={() => onNavigate('tell_problem')}
        className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 p-2.5 sm:p-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="w-10 h-10 rounded-full bg-slate-900 group-hover:bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm transition-colors">
          <Mic className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 text-left">
          <div className="text-sm font-semibold text-slate-800">
            {problemText ? problemText : 'Tell your problem...'}
          </div>
          <div className="text-[11px] text-slate-400">
            Type or speak in Hindi / English
          </div>
        </div>
      </div>

      {/* Emergency Primary Banner: "EMERGENCY - Tap for immediate help >" */}
      <button
        id="home-emergency-banner-btn"
        onClick={() => {
          onQuickSos();
          onNavigate('emergency_detected');
        }}
        className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white rounded-2xl p-4 sm:p-4.5 flex items-center justify-between shadow-lg shadow-red-600/25 active:scale-[0.98] transition-all group"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0 group-hover:rotate-6 transition-transform">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div className="text-left leading-tight">
            <div className="text-base sm:text-lg font-black tracking-wider uppercase">
              EMERGENCY
            </div>
            <div className="text-xs text-red-100 font-medium">
              Tap for immediate help &gt;
            </div>
          </div>
        </div>
        <ChevronRight className="w-6 h-6 text-white/90 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* 4-Grid Shortcuts */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* 1. Find Hospitals & Emergency */}
        <button
          id="btn-shortcut-hospitals"
          onClick={() => {
            if (onSelectCategory) onSelectCategory('all');
            onNavigate('facilities');
          }}
          className="bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 text-left flex items-start gap-3 shadow-xs hover:shadow-md transition-all group active:scale-[0.98]"
        >
          <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0 group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
              Find Hospitals &amp; Emergency
            </h3>
          </div>
        </button>

        {/* 2. Blood Bank Donors */}
        <button
          id="btn-shortcut-bloodbank"
          onClick={() => {
            if (onSelectCategory) onSelectCategory('blood_bank');
            onNavigate('facilities');
          }}
          className="bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 text-left flex items-start gap-3 shadow-xs hover:shadow-md transition-all group active:scale-[0.98]"
        >
          <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0 group-hover:scale-105 transition-transform">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
              Blood Bank Donors
            </h3>
          </div>
        </button>

        {/* 3. Pharmacies (24x7) */}
        <button
          id="btn-shortcut-pharmacy"
          onClick={() => {
            if (onSelectCategory) onSelectCategory('pharmacy');
            onNavigate('facilities');
          }}
          className="bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 text-left flex items-start gap-3 shadow-xs hover:shadow-md transition-all group active:scale-[0.98]"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-105 transition-transform">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
              Pharmacies (24x7)
            </h3>
          </div>
        </button>

        {/* 4. Share Location with Family */}
        <button
          id="btn-shortcut-family"
          onClick={() => onNavigate('share_family')}
          className="bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 text-left flex items-start gap-3 shadow-xs hover:shadow-md transition-all group active:scale-[0.98]"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
              Share Location with Family
            </h3>
          </div>
        </button>
      </div>

      {/* Quick Offline Mode Banner (Screen 10 access) */}
      <div className="pt-1">
        <button
          id="btn-home-offline-preview"
          onClick={() => onNavigate('offline_mode')}
          className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/80 flex items-center justify-between text-xs text-slate-600 transition-colors"
        >
          <div className="flex items-center gap-2">
            <WifiOff className="w-3.5 h-3.5 text-slate-500" />
            <span>Zero-Data Mode (Offline GSM Emergency Relay)</span>
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            Test Offline &gt;
          </span>
        </button>
      </div>
    </div>
  );
};
