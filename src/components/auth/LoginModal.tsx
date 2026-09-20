import React, { useState, useEffect, useRef } from 'react';
import { AuthUser, UserRole, AuthProvider, Hospital } from '../../types';
import { SoundFX } from '../../utils/speech';
import { 
  normalizeVoiceToPhoneNumber, 
  normalizeVoiceToEmail, 
  normalizeVoiceToDigits, 
  startVoiceInputSession,
  VoiceListenerHandle 
} from '../../utils/voiceInput';
import { 
  User, 
  Building2, 
  Phone, 
  Mail, 
  Mic, 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X,
  Stethoscope,
  HeartPulse,
  Zap,
  Activity,
  UserCheck,
  Check
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
  hospitals: Hospital[];
  initialRole?: UserRole;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  hospitals,
  initialRole = 'patient',
}) => {
  // Mode: Direct 1-Click Login (default) vs Custom Manual Input
  const [loginMode, setLoginMode] = useState<'direct' | 'manual'>('direct');
  
  // In Direct Mode: view both, or filter to specific role
  const [directRoleFilter, setDirectRoleFilter] = useState<'both' | 'patient' | 'hospital_staff'>('both');

  // Active role for manual input
  const [activeRole, setActiveRole] = useState<UserRole>(initialRole);
  const [authMethod, setAuthMethod] = useState<AuthProvider>('google');

  // Citizen Direct Preset selection
  const citizenPresets = [
    {
      name: 'Rajesh Kumar',
      relation: 'Father / Head of Household (52y)',
      phone: '+91 98450 12345',
      email: 'rajesh.kumar@gmail.com',
      bloodGroup: 'B+',
      emergencyContactName: 'Pooja Rao (Spouse)',
      emergencyContactPhone: '+91 98450 99881',
      allergies: ['Penicillin'],
      medicalConditions: ['Mild Hypertension'],
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Pooja Rao',
      relation: 'Spouse / Primary Caregiver (48y)',
      phone: '+91 98450 99881',
      email: 'pooja.rao@gmail.com',
      bloodGroup: 'O+',
      emergencyContactName: 'Rajesh Kumar (Husband)',
      emergencyContactPhone: '+91 98450 12345',
      allergies: ['Sulfa drugs'],
      medicalConditions: ['None reported'],
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Amit Verma',
      relation: 'Self / Citizen (28y)',
      phone: '+91 97110 44321',
      email: 'amit.verma@gmail.com',
      bloodGroup: 'A+',
      emergencyContactName: 'Suman Verma (Mother)',
      emergencyContactPhone: '+91 98201 99000',
      allergies: ['None'],
      medicalConditions: ['None'],
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    }
  ];
  const [selectedCitizenIdx, setSelectedCitizenIdx] = useState<number>(0);

  // Hospital Direct State
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(hospitals[0]?.id || 'h1');
  const [staffDesignation, setStaffDesignation] = useState<string>('Chief Triage Physician');
  const [badgeId, setBadgeId] = useState<string>('ER-7429');
  const [doctorName, setDoctorName] = useState<string>('Dr. Sarah Rao, MD');

  // Manual Form Fields
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');

  // Phone OTP Flow State (Manual)
  const [step, setStep] = useState<'input' | 'otp_verify'>('input');
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [simulatedOtp, setSimulatedOtp] = useState<string>('');
  const [otpTimer, setOtpTimer] = useState<number>(30);
  const [otpSentToast, setOtpSentToast] = useState<string | null>(null);

  // Voice to Text State
  const [isVoiceListening, setIsVoiceListening] = useState<boolean>(false);
  const [voiceTargetField, setVoiceTargetField] = useState<'phone' | 'email' | 'otp' | null>(null);
  const [voiceInterimText, setVoiceInterimText] = useState<string>('');
  const [voiceStatusNotice, setVoiceStatusNotice] = useState<string | null>(null);
  const voiceHandleRef = useRef<VoiceListenerHandle | null>(null);

  // Validation & Loading
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync initial role when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveRole(initialRole);
      setDirectRoleFilter(initialRole === 'hospital_staff' ? 'hospital_staff' : initialRole === 'patient' ? 'patient' : 'both');
      setStep('input');
      setErrorMessage(null);
      setVoiceStatusNotice(null);
      setLoginMode('direct');
    }
  }, [isOpen, initialRole]);

  // OTP Countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'otp_verify' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, otpTimer]);

  // Clean up voice session on unmount
  useEffect(() => {
    return () => {
      if (voiceHandleRef.current) {
        voiceHandleRef.current.stop();
      }
    };
  }, []);

  if (!isOpen) return null;

  // =========================================================================
  // DIRECT 1-CLICK ACTIONS
  // =========================================================================

  // 1. Direct Login as Citizen / Patient
  const handleDirectCitizenLogin = (presetIndex: number = selectedCitizenIdx) => {
    SoundFX.init();
    SoundFX.cardiacPulse();
    setIsLoading(true);

    setTimeout(() => {
      const preset = citizenPresets[presetIndex] || citizenPresets[0];
      const newUser: AuthUser = {
        id: `usr_${Date.now()}`,
        name: preset.name,
        email: preset.email,
        phone: preset.phone,
        role: 'patient',
        provider: 'google',
        verified: true,
        avatarUrl: preset.avatarUrl,
        bloodGroup: preset.bloodGroup,
        emergencyContactName: preset.emergencyContactName,
        emergencyContactPhone: preset.emergencyContactPhone,
        allergies: preset.allergies,
        medicalConditions: preset.medicalConditions,
      };

      localStorage.setItem('carebridge_user', JSON.stringify(newUser));
      setIsLoading(false);
      onLoginSuccess(newUser);
      onClose();
    }, 200);
  };

  // 2. Direct Login as Hospital Staff
  const handleDirectHospitalLogin = (customHospId?: string) => {
    SoundFX.init();
    SoundFX.sirenBurst();
    setIsLoading(true);

    const targetHospId = customHospId || selectedHospitalId;
    const selectedHospital = hospitals.find((h) => h.id === targetHospId) || hospitals[0];

    setTimeout(() => {
      const newUser: AuthUser = {
        id: `usr_hosp_${Date.now()}`,
        name: doctorName.trim() || 'Dr. Sarah Rao, MD',
        email: `er.command@${selectedHospital.name.toLowerCase().replace(/[^a-z]/g, '')}.org`,
        phone: '+91 98450 88221',
        role: 'hospital_staff',
        provider: 'google',
        verified: true,
        avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
        hospitalId: selectedHospital.id,
        hospitalName: selectedHospital.name,
        staffDesignation: staffDesignation,
        badgeId: badgeId,
        department: 'Emergency & Critical Care Bay',
      };

      localStorage.setItem('carebridge_user', JSON.stringify(newUser));
      setIsLoading(false);
      onLoginSuccess(newUser);
      onClose();
    }, 200);
  };

  // =========================================================================
  // VOICE & MANUAL INPUT FLOW (OPTIONAL FALLBACK)
  // =========================================================================

  const triggerVoiceDictation = async (field: 'phone' | 'email' | 'otp') => {
    SoundFX.init();
    SoundFX.alertSonar();

    if (isVoiceListening) {
      if (voiceHandleRef.current) {
        voiceHandleRef.current.stop();
      }
      setIsVoiceListening(false);
      setVoiceTargetField(null);
      setVoiceInterimText('');
      return;
    }

    setIsVoiceListening(true);
    setVoiceTargetField(field);
    setVoiceInterimText('');
    setVoiceStatusNotice(`Listening... Speak your ${field === 'phone' ? 'phone number' : field === 'email' ? 'Gmail address' : '6-digit OTP code'}`);

    try {
      const handle = await startVoiceInputSession({
        language: 'en',
        onInterim: (text) => setVoiceInterimText(text),
        onFinal: (finalSpeech) => {
          setIsVoiceListening(false);
          setVoiceTargetField(null);
          setVoiceInterimText('');

          if (field === 'phone') {
            const digits = normalizeVoiceToPhoneNumber(finalSpeech);
            if (digits) {
              setPhone(digits);
              setVoiceStatusNotice(`Recognized phone: ${digits}`);
              SoundFX.cardiacPulse();
            } else {
              setVoiceStatusNotice(`Could not detect digits from: "${finalSpeech}"`);
            }
          } else if (field === 'email') {
            const parsedEmail = normalizeVoiceToEmail(finalSpeech);
            if (parsedEmail) {
              setEmail(parsedEmail);
              setVoiceStatusNotice(`Recognized Gmail: ${parsedEmail}`);
              SoundFX.cardiacPulse();
            } else {
              setVoiceStatusNotice(`Could not parse email from: "${finalSpeech}"`);
            }
          } else if (field === 'otp') {
            const digits = normalizeVoiceToDigits(finalSpeech, 6);
            if (digits) {
              const newOtp = digits.split('');
              while (newOtp.length < 6) newOtp.push('');
              setOtpValues(newOtp);
              setVoiceStatusNotice(`Recognized OTP: ${digits}`);
              SoundFX.cardiacPulse();
            }
          }
        },
        onError: (err) => {
          setIsVoiceListening(false);
          setVoiceTargetField(null);
          setVoiceStatusNotice(`Voice Error: ${err}`);
        },
      });

      voiceHandleRef.current = handle;
    } catch {
      setIsVoiceListening(false);
      setVoiceTargetField(null);
      setVoiceStatusNotice('Speech recognition unavailable in this browser context.');
    }
  };

  const handleSendOtp = () => {
    setErrorMessage(null);
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit phone number (or use Voice to dictate).');
      return;
    }

    setIsLoading(true);
    SoundFX.cardiacPulse();

    setTimeout(() => {
      setIsLoading(false);
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      setSimulatedOtp(randomCode);
      setStep('otp_verify');
      setOtpTimer(30);
      setOtpValues(['', '', '', '', '', '']);
      setOtpSentToast(`Verification Code: ${randomCode} (Sent to +91 ${cleanPhone})`);
      SoundFX.alertSonar();
    }, 400);
  };

  const handleVerifyOtp = () => {
    const entered = otpValues.join('');
    if (entered !== simulatedOtp && entered !== '123456') {
      setErrorMessage('Invalid OTP code. Please enter the 6 digits shown or click Auto-fill.');
      return;
    }

    finalizeManualLogin('phone', phone);
  };

  const handleGoogleSignIn = (customEmail?: string) => {
    setErrorMessage(null);
    const targetEmail = customEmail || email || (activeRole === 'hospital_staff' ? 'dr.sarah.rao@apollohospitals.org' : 'patient.rajesh@gmail.com');

    if (!targetEmail.includes('@')) {
      setErrorMessage('Please enter a valid Gmail / Google Account address.');
      return;
    }

    setIsLoading(true);
    SoundFX.cardiacPulse();

    setTimeout(() => {
      setIsLoading(false);
      finalizeManualLogin('google', targetEmail);
    }, 400);
  };

  const finalizeManualLogin = (provider: AuthProvider, identifier: string) => {
    const selectedHospital = hospitals.find((h) => h.id === selectedHospitalId) || hospitals[0];

    const newUser: AuthUser = {
      id: `usr_${Date.now()}`,
      name:
        customName.trim() ||
        (activeRole === 'hospital_staff'
          ? doctorName || 'Dr. Sarah Rao, MD'
          : provider === 'google'
          ? identifier.split('@')[0].replace('.', ' ').toUpperCase()
          : `Citizen User (${identifier.slice(-4)})`),
      email: provider === 'google' ? identifier : undefined,
      phone: provider === 'phone' ? `+91 ${identifier.slice(-10)}` : undefined,
      role: activeRole,
      provider: provider,
      verified: true,
      avatarUrl:
        activeRole === 'hospital_staff'
          ? 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      bloodGroup: 'B+',
      emergencyContactName: 'Pooja Rao (Spouse)',
      emergencyContactPhone: '+91 98450 99881',
      allergies: ['Penicillin'],
      medicalConditions: ['Mild Hypertension'],
      hospitalId: activeRole === 'hospital_staff' ? selectedHospital.id : undefined,
      hospitalName: activeRole === 'hospital_staff' ? selectedHospital.name : undefined,
      staffDesignation: activeRole === 'hospital_staff' ? staffDesignation : undefined,
      badgeId: activeRole === 'hospital_staff' ? badgeId : undefined,
      department: activeRole === 'hospital_staff' ? 'Emergency & Critical Care Bay' : undefined,
    };

    localStorage.setItem('carebridge_user', JSON.stringify(newUser));
    SoundFX.sirenBurst();
    onLoginSuccess(newUser);
    onClose();
  };

  const activePreset = citizenPresets[selectedCitizenIdx];
  const activeHospital = hospitals.find((h) => h.id === selectedHospitalId) || hospitals[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        id="carebridge-login-modal"
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header Strip */}
        <div className="bg-slate-950 px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-md shadow-red-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>CareBridge Authentication</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  DIRECT 1-CLICK ACCESS
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Direct Login for Citizen / Patient &amp; Hospital ER Command
              </p>
            </div>
          </div>
          <button
            id="btn-close-login"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Mode Toggle: Direct 1-Click vs Manual Form */}
        <div className="px-5 sm:px-6 pt-3 pb-2 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => {
                SoundFX.tapTick();
                setLoginMode('direct');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                loginMode === 'direct'
                  ? 'bg-blue-600 text-white shadow-sm font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Direct 1-Click Login</span>
            </button>

            <button
              onClick={() => {
                SoundFX.tapTick();
                setLoginMode('manual');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                loginMode === 'manual'
                  ? 'bg-blue-600 text-white shadow-sm font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Manual Credentials (OTP / Gmail)</span>
            </button>
          </div>

          {loginMode === 'direct' && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">View:</span>
              <button
                onClick={() => setDirectRoleFilter('both')}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  directRoleFilter === 'both' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Both Cards
              </button>
              <button
                onClick={() => setDirectRoleFilter('patient')}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  directRoleFilter === 'patient' ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                User Only
              </button>
              <button
                onClick={() => setDirectRoleFilter('hospital_staff')}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  directRoleFilter === 'hospital_staff' ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Hospital Only
              </button>
            </div>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 no-scrollbar">

          {/* ========================================================================= */}
          {/* TAB 1: DIRECT 1-CLICK LOGIN CARDS (USER & HOSPITAL)                       */}
          {/* ========================================================================= */}
          {loginMode === 'direct' && (
            <div className="space-y-4">
              <div className={`grid gap-4 ${directRoleFilter === 'both' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                
                {/* ------------------------------------------------------------- */}
                {/* CARD 1: DIRECT CITIZEN / USER LOGIN                           */}
                {/* ------------------------------------------------------------- */}
                {(directRoleFilter === 'both' || directRoleFilter === 'patient') && (
                  <div className="bg-gradient-to-b from-slate-800/90 to-slate-900 border-2 border-sky-500/50 hover:border-sky-400 rounded-3xl p-5 flex flex-col justify-between shadow-xl transition-all relative overflow-hidden group">
                    {/* Top Accent Ribbon */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 to-blue-600" />
                    
                    <div className="space-y-3.5">
                      {/* Header with Avatar & Role */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={activePreset.avatarUrl}
                            alt={activePreset.name}
                            className="w-12 h-12 rounded-2xl object-cover border-2 border-sky-400/60 shadow-md"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider font-mono">
                                USER ACCESS
                              </span>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            </div>
                            <h3 className="text-lg font-black text-white leading-tight">
                              Citizen / Patient
                            </h3>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          1-TAP READY
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed font-medium">
                        Instant emergency triage, AI symptom analysis, 108 SOS dispatch, and pre-arrival SBAR digital handoff.
                      </p>

                      {/* Select Profile Preset */}
                      <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Select User Profile:
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {citizenPresets.map((preset, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                SoundFX.tapTick();
                                setSelectedCitizenIdx(idx);
                              }}
                              className={`p-1.5 rounded-xl text-left border text-xs transition-all ${
                                selectedCitizenIdx === idx
                                  ? 'bg-sky-500/20 border-sky-400 text-white font-bold'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <div className="truncate font-semibold">{preset.name.split(' ')[0]}</div>
                              <div className="text-[9px] text-slate-500 truncate">{preset.relation.split('/')[0]}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Medical ID Preview */}
                      <div className="bg-slate-950/40 rounded-xl p-2.5 border border-slate-800/80 text-xs space-y-1 font-mono">
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400">Selected Name:</span>
                          <span className="font-bold text-white">{activePreset.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400">Emergency Phone:</span>
                          <span className="text-sky-300 font-bold">{activePreset.phone}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400">Blood Group / Contact:</span>
                          <span className="text-emerald-400 font-bold">{activePreset.bloodGroup} • {activePreset.emergencyContactName.split(' ')[0]}</span>
                        </div>
                      </div>
                    </div>

                    {/* Direct Login Action Button */}
                    <div className="pt-4 space-y-2">
                      <button
                        id="btn-direct-login-user"
                        onClick={() => handleDirectCitizenLogin()}
                        disabled={isLoading}
                        className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-sky-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-sky-600/30 active:scale-[0.98] transition-all"
                      >
                        <User className="w-4 h-4 text-white" />
                        <span>⚡ Direct Login as Patient ({activePreset.name.split(' ')[0]})</span>
                        <ArrowRight className="w-4 h-4 text-white/90" />
                      </button>

                      <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400">
                        <span>Pre-cleared Medical ID</span>
                        <span>•</span>
                        <span>Zero Wait Time</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* CARD 2: DIRECT HOSPITAL ER COMMAND LOGIN                      */}
                {/* ------------------------------------------------------------- */}
                {(directRoleFilter === 'both' || directRoleFilter === 'hospital_staff') && (
                  <div className="bg-gradient-to-b from-slate-800/90 to-slate-900 border-2 border-rose-500/50 hover:border-rose-400 rounded-3xl p-5 flex flex-col justify-between shadow-xl transition-all relative overflow-hidden group">
                    {/* Top Accent Ribbon */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-red-600" />

                    <div className="space-y-3.5">
                      {/* Header with Avatar & Role */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80"
                            alt="Dr. Sarah Rao"
                            className="w-12 h-12 rounded-2xl object-cover border-2 border-rose-400/60 shadow-md"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider font-mono">
                                COMMAND DESK
                              </span>
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                            </div>
                            <h3 className="text-lg font-black text-white leading-tight">
                              Hospital ER Staff
                            </h3>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          AUTH LEVEL 1
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed font-medium">
                        Live ICU/Oxygen bed allocation, incoming ambulance telemetry, patient SBAR queue &amp; instant token pre-clearance.
                      </p>

                      {/* Select Hospital Facility */}
                      <div className="space-y-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                        <div>
                          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Associated Facility (Indore):
                          </label>
                          <select
                            id="select-direct-hospital"
                            value={selectedHospitalId}
                            onChange={(e) => {
                              SoundFX.tapTick();
                              setSelectedHospitalId(e.target.value);
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-rose-500"
                          >
                            {hospitals.map((h) => (
                              <option key={h.id} value={h.id}>
                                {h.name} • {h.icuBedsAvailable} ICU Free
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">Staff Officer:</label>
                            <input
                              type="text"
                              value={doctorName}
                              onChange={(e) => setDoctorName(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">Title / Badge:</label>
                            <input
                              type="text"
                              value={`${staffDesignation} • ${badgeId}`}
                              readOnly
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-rose-300 font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 1-Click Fast Hospital Shortcut Pills */}
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">Quick Pick:</span>
                        {hospitals.slice(0, 3).map((h) => (
                          <button
                            key={h.id}
                            onClick={() => {
                              setSelectedHospitalId(h.id);
                              handleDirectHospitalLogin(h.id);
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono shrink-0 transition-all ${
                              selectedHospitalId === h.id
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {h.name.split(' ')[0]} ER
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Direct Login Action Button */}
                    <div className="pt-4 space-y-2">
                      <button
                        id="btn-direct-login-hospital"
                        onClick={() => handleDirectHospitalLogin()}
                        disabled={isLoading}
                        className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-rose-600/30 active:scale-[0.98] transition-all"
                      >
                        <Building2 className="w-4 h-4 text-white" />
                        <span>⚡ Direct Login as Hospital Staff</span>
                        <ArrowRight className="w-4 h-4 text-white/90" />
                      </button>

                      <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400">
                        <span>{activeHospital.name.split(' ')[0]} Connected</span>
                        <span>•</span>
                        <span>Immediate ER Dispatch Access</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: MANUAL CREDENTIALS (PHONE OTP & GMAIL)                             */}
          {/* ========================================================================= */}
          {loginMode === 'manual' && (
            <div className="space-y-4 bg-slate-950/60 p-4 sm:p-5 rounded-3xl border border-slate-800">
              
              {/* Role Toggle for Manual Input */}
              <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs font-bold">
                <button
                  onClick={() => {
                    setActiveRole('patient');
                    setStep('input');
                    setErrorMessage(null);
                  }}
                  className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                    activeRole === 'patient'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Citizen / Patient Mode</span>
                </button>

                <button
                  onClick={() => {
                    setActiveRole('hospital_staff');
                    setStep('input');
                    setErrorMessage(null);
                  }}
                  className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                    activeRole === 'hospital_staff'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Hospital Staff Mode</span>
                </button>
              </div>

              {/* Method Toggle: Gmail vs Phone OTP */}
              <div className="flex items-center justify-center gap-4 text-xs font-bold border-b border-slate-800 pb-2">
                <button
                  onClick={() => {
                    setAuthMethod('google');
                    setStep('input');
                  }}
                  className={`pb-1 flex items-center gap-1.5 border-b-2 transition-colors ${
                    authMethod === 'google'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  <span>Google / Gmail</span>
                </button>

                <button
                  onClick={() => {
                    setAuthMethod('phone');
                    setStep('input');
                  }}
                  className={`pb-1 flex items-center gap-1.5 border-b-2 transition-colors ${
                    authMethod === 'phone'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  <span>Phone Number (OTP)</span>
                </button>
              </div>

              {/* Voice Status Alert */}
              {voiceStatusNotice && (
                <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-2.5 text-xs text-sky-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-sky-400 animate-pulse" />
                    <span>{voiceStatusNotice}</span>
                  </div>
                  <button onClick={() => setVoiceStatusNotice(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>
              )}

              {/* Error Notice */}
              {errorMessage && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-2.5 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Manual Gmail Input */}
              {authMethod === 'google' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">
                      {activeRole === 'hospital_staff' ? 'Hospital Medical Staff Gmail / Email:' : 'Personal Gmail Address:'}
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={activeRole === 'hospital_staff' ? 'dr.sarah.rao@gmail.com' : 'rajesh.kumar@gmail.com'}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => triggerVoiceDictation('email')}
                        title="Voice dictation"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-400 p-1"
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => handleGoogleSignIn(email)}
                    disabled={isLoading}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <span>Sign In with Gmail</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Manual Phone Input & OTP */}
              {authMethod === 'phone' && (
                <div className="space-y-3">
                  {step === 'input' ? (
                    <>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Mobile Phone Number:</label>
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-300">
                            🇮🇳 +91
                          </div>
                          <div className="relative flex-1">
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="98450 12345"
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-blue-500 pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => triggerVoiceDictation('phone')}
                              title="Voice dictation"
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-400 p-1"
                            >
                              <Mic className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleSendOtp}
                        disabled={isLoading || !phone.trim()}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Send 6-Digit SMS Verification OTP</span>
                      </button>
                    </>
                  ) : (
                    <div className="space-y-3">
                      {otpSentToast && (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-2.5 text-xs text-emerald-300 flex items-center justify-between">
                          <span>{otpSentToast}</span>
                          <button
                            onClick={() => setOtpValues(simulatedOtp.split(''))}
                            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold"
                          >
                            Auto-fill
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-center gap-2">
                        {otpValues.map((digit, idx) => (
                          <input
                            key={idx}
                            id={`otp-box-${idx}`}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              const copy = [...otpValues];
                              copy[idx] = val;
                              setOtpValues(copy);
                              if (val && idx < 5) {
                                document.getElementById(`otp-box-${idx + 1}`)?.focus();
                              }
                            }}
                            className="w-11 h-12 text-center text-lg font-mono font-bold bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 shadow-inner"
                          />
                        ))}
                      </div>

                      <button
                        onClick={handleVerifyOtp}
                        disabled={otpValues.join('').length < 6}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify &amp; Sign In</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>Protected Emergency Healthcare Access • IEC-62304</span>
          <button
            onClick={() => {
              handleDirectCitizenLogin(0);
            }}
            className="text-sky-400 hover:underline font-bold"
          >
            Quick Guest Bypass &gt;
          </button>
        </div>
      </div>
    </div>
  );
};
