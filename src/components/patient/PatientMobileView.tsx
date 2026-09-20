import React, { useState, useEffect, useRef } from 'react';
import { 
  DistressTriageResult, 
  Hospital, 
  SupportedLanguage, 
  BloodBank, 
  Pharmacy,
  AuthUser,
  EmergencyContact,
  IncomingEmergencyDispatch,
  EmergencySectionType
} from '../../types';
import { LANGUAGE_OPTIONS, INITIAL_BLOOD_BANKS, INITIAL_PHARMACIES } from '../../data/hospitals';
import { rankHospitals, formatTriageBadge, categorizeProblem } from '../../utils/triage';
import { LANGUAGE_LOCALE_MAP, playEmergencyTone, speakFirstAidInstruction } from '../../utils/speech';
import {
  getStoredEmergencyContacts,
  getPrimaryEmergencyContact,
  dialPhoneNumber,
} from '../../utils/emergencyContacts';
import { MapRoutingModal } from './MapRoutingModal';
import { DigitalHandshakeModal } from './DigitalHandshakeModal';
import { SmsPanicModal } from './SmsPanicModal';
import { SpecializedEmergencyHub } from '../emergency/SpecializedEmergencyHub';
import { 
  Mic, 
  MicOff, 
  Send, 
  PhoneCall, 
  AlertTriangle, 
  Navigation, 
  Bed, 
  Wind, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Droplets, 
  Pill, 
  Share2, 
  QrCode, 
  WifiOff, 
  Building2, 
  Ambulance, 
  Info,
  ChevronRight,
  RefreshCw,
  Search,
  Sparkles,
  Award,
  Stethoscope,
  Settings,
  Volume2,
  Car,
  AlertOctagon,
  Activity,
  Baby,
  Siren
} from 'lucide-react';

interface PatientMobileViewProps {
  hospitals: Hospital[];
  onDispatchPatient: (payload: {
    triageResult: DistressTriageResult;
    hospital: Hospital;
    ambulanceDispatched: boolean;
    specializedDispatch?: Partial<IncomingEmergencyDispatch>;
  }) => void;
  latestDispatchedId?: string | null;
  currentUser?: AuthUser | null;
  onOpenLogin?: () => void;
  onOpenAIAnalyzer?: (initialText?: string) => void;
  onOpenEmergencyContacts?: () => void;
  onTriggerSos?: () => void;
}

export const PatientMobileView: React.FC<PatientMobileViewProps> = ({
  hospitals,
  onDispatchPatient,
  latestDispatchedId,
  currentUser,
  onOpenLogin,
  onOpenAIAnalyzer,
  onOpenEmergencyContacts,
  onTriggerSos,
}) => {
  // Multilingual state
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('hi');
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Triage state
  const [triageResult, setTriageResult] = useState<DistressTriageResult | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  
  // Modals
  const [showRoutingModal, setShowRoutingModal] = useState(false);
  const [showHandshakeModal, setShowHandshakeModal] = useState(false);
  const [showSmsPanicModal, setShowSmsPanicModal] = useState(false);
  const [sbarSent, setSbarSent] = useState(false);
  const [ambulanceDispatched, setAmbulanceDispatched] = useState(false);

  // Emergency contacts & auto-call state
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(() => getStoredEmergencyContacts());

  // Dedicated Emergency Sections State
  const [activeEmergencySection, setActiveEmergencySection] = useState<EmergencySectionType>('pregnancy');
  const [showSpecializedHub, setShowSpecializedHub] = useState<boolean>(true);

  useEffect(() => {
    const handleUpdate = () => {
      setEmergencyContacts(getStoredEmergencyContacts());
    };
    window.addEventListener('carebridge:emergency_contacts_updated', handleUpdate);
    return () => window.removeEventListener('carebridge:emergency_contacts_updated', handleUpdate);
  }, []);

  const primaryContact = getPrimaryEmergencyContact(emergencyContacts);

  // Auto-analyze distress input in background using Gemini without clicking
  const [autoAnalyzeEnabled, setAutoAnalyzeEnabled] = useState<boolean>(true);
  const [patientTransitTab, setPatientTransitTab] = useState<'immediate' | 'enroute' | 'avoid' | 'vitals' | 'arrival'>('immediate');
  const [patientTransitExpanded, setPatientTransitExpanded] = useState<boolean>(false);

  // Sub-tabs for bonus features
  const [activeTab, setActiveTab] = useState<'hospitals' | 'icu_tracker' | 'blood_banks' | 'pharmacies'>('hospitals');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>('O-');
  const [micError, setMicError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  // Debounced auto-analyze distress with Gemini (no click required)
  useEffect(() => {
    if (!autoAnalyzeEnabled) return;
    const query = inputText.trim();
    if (query.length < 6) return;

    const timer = setTimeout(() => {
      handleAnalyzeDistress(query);
    }, 750);

    return () => clearTimeout(timer);
  }, [inputText, selectedLang, autoAnalyzeEnabled]);

  // Quick preset scenarios to test code-mixing and all Indian languages
  const QUICK_SCENARIOS = [
    {
      title: '🐍 Snakebite / Hindi (सर्पदंश)',
      lang: 'hi' as const,
      text: 'मुझे सांप ने काट लिया है पैर में दो दांत के निशान हैं और बहुत सूजन व असह्य दर्द हो रहा है।',
    },
    {
      title: '🫀 Acute Cardiac / Hinglish',
      lang: 'hi' as const,
      text: 'Mere father ko saans lene mein bahut dikkat ho rahi hai aur chest mein severe pain hai.',
    },
    {
      title: '🧠 Stroke / Tamil',
      lang: 'ta' as const,
      text: 'என் பாட்டிக்கு பேச்சு குளறுகிறது, வலது கை அசையவில்லை மற்றும் முகம் ஒரு பக்கமாக சாய்ந்துள்ளது.',
    },
    {
      title: '💥 High-Impact Trauma / English',
      lang: 'en' as const,
      text: 'Highway bike accident, deep arterial bleeding on thigh and patient is losing consciousness.',
    },
    {
      title: '🫁 Pediatric Distress / Telugu',
      lang: 'te' as const,
      text: 'మా 5 ఏళ్ల బాబుకు విపరీతమైన ఆస్తమా అటాక్ వచ్చింది, పెదవులు నీలంగా మారుతున్నాయి.',
    },
    {
      title: '🦴 Fracture / Marathi',
      lang: 'mr' as const,
      text: 'माझ्या आईचा पाय घसरून पडल्याने हाड मोडले आहे, असह्य वेदना आहेत आणि सूज आली आहे.',
    },
  ];

  // Speech Recognition setup & cleanup
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const toggleListening = async () => {
    setMicError(null);

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    // 1. Trigger microphone permission dialog reliably
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Release tracks quickly after permission granted
        setTimeout(() => {
          stream.getTracks().forEach((t) => t.stop());
        }, 1200);
      }
    } catch (err: any) {
      console.warn('Microphone permission check warning:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicError('Microphone permission blocked. Please enable mic access in your browser or type symptoms below.');
        return;
      }
    }

    // 2. Initialize Web Speech Recognition
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setMicError('Speech recognition is not supported in this browser. Please type symptoms or choose a quick test prompt below.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = LANGUAGE_LOCALE_MAP[selectedLang];
      recognition.maxAlternatives = 1;

      let recordedText = '';

      recognition.onstart = () => {
        setIsListening(true);
        playEmergencyTone('ping');
      };

      recognition.onresult = (event: any) => {
        let finalStr = '';
        let interimStr = '';
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalStr += event.results[i][0].transcript + ' ';
          } else {
            interimStr += event.results[i][0].transcript;
          }
        }
        const full = (finalStr + interimStr).trim();
        if (full) {
          recordedText = full;
          setInputText(full);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
        if (event.error === 'not-allowed') {
          setMicError('Microphone access denied. Please check browser permissions.');
          setIsListening(false);
        } else if (event.error === 'network') {
          setMicError('Speech service connection error. Please type your distress symptoms below.');
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (recordedText.trim()) {
          handleAnalyzeDistress(recordedText.trim());
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Speech recognition start failed:', err);
      setMicError('Could not start microphone. Please type symptoms below or pick a quick scenario.');
      setIsListening(false);
    }
  };

  const handleAnalyzeDistress = async (textToAnalyze?: string) => {
    const text = textToAnalyze || inputText;
    if (!text.trim()) return;

    setIsAnalyzing(true);
    setSbarSent(false);

    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputText: text,
          languageCode: selectedLang,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to evaluate distress triage');
      }

      const data: DistressTriageResult = await res.json();
      setTriageResult(data);
      playEmergencyTone(data.triageLevel === 1 ? 'alert' : 'success');

      // Default to best matched hospital
      const ranked = rankHospitals(hospitals, data);
      if (ranked.length > 0) {
        setSelectedHospital(ranked[0]);
      }
    } catch (err) {
      console.error('Triage analysis error, engaging resilient local fallback:', err);
      try {
        const cat = categorizeProblem(text, selectedLang);
        const triageCat: 'Immediate / Critical' | 'Urgent' | 'Non-Urgent' = 
          cat.urgencyLevel === 1 ? 'Immediate / Critical' : (cat.urgencyLevel === 2 ? 'Urgent' : 'Non-Urgent');
        const fallbackResult: DistressTriageResult = {
          detectedLanguage: cat.languageDetected,
          originalText: text,
          englishTranslation: text,
          triageLevel: cat.urgencyLevel,
          triageCategory: triageCat,
          requiredSpecialties: cat.suggestedFacilityTags.map(t => t.label),
          keySignals: cat.symptoms,
          urgencyReasoning: `${cat.urgencyTitle}: ${cat.urgencySubtitle}`,
          immediateFirstAidGuidance: cat.firstAidSteps,
          interimTransitSolution: cat.interimTransitSolution,
          safetyDisclaimer: 'Triage guidance only. In an emergency, call 108/112 immediately.',
          suggestedFacilityType: cat.recommendedDepartment,
          criticalGoldenHourAlert: cat.urgencyLevel === 1,
          sbar: {
            situation: `Patient presenting with ${cat.symptoms.join(', ')}. Urgency: Level ${cat.urgencyLevel} (${triageCat}).`,
            background: `Reported distress text: "${text.slice(0, 100)}"`,
            assessment: `${cat.urgencyTitle}: ${cat.urgencySubtitle}`,
            recommendation: `Admit and evaluate at ${cat.recommendedDepartment}`,
          },
        };
        setTriageResult(fallbackResult);
        playEmergencyTone(fallbackResult.triageLevel === 1 ? 'alert' : 'success');
        const ranked = rankHospitals(hospitals, fallbackResult);
        if (ranked.length > 0) {
          setSelectedHospital(ranked[0]);
        }
      } catch (fallbackErr) {
        console.error('Fallback triage execution error:', fallbackErr);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendSbar = async () => {
    if (!triageResult || !selectedHospital) return;

    onDispatchPatient({
      triageResult,
      hospital: selectedHospital,
      ambulanceDispatched,
    });

    setSbarSent(true);
    playEmergencyTone('success');
  };

  const handle108Sos = () => {
    playEmergencyTone('alert');
    setAmbulanceDispatched(true);
    if (triageResult && selectedHospital) {
      onDispatchPatient({
        triageResult,
        hospital: selectedHospital,
        ambulanceDispatched: true,
      });
      setSbarSent(true);
    }
    // Auto-call primary emergency contact or open SOS HUD
    if (onTriggerSos) {
      onTriggerSos();
    } else {
      dialPhoneNumber(primaryContact.phone);
    }
  };

  const currentLangObj = LANGUAGE_OPTIONS.find((l) => l.code === selectedLang) || LANGUAGE_OPTIONS[0];
  const rankedHospitals = rankHospitals(hospitals, triageResult);
  const triageBadge = triageResult ? formatTriageBadge(triageResult.triageLevel) : null;

  return (
    <div className="w-full max-w-xl mx-auto space-y-5 pb-16 px-3 sm:px-4">
      {/* Non-Diagnostic Safety Warning Banner */}
      <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 flex items-start gap-2.5 shadow-sm">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-300 uppercase tracking-wide">Emergency Protocol: </span>
          <span>
            CareBridge categorizes urgency and hospital capabilities for rapid routing. It does NOT provide a medical diagnosis. In critical emergencies, call 108 or your configured emergency numbers immediately.
          </span>
        </div>
      </div>

      {/* Patient / Citizen Authentication Pill */}
      {currentUser && currentUser.role === 'patient' ? (
        <div className="bg-slate-900 border border-tactical-cyan/40 rounded-xl p-3 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-tactical-cyan/60 flex items-center justify-center font-bold text-xs text-white">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">{currentUser.name}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  VERIFIED {currentUser.provider === 'google' ? 'GMAIL' : 'PHONE'}
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                {currentUser.phone || currentUser.email} • Blood: <span className="text-rose-400 font-bold">{currentUser.bloodGroup || 'B+'}</span> • Contact: {currentUser.emergencyContactName || primaryContact.name}
              </p>
            </div>
          </div>
          {onOpenLogin && (
            <button
              onClick={onOpenLogin}
              className="text-[11px] font-mono text-tactical-cyan hover:underline shrink-0 ml-2"
            >
              Switch
            </button>
          )}
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-tactical-border rounded-xl p-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="text-[11px]">
              🔒 Sign in with <strong className="text-white">Gmail</strong> or <strong className="text-white">Phone OTP</strong> to attach verified emergency contact &amp; blood group.
            </span>
          </div>
          {onOpenLogin && (
            <button
              onClick={onOpenLogin}
              className="px-2.5 py-1 rounded-lg bg-tactical-red hover:bg-red-600 text-white font-hud font-bold text-[11px] shrink-0 ml-2"
            >
              Login
            </button>
          )}
        </div>
      )}

      {/* Emergency Action Bar */}
      <div className="space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            id="btn-call-108"
            onClick={handle108Sos}
            className="flex items-center justify-center gap-2.5 p-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-sm shadow-lg shadow-red-950/60 transition-transform active:scale-95 ring-2 ring-red-500/30 group"
            title={`Emergency: Auto-call ${primaryContact.name} (${primaryContact.phone})`}
          >
            <PhoneCall className="w-5 h-5 animate-bounce text-white" />
            <div className="text-left leading-tight truncate">
              <div className="font-hud tracking-wide flex items-center gap-1.5">
                <span>1-TAP SOS AUTO-CALL</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/20 text-white font-mono">
                  {primaryContact.relation}
                </span>
              </div>
              <div className="text-[11px] font-medium text-red-100 truncate">
                {primaryContact.name} ({primaryContact.phone})
              </div>
            </div>
          </button>

          <div className="grid grid-cols-2 gap-2">
            {onOpenEmergencyContacts && (
              <button
                id="btn-manage-emergency-numbers"
                onClick={onOpenEmergencyContacts}
                className="flex items-center justify-center gap-1.5 p-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-100 font-bold text-xs border border-slate-700 shadow-md transition-transform active:scale-95"
              >
                <Settings className="w-4 h-4 text-red-400" />
                <div className="text-left leading-tight">
                  <div className="text-slate-200">Emergency #s</div>
                  <div className="text-[10px] text-slate-400 font-normal">{emergencyContacts.length} Numbers</div>
                </div>
              </button>
            )}

            <button
              id="btn-zero-data-panic"
              onClick={() => setShowSmsPanicModal(true)}
              className={`flex items-center justify-center gap-1.5 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs border border-slate-700 shadow-md transition-transform active:scale-95 ${!onOpenEmergencyContacts ? 'col-span-2' : ''}`}
            >
              <WifiOff className="w-4 h-4 text-amber-400" />
              <div className="text-left leading-tight">
                <div className="text-amber-300">Zero-Data</div>
                <div className="text-[10px] text-slate-400">Offline SMS</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated Emergency Sections: Road Accident & Pregnancy Case */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
              <Siren className="w-4 h-4 text-rose-500 animate-pulse" />
              Specialized Emergency Options
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowSpecializedHub(!showSpecializedHub)}
            className="text-xs text-rose-400 hover:text-rose-300 font-bold underline cursor-pointer"
          >
            {showSpecializedHub ? 'Hide Section' : 'Show Emergency Options'}
          </button>
        </div>

        {showSpecializedHub && (
          <div className="py-2 flex justify-center">
            <SpecializedEmergencyHub
              hospitals={hospitals}
              defaultSection={activeEmergencySection}
              onClose={() => setShowSpecializedHub(false)}
              onDispatchPatient={({ triageResult: tr, hospital: hosp, ambulanceDispatched: amb, specializedDispatch: spec }) => {
                onDispatchPatient({
                  triageResult: tr,
                  hospital: hosp,
                  ambulanceDispatched: amb,
                  specializedDispatch: spec
                });
                setAmbulanceDispatched(true);
                setSbarSent(true);
                setSelectedHospital(hosp);
              }}
            />
          </div>
        )}
      </div>

      {/* AI Problem Auto-Analyzer & Hospital Suggester Hero Card */}
      <div className="bg-gradient-to-r from-cyan-950/90 via-slate-900 to-blue-950/90 border border-cyan-500/50 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3 relative overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-hud font-bold text-white tracking-wide">
                  AI Problem Auto-Analyzer
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase font-bold">
                  Gemini 3.8
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Automatically evaluates clinical urgency and suggests the best hospitals matching your specific medical need.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            id="btn-open-ai-auto-analyzer"
            onClick={() => (onOpenAIAnalyzer ? onOpenAIAnalyzer(inputText) : handleAnalyzeDistress())}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-hud font-bold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 transition-all active:scale-[0.99] ring-1 ring-cyan-400"
          >
            <Sparkles className="w-4 h-4 text-cyan-200" />
            <span>Auto-Analyze Problem &amp; Suggest Best Hospitals</span>
          </button>
        </div>
      </div>

      {/* Distress Input Screen (Pulsing Mic & Multilingual) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        {/* Language Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              1. Choose Language (भाषा / மொழி / భాష / भाषा)
            </span>
            <span className="text-[11px] text-rose-400 font-medium">Hinglish Code-Mixing Supported</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {LANGUAGE_OPTIONS.map((lang) => (
              <button
                key={lang.code}
                id={`lang-btn-${lang.code}`}
                onClick={() => setSelectedLang(lang.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedLang === lang.code
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {lang.nativeLabel}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Scenario Chips for Live Hackathon Execution */}
        <div>
          <span className="text-[11px] text-slate-400 font-semibold block mb-1.5">
            Quick Test Prompts (1-Click Verification Loop):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_SCENARIOS.map((sc, idx) => (
              <button
                key={idx}
                id={`quick-scenario-${idx}`}
                onClick={() => {
                  setSelectedLang(sc.lang);
                  setInputText(sc.text);
                  handleAnalyzeDistress(sc.text);
                }}
                className="text-[11px] px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 hover:border-rose-500/50 text-slate-300 hover:text-white transition-all text-left"
              >
                {sc.title}
              </button>
            ))}
          </div>
        </div>

        {/* Pulsing Mic & Voice Input Area */}
        <div className="flex flex-col items-center justify-center pt-2 pb-1 space-y-3">
          <div className="relative flex items-center justify-center">
            {/* Animated Pulsing Rings */}
            {isListening && (
              <>
                <div className="absolute w-28 h-28 rounded-full bg-rose-500/20 animate-ping" />
                <div className="absolute w-36 h-36 rounded-full bg-rose-500/10 animate-pulse" />
              </>
            )}

            <button
              id="voice-speak-ask-btn"
              onClick={toggleListening}
              className={`relative z-10 w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all active:scale-95 ${
                isListening
                  ? 'bg-red-600 text-white ring-4 ring-red-400/50 animate-bounce'
                  : 'bg-gradient-to-tr from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white ring-4 ring-rose-500/20'
              }`}
            >
              {isListening ? (
                <MicOff className="w-8 h-8 animate-spin" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>
          </div>

          <div className="text-center">
            <span className="text-xs font-extrabold tracking-wide uppercase text-white">
              {isListening ? 'Listening in ' + currentLangObj.label + '...' : 'Tap & Speak Distress'}
            </span>
            <p className="text-[11px] text-slate-400">
              Speak symptoms freely in Hindi, Hinglish, Tamil, Telugu, Marathi, or English.
            </p>
          </div>

          {micError && (
            <div className="w-full bg-rose-950/70 border border-rose-500/50 rounded-xl p-2.5 text-xs text-rose-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="text-[11px]">{micError}</span>
              </div>
              <button
                onClick={() => setMicError(null)}
                className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Text Input / Transcription Box */}
        <div className="relative">
          <textarea
            id="symptom-input-textarea"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={currentLangObj.placeholderText}
            rows={3}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 resize-none font-sans"
          />

          <div className="flex items-center justify-between text-[11px] mt-1.5 px-1 font-mono">
            <span className="flex items-center gap-1.5 text-slate-400">
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-3 h-3 text-rose-400 animate-spin" />
                  <span className="text-rose-300 animate-pulse font-bold">Auto-Analyzing with Gemini...</span>
                </>
              ) : triageResult ? (
                <span className="text-emerald-400 font-semibold">✓ Triage Auto-Evaluated</span>
              ) : (
                <span className="text-slate-400">⚡ Real-time Gemini Auto-Triage</span>
              )}
            </span>
            <button
              type="button"
              onClick={() => setAutoAnalyzeEnabled(!autoAnalyzeEnabled)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                autoAnalyzeEnabled
                  ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              Auto-Analyze: {autoAnalyzeEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <button
            id="analyze-triage-btn"
            onClick={() => handleAnalyzeDistress()}
            disabled={isAnalyzing || !inputText.trim()}
            className={`mt-2 w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
              isAnalyzing || !inputText.trim()
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-rose-600 hover:bg-rose-500 text-white active:scale-98'
            }`}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Evaluating Urgency & Matching Hospitals...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{triageResult ? 'Re-Evaluate Distress' : 'Analyze Distress & Find Emergency Hospital'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Urgency Guidance & Triage Assessment Output */}
      {triageResult && triageBadge && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Triage Urgency Header */}
          <div className={`p-4 border-b ${triageBadge.banner}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${triageBadge.dot} animate-ping`} />
                <span className="font-extrabold text-base sm:text-lg tracking-tight">
                  {triageBadge.label}
                </span>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-mono bg-black/40 border border-white/10 uppercase">
                Triage Score: L{triageResult.triageLevel}
              </span>
            </div>
            <p className="text-xs opacity-90 mt-1">{triageBadge.subLabel}</p>
          </div>

          <div className="p-4 space-y-3.5 text-slate-200">
            {/* Extracted Distress Signals */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Extracted Distress Signals:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {triageResult.keySignals.map((sig, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded-md bg-slate-950 border border-slate-700 text-rose-300 font-medium"
                  >
                    • {sig}
                  </span>
                ))}
              </div>
            </div>

            {/* Urgency Reasoning */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs leading-relaxed text-slate-300">
              <span className="font-bold text-white block mb-0.5">Clinical Urgency Assessment:</span>
              <p>{triageResult.urgencyReasoning}</p>
            </div>

            {/* Required Hospital Capabilities */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Mandatory Facility Readiness:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {triageResult.requiredSpecialties.map((spec, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 font-semibold"
                  >
                    ✓ {spec}
                  </span>
                ))}
              </div>
            </div>

            {/* Recommended Clinical Solution & Temporary Transit Solution (Right below the problem) */}
            {(() => {
              const transitSol = triageResult.interimTransitSolution || categorizeProblem(inputText, selectedLang).interimTransitSolution;
              return (
                <div id="patient-view-solution-section" className="space-y-3">
                  {/* Primary Clinical Urgency Banner */}
                  <div className="p-3.5 bg-gradient-to-b from-amber-950/40 to-slate-950 rounded-xl border border-amber-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="text-sm">💡</span>
                        Recommended Clinical Solution (तत्काल समाधान):
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const text = `Urgency Level ${triageResult.triageLevel}. ${triageResult.urgencyReasoning}. First aid: ${triageResult.immediateFirstAidGuidance.join('. ')}`;
                          speakFirstAidInstruction(text, selectedLang);
                        }}
                        className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[10px] font-mono flex items-center gap-1 transition-all"
                        title="Listen to clinical solution instructions"
                      >
                        <Volume2 className="w-3 h-3 text-amber-300" />
                        <span>Audio</span>
                      </button>
                    </div>

                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-100 font-medium">
                      {triageResult.urgencyReasoning}
                    </div>

                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide block pt-1">
                      Immediate First-Aid Steps (तुरंत क्या करें):
                    </span>
                    <ul className="text-xs text-slate-200 space-y-1.5 list-none">
                      {triageResult.immediateFirstAidGuidance.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2 bg-slate-900/80 p-2 rounded border border-slate-800">
                          <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-snug">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Temporary Transit Care Till Hospital Arrival */}
                  {transitSol && (
                    <div className="p-3.5 bg-gradient-to-br from-slate-900 via-slate-900/95 to-blue-950/40 rounded-xl border border-blue-500/40 space-y-2.5 shadow-lg">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                            <Car className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-xs font-black text-blue-300 uppercase tracking-wider block">
                              Temporary Solution Till Hospital Reach
                            </span>
                            <span className="text-[11px] text-blue-200 font-medium leading-none">
                              {transitSol.headline}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const readText = `Transit protocol: ${transitSol.headline}. Immediate: ${transitSol.immediateActions.join('. ')}. During travel: ${transitSol.enRouteCare.join('. ')}. Strictly avoid: ${transitSol.criticalAvoid.join('. ')}. Vital checks: ${transitSol.vitalMonitoring.join('. ')}. At hospital gate: ${transitSol.arrivalPrep.join('. ')}`;
                              speakFirstAidInstruction(readText, selectedLang);
                            }}
                            className="px-2 py-0.5 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-[10px] font-mono flex items-center gap-1 transition-all"
                            title="Listen to full transit solution"
                          >
                            <Volume2 className="w-3 h-3 text-blue-400" />
                            <span>Read Aloud</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPatientTransitExpanded(!patientTransitExpanded)}
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                          >
                            {patientTransitExpanded ? 'Tabs' : 'Expand'}
                          </button>
                        </div>
                      </div>

                      {!patientTransitExpanded ? (
                        <div className="space-y-2">
                          {/* Transit Category Buttons */}
                          <div className="grid grid-cols-5 gap-1 p-0.5 bg-slate-950/80 border border-slate-800 rounded-lg">
                            <button
                              type="button"
                              onClick={() => setPatientTransitTab('immediate')}
                              className={`py-1 px-0.5 rounded text-[9px] font-bold text-center transition-all ${
                                patientTransitTab === 'immediate'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              ⚡ 1st 5 Min
                            </button>
                            <button
                              type="button"
                              onClick={() => setPatientTransitTab('enroute')}
                              className={`py-1 px-0.5 rounded text-[9px] font-bold text-center transition-all ${
                                patientTransitTab === 'enroute'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              🚗 Travel
                            </button>
                            <button
                              type="button"
                              onClick={() => setPatientTransitTab('avoid')}
                              className={`py-1 px-0.5 rounded text-[9px] font-bold text-center transition-all ${
                                patientTransitTab === 'avoid'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              🚫 Avoid
                            </button>
                            <button
                              type="button"
                              onClick={() => setPatientTransitTab('vitals')}
                              className={`py-1 px-0.5 rounded text-[9px] font-bold text-center transition-all ${
                                patientTransitTab === 'vitals'
                                  ? 'bg-purple-600 text-white shadow-xs'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              🩺 Vitals
                            </button>
                            <button
                              type="button"
                              onClick={() => setPatientTransitTab('arrival')}
                              className={`py-1 px-0.5 rounded text-[9px] font-bold text-center transition-all ${
                                patientTransitTab === 'arrival'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              🏥 At Gate
                            </button>
                          </div>

                          {/* Tab Content Display */}
                          <div className="space-y-1.5 min-h-[80px]">
                            {patientTransitTab === 'immediate' && (
                              <div className="space-y-1.5 animate-in fade-in duration-200">
                                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide block">
                                  ⚡ Immediate Stabilization Actions:
                                </span>
                                {transitSol.immediateActions.map((item, idx) => (
                                  <div key={idx} className="bg-slate-950/80 border border-amber-900/50 rounded-lg p-2 text-xs flex items-start gap-2">
                                    <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                      {idx + 1}
                                    </span>
                                    <span className="text-[11px] text-slate-200 leading-snug">{item}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {patientTransitTab === 'enroute' && (
                              <div className="space-y-1.5 animate-in fade-in duration-200">
                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wide block">
                                  🚗 Vehicle Transit Care (सफ़र के दौरान):
                                </span>
                                {transitSol.enRouteCare.map((item, idx) => (
                                  <div key={idx} className="bg-slate-950/80 border border-blue-900/50 rounded-lg p-2 text-xs flex items-start gap-2">
                                    <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                      ✓
                                    </span>
                                    <span className="text-[11px] text-slate-200 leading-snug">{item}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {patientTransitTab === 'avoid' && (
                              <div className="space-y-1.5 animate-in fade-in duration-200">
                                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wide block">
                                  🚫 Strictly Avoid / Contraindications (भूलकर भी न करें):
                                </span>
                                {transitSol.criticalAvoid.map((item, idx) => (
                                  <div key={idx} className="bg-slate-950/80 border border-rose-900/50 rounded-lg p-2 text-xs flex items-start gap-2">
                                    <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                      ✕
                                    </span>
                                    <span className="text-[11px] font-medium text-rose-200 leading-snug">{item}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {patientTransitTab === 'vitals' && (
                              <div className="space-y-1.5 animate-in fade-in duration-200">
                                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wide block">
                                  🩺 Monitor Vitals On The Way:
                                </span>
                                {transitSol.vitalMonitoring.map((item, idx) => (
                                  <div key={idx} className="bg-slate-950/80 border border-purple-900/50 rounded-lg p-2 text-xs flex items-start gap-2">
                                    <span className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                      •
                                    </span>
                                    <span className="text-[11px] text-slate-200 leading-snug">{item}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {patientTransitTab === 'arrival' && (
                              <div className="space-y-1.5 animate-in fade-in duration-200">
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide block">
                                  🏥 Hospital Gate Arrival Readiness:
                                </span>
                                {transitSol.arrivalPrep.map((item, idx) => (
                                  <div key={idx} className="bg-slate-950/80 border border-emerald-900/50 rounded-lg p-2 text-xs flex items-start gap-2">
                                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                      →
                                    </span>
                                    <span className="text-[11px] text-slate-200 leading-snug">{item}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Expanded View */
                        <div className="space-y-2 text-xs">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide block">
                              ⚡ Immediate Actions:
                            </span>
                            {transitSol.immediateActions.map((item, idx) => (
                              <div key={idx} className="bg-slate-950/70 p-1.5 rounded border border-slate-800 text-[11px] text-slate-200">
                                • {item}
                              </div>
                            ))}
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wide block">
                              🚗 During Transit:
                            </span>
                            {transitSol.enRouteCare.map((item, idx) => (
                              <div key={idx} className="bg-slate-950/70 p-1.5 rounded border border-slate-800 text-[11px] text-slate-200">
                                • {item}
                              </div>
                            ))}
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wide block">
                              🚫 Strictly Avoid:
                            </span>
                            {transitSol.criticalAvoid.map((item, idx) => (
                              <div key={idx} className="bg-slate-950/70 p-1.5 rounded border border-rose-900/40 text-[11px] text-rose-300">
                                ✕ {item}
                              </div>
                            ))}
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wide block">
                              🩺 Monitor Vitals:
                            </span>
                            {transitSol.vitalMonitoring.map((item, idx) => (
                              <div key={idx} className="bg-slate-950/70 p-1.5 rounded border border-slate-800 text-[11px] text-slate-200">
                                • {item}
                              </div>
                            ))}
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide block">
                              🏥 Hospital Arrival Prep:
                            </span>
                            {transitSol.arrivalPrep.map((item, idx) => (
                              <div key={idx} className="bg-slate-950/70 p-1.5 rounded border border-slate-800 text-[11px] text-slate-200">
                                → {item}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Standardized SBAR Card Preview */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Standardized SBAR Card (Ready for ER Intake)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  ISO-13485 Format
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
                  <span className="font-bold text-slate-400 uppercase block text-[10px]">Situation:</span>
                  <p className="text-slate-200">{triageResult.sbar.situation}</p>
                </div>
                <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
                  <span className="font-bold text-slate-400 uppercase block text-[10px]">Background:</span>
                  <p className="text-slate-200">{triageResult.sbar.background}</p>
                </div>
                <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
                  <span className="font-bold text-slate-400 uppercase block text-[10px]">Assessment:</span>
                  <p className="text-slate-200">{triageResult.sbar.assessment}</p>
                </div>
                <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
                  <span className="font-bold text-slate-400 uppercase block text-[10px]">Recommendation:</span>
                  <p className="text-slate-200">{triageResult.sbar.recommendation}</p>
                </div>
              </div>

              {/* Handshake Buttons */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  id="open-handshake-qr-btn"
                  onClick={() => setShowHandshakeModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>Show ER Handshake QR</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discovery Sub-Tabs (Hospitals, ICU Beds, Blood Banks, Pharmacies) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 overflow-x-auto text-xs">
            <button
              id="subtab-hospitals"
              onClick={() => setActiveTab('hospitals')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'hospitals'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Ranked Hospitals</span>
            </button>

            <button
              id="subtab-icu"
              onClick={() => setActiveTab('icu_tracker')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'icu_tracker'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Bed className="w-3.5 h-3.5" />
              <span>Live ICU Beds</span>
            </button>

            <button
              id="subtab-blood"
              onClick={() => setActiveTab('blood_banks')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'blood_banks'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>Blood Banks</span>
            </button>

            <button
              id="subtab-pharmacy"
              onClick={() => setActiveTab('pharmacies')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'pharmacies'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Pill className="w-3.5 h-3.5" />
              <span>24/7 Pharmacy</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Ranked Hospitals */}
        {activeTab === 'hospitals' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                {triageResult ? 'Filtered by Triage & Resource Match:' : 'Nearest Verified Emergency Facilities:'}
              </span>
              <span className="text-[11px] text-slate-500">Live GPS Corridor: Mumbai</span>
            </div>

            <div className="space-y-3">
              {rankedHospitals.map((hosp, idx) => {
                const isSelected = selectedHospital?.id === hosp.id;
                const isTopMatch = idx === 0 && triageResult;

                return (
                  <div
                    key={hosp.id}
                    id={`hospital-card-${hosp.id}`}
                    onClick={() => setSelectedHospital(hosp)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-rose-500 ring-2 ring-rose-500/30 shadow-xl'
                        : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm sm:text-base">{hosp.name}</h4>
                          {isTopMatch && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              #1 BEST MATCH
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{hosp.address}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-base font-extrabold text-white flex items-center justify-end gap-1">
                          <Clock className="w-3.5 h-3.5 text-rose-400" />
                          <span>{hosp.etaMinutes} mins</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">{hosp.distanceKm} km away</span>
                      </div>
                    </div>

                    {/* Bed & Oxygen Resources Live Bar */}
                    <div className="grid grid-cols-3 gap-2 my-3 p-2 bg-slate-950 rounded-xl border border-slate-800/80 text-xs">
                      <div className="text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">ICU Beds</span>
                        <div className={`font-mono font-bold ${
                          hosp.icuBedsAvailable > 0 ? 'text-emerald-400' : 'text-rose-500'
                        }`}>
                          {hosp.icuBedsAvailable > 0 ? `${hosp.icuBedsAvailable} Available` : '⚠️ 0 (FULL)'}
                        </div>
                      </div>

                      <div className="text-center border-x border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Oxygen Beds</span>
                        <div className="font-mono font-bold text-cyan-400">
                          {hosp.oxygenBedsAvailable} Available
                        </div>
                      </div>

                      <div className="text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Ventilators</span>
                        <div className="font-mono font-bold text-amber-400">
                          {hosp.ventilatorsAvailable} Ready
                        </div>
                      </div>
                    </div>

                    {/* Capabilities Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {hosp.capabilities.slice(0, 4).map((cap, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>

                    {/* Actions on card */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <a
                        href={`tel:${hosp.emergencyDeskDirect}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>ER Desk: {hosp.emergencyDeskDirect}</span>
                      </a>

                      <div className="flex items-center gap-2">
                        <button
                          id={`nav-btn-${hosp.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedHospital(hosp);
                            setShowRoutingModal(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Map Route</span>
                        </button>

                        <button
                          id={`dispatch-sbar-btn-${hosp.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedHospital(hosp);
                            handleSendSbar();
                            setShowRoutingModal(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Pre-Alert ER</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Live ICU Bed Tracker */}
        {activeTab === 'icu_tracker' && (
          <div className="space-y-3">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center justify-between">
              <span>Real-Time Hospital Critical Bed Registry</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                Auto-Synced
              </span>
            </div>

            <div className="space-y-2.5">
              {hospitals.map((hosp) => (
                <div
                  key={hosp.id}
                  className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-bold text-white text-sm">{hosp.name}</h5>
                      <span className="text-xs text-slate-400">{hosp.type} • {hosp.etaMinutes} mins away</span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">Updated {hosp.lastUpdatedMinutesAgo}m ago</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                    <div className="p-2 bg-slate-950 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">ICU Availability</span>
                      <span className={`font-bold font-mono text-sm ${
                        hosp.icuBedsAvailable > 0 ? 'text-emerald-400' : 'text-rose-500'
                      }`}>
                        {hosp.icuBedsAvailable} / {hosp.icuBedsTotal}
                      </span>
                    </div>

                    <div className="p-2 bg-slate-950 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">Oxygen Beds</span>
                      <span className="font-bold font-mono text-sm text-cyan-400">
                        {hosp.oxygenBedsAvailable} / {hosp.oxygenBedsTotal}
                      </span>
                    </div>

                    <div className="p-2 bg-slate-950 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">Ventilators</span>
                      <span className="font-bold font-mono text-sm text-amber-400">
                        {hosp.ventilatorsAvailable} Ready
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Blood Bank Live Discovery & Donor Search */}
        {activeTab === 'blood_banks' && (
          <div className="space-y-3">
            {/* Blood group selector */}
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-2">
              <span className="text-xs font-bold text-slate-300 block">
                Select Required Blood Group:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map((group) => (
                  <button
                    key={group}
                    id={`blood-group-${group}`}
                    onClick={() => setSelectedBloodGroup(group)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedBloodGroup === group
                        ? 'bg-rose-600 text-white shadow'
                        : 'bg-slate-950 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {group} {group === 'O-' && '⭐ Universal'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              {INITIAL_BLOOD_BANKS.map((bb) => (
                <div
                  key={bb.id}
                  className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-bold text-white text-sm">{bb.name}</h5>
                      <span className="text-xs text-slate-400">{bb.address}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-rose-400 font-mono">{bb.etaMinutes} mins</span>
                      <span className="block text-[11px] text-slate-400">{bb.distanceKm} km</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-slate-950 rounded-lg text-xs">
                    <span className="text-slate-300">
                      Units of <strong className="text-rose-400 font-bold">{selectedBloodGroup}</strong> Available:
                    </span>
                    <span className="font-mono font-bold text-sm px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                      {bb.stock[selectedBloodGroup] || 0} Units in Stock
                    </span>
                  </div>

                  <div className="flex justify-end pt-1">
                    <a
                      href={`tel:${bb.contact}`}
                      className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call Blood Bank: {bb.contact}</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Late-Night Emergency Pharmacies */}
        {activeTab === 'pharmacies' && (
          <div className="space-y-3">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300">
              Verified 24/7 Pharmacies Stocking Critical Emergency Medicines
            </div>

            <div className="space-y-2.5">
              {INITIAL_PHARMACIES.map((pharm) => (
                <div
                  key={pharm.id}
                  className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h5 className="font-bold text-white text-sm">{pharm.name}</h5>
                        {pharm.open24x7 && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                            24/7 Open
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">{pharm.address}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-200">{pharm.etaMinutes} mins</span>
                      <span className="block text-[11px] text-slate-400">{pharm.distanceKm} km</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Emergency Drugs Ready in Stock:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {pharm.essentialMedicines.map((med, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800"
                        >
                          {med}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1 text-xs">
                    <span className="text-slate-400">
                      {pharm.deliveryAvailable ? '✓ Rapid ER Delivery' : '• Store Pickup Only'}
                    </span>
                    <a
                      href={`tel:${pharm.contact}`}
                      className="font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{pharm.contact}</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showRoutingModal && selectedHospital && (
        <MapRoutingModal
          hospital={selectedHospital}
          triageLevel={triageResult?.triageLevel || 1}
          sbar={triageResult?.sbar}
          onClose={() => setShowRoutingModal(false)}
          onOpenHandshake={() => setShowHandshakeModal(true)}
          onSendSbarToHospital={handleSendSbar}
          sbarSent={sbarSent}
        />
      )}

      {showHandshakeModal && selectedHospital && (
        <DigitalHandshakeModal
          hospital={selectedHospital}
          triageLevel={triageResult?.triageLevel || 1}
          sbar={triageResult?.sbar}
          token={`CB-${Math.floor(1000 + Math.random() * 9000)}-T${triageResult?.triageLevel || 1}`}
          onClose={() => setShowHandshakeModal(false)}
        />
      )}

      {showSmsPanicModal && (
        <SmsPanicModal
          triageResult={triageResult}
          hospital={selectedHospital}
          onClose={() => setShowSmsPanicModal(false)}
        />
      )}
    </div>
  );
};
