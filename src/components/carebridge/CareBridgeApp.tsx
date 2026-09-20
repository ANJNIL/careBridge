import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Hospital, SupportedLanguage, AuthUser, UserRole, DistressTriageResult, EmergencyContact, TriageLevel } from '../../types';
import { INITIAL_HOSPITALS } from '../../data/hospitals';
import { SoundFX } from '../../utils/speech';
import { categorizeProblem, CategorizedProblem } from '../../utils/triage';
import {
  getStoredEmergencyContacts,
  getPrimaryEmergencyContact,
  dialPhoneNumber,
} from '../../utils/emergencyContacts';
import { 
  User, 
  Building2, 
  Zap, 
  ExternalLink,
  Volume2,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Check,
  ArrowRight,
  PhoneCall,
  Star,
  Settings
} from 'lucide-react';

interface CareBridgeAppProps {
  onOpenHospitalPortal?: () => void;
  onOpenSpec?: () => void;
  onOpenAuthModal?: (role?: UserRole) => void;
  currentUser?: AuthUser | null;
  onLoginSuccess?: (user: AuthUser) => void;
  onLogout?: () => void;
  onTriggerSos?: () => void;
  onOpenEmergencyContacts?: () => void;
}

interface FacilityItem {
  id: string;
  name: string;
  distance: string;
  tags: { label: string; isRed?: boolean }[];
  phone: string;
  address: string;
  costRange: string;
}

const FACILITIES_DATA: FacilityItem[] = [
  {
    id: 'choithram',
    name: 'Choithram Hospital & Research Centre',
    distance: '2.3 km',
    tags: [{ label: 'Emergency', isRed: true }, { label: 'ICU' }, { label: 'Oxygen' }, { label: 'Cardiology' }],
    phone: '+91 731 475 1000',
    address: 'Near M.G. Road, Indore, Madhya Pradesh',
    costRange: '₹5,000 – ₹12,000',
  },
  {
    id: 'bombay',
    name: 'Bombay Hospital',
    distance: '3.6 km',
    tags: [{ label: 'Emergency', isRed: true }, { label: 'ICU' }, { label: 'Trauma' }],
    phone: '+91 731 255 8866',
    address: 'Ring Road, IDA Scheme No 94, Indore, MP',
    costRange: '₹6,000 – ₹14,000',
  },
  {
    id: 'ruby',
    name: 'Ruby Hall Clinic',
    distance: '4.8 km',
    tags: [{ label: 'Emergency', isRed: true }, { label: 'Oxygen' }, { label: 'Neurology' }],
    phone: '+91 731 400 2000',
    address: 'AB Road, Near LIG Square, Indore, MP',
    costRange: '₹4,500 – ₹11,000',
  },
  {
    id: 'jupiter',
    name: 'Jupiter Hospital',
    distance: '6.1 km',
    tags: [{ label: 'Emergency', isRed: true }, { label: 'ICU' }, { label: 'Cardiac Care' }],
    phone: '+91 731 661 5000',
    address: 'Eastern Ring Road, Indore, MP',
    costRange: '₹7,000 – ₹16,000',
  },
];

export const CareBridgeApp: React.FC<CareBridgeAppProps> = ({
  onOpenHospitalPortal,
  onOpenSpec,
  onOpenAuthModal,
  currentUser,
  onLogout,
  onTriggerSos,
  onOpenEmergencyContacts,
}) => {
  // Screen index: 0 through 10 (11 screens exactly matching prototype)
  const [current, setCurrent] = useState<number>(0);
  const [selectedFacility, setSelectedFacility] = useState<FacilityItem>(FACILITIES_DATA[0]);
  const [selectedLang, setSelectedLang] = useState<'hi' | 'en' | 'hinglish'>('hi');
  const [showLangMenu, setShowLangMenu] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [customToast, setCustomToast] = useState<string | null>(null);

  const [problemText, setProblemText] = useState<string>('mujhe bukhaar h');
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(() => getStoredEmergencyContacts());

  useEffect(() => {
    const handleUpdate = () => {
      setEmergencyContacts(getStoredEmergencyContacts());
    };
    window.addEventListener('carebridge:emergency_contacts_updated', handleUpdate);
    return () => window.removeEventListener('carebridge:emergency_contacts_updated', handleUpdate);
  }, []);

  // Dynamically categorize symptom problem text using the clinical NLP engine
  const categorized: CategorizedProblem = useMemo(() => {
    return categorizeProblem(problemText, selectedLang);
  }, [problemText, selectedLang]);

  // AI Auto-Analyze with Gemini state (auto-analyzes in background without clicking)
  const [geminiResult, setGeminiResult] = useState<DistressTriageResult | null>(null);
  const [isGeminiAnalyzing, setIsGeminiAnalyzing] = useState<boolean>(false);
  const [autoAnalyzeEnabled, setAutoAnalyzeEnabled] = useState<boolean>(true);
  const [lastAnalyzedQuery, setLastAnalyzedQuery] = useState<string>('');

  // Unified Effective Triage Calculation (synthesizes AI result with clinical heuristic)
  const effectiveLevel: TriageLevel = geminiResult?.triageLevel ?? categorized.urgencyLevel;
  const effectiveUrgency: 'High' | 'Moderate' | 'Low' = effectiveLevel === 1 ? 'High' : (effectiveLevel === 2 ? 'Moderate' : 'Low');
  const effectiveCategory = geminiResult?.triageCategory || categorized.primaryCategory;
  const effectiveSignals = (geminiResult?.keySignals && geminiResult.keySignals.length > 0) ? geminiResult.keySignals : categorized.symptoms;
  const effectiveFacilityType = geminiResult?.suggestedFacilityType || categorized.recommendedDepartment;
  const effectiveFirstAid = (geminiResult?.immediateFirstAidGuidance && geminiResult.immediateFirstAidGuidance.length > 0) 
    ? geminiResult.immediateFirstAidGuidance 
    : categorized.firstAidSteps;
  const effectiveReasoning = geminiResult?.urgencyReasoning || categorized.urgencySubtitle;

  // Dynamically rank facilities according to acute condition & specialties
  const rankedFacilities = useMemo(() => {
    return [...FACILITIES_DATA].sort((a, b) => {
      let aScore = 0;
      let bScore = 0;
      const lowerProb = problemText.toLowerCase();
      const isCardiac = effectiveLevel === 1 || effectiveCategory.toLowerCase().includes('cardiac') || lowerProb.includes('chest') || lowerProb.includes('chhati') || lowerProb.includes('seene');
      const isFever = effectiveCategory.toLowerCase().includes('fever') || lowerProb.includes('bukhar') || lowerProb.includes('bukhaar');
      const isTrauma = effectiveCategory.toLowerCase().includes('trauma') || lowerProb.includes('accident') || lowerProb.includes('haddi');

      if (isCardiac) {
        if (a.tags.some(t => t.label === 'Cardiology' || t.label === 'Cardiac Care')) aScore += 60;
        if (b.tags.some(t => t.label === 'Cardiology' || t.label === 'Cardiac Care')) bScore += 60;
      }
      if (isFever) {
        if (a.tags.some(t => t.label === 'Oxygen' || t.label === 'Emergency')) aScore += 20;
        if (b.tags.some(t => t.label === 'Oxygen' || t.label === 'Emergency')) bScore += 20;
      }
      if (isTrauma) {
        if (a.tags.some(t => t.label === 'Trauma')) aScore += 50;
        if (b.tags.some(t => t.label === 'Trauma')) bScore += 50;
      }
      const aDist = parseFloat(a.distance) || 5;
      const bDist = parseFloat(b.distance) || 5;
      aScore -= aDist * 2;
      bScore -= bDist * 2;
      return bScore - aScore;
    });
  }, [effectiveLevel, effectiveCategory, problemText]);

  // Keep selected facility in sync with top matched facility
  useEffect(() => {
    if (rankedFacilities.length > 0) {
      setSelectedFacility(rankedFacilities[0]);
    }
  }, [rankedFacilities]);

  // Debounced real-time AI Auto-Analysis using Gemini 3.8 Flash
  useEffect(() => {
    if (!autoAnalyzeEnabled) return;
    const query = problemText.trim();
    if (query.length < 3) return;

    const timer = setTimeout(async () => {
      setIsGeminiAnalyzing(true);
      try {
        const res = await fetch('/api/triage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inputText: query,
            languageCode: selectedLang,
          }),
        });
        if (res.ok) {
          const data: DistressTriageResult = await res.json();
          setGeminiResult(data);
          setLastAnalyzedQuery(query);
        }
      } catch (err) {
        console.warn('Gemini auto-analysis fallback:', err);
      } finally {
        setIsGeminiAnalyzing(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [problemText, selectedLang, autoAnalyzeEnabled]);

  // Speech Recognition ref
  const recognitionRef = useRef<any>(null);

  const showFeedback = (msg: string) => {
    SoundFX.tapTick();
    setCustomToast(msg);
    setTimeout(() => setCustomToast(null), 2600);
  };

  const go = (n: number) => {
    SoundFX.tapTick();
    const nextIdx = Math.max(0, Math.min(10, n));
    setCurrent(nextIdx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const next = () => {
    if (current === 10) {
      go(0);
    } else {
      go(current + 1);
    }
  };

  // Mic Toggle Handler
  const toggleListening = () => {
    SoundFX.init();
    if (isListening) {
      setIsListening(false);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      showFeedback('Voice input stopped');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsListening(true);
      showFeedback('Listening for voice (Hindi/English)...');
      
      const sampleSimulatedPhrases = [
        'mujhe bukhaar h aur sar dard ho raha hai',
        'Mere papa ko saans lene mein dikkat ho rahi hai aur chest mein pain hai.',
        'Mummy ko pet mein tez dard ho raha hai aur ulti aa rahi hai',
        'Bhai ka accident hua hai haddi toot gayi aur khoon nikal raha hai'
      ];
      
      setTimeout(() => {
        setIsListening(false);
        // Toggle through realistic sample phrases
        const nextPhrase = sampleSimulatedPhrases.find(p => p !== problemText) || sampleSimulatedPhrases[0];
        setProblemText(nextPhrase);
        showFeedback(`Captured: "${nextPhrase}"`);
      }, 2000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = selectedLang === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        showFeedback('Listening for symptoms...');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setProblemText(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Screen Metadata for the Top Quick Switcher Bar
  const screenNames = [
    'Home',
    'Tell Problem',
    'Analyzing',
    'Emergency Detected',
    'Nearby Facilities',
    'Hospital Details',
    'Route Map',
    'Cost Breakdown',
    'Handoff Card',
    'Offline Mode',
    'Share with Family',
  ];

  return (
    <div className="w-full bg-[#eaf2f8] min-h-screen py-4 sm:py-6 px-2 sm:px-4 font-sans text-[#17324d] flex flex-col items-center">
      {/* Top Utility Strip: Direct Login & Screen Jumper */}
      <div className="w-full max-w-[430px] mb-3 flex flex-col gap-2">
        {/* Direct 1-Click Login Bar for Patient and Hospital */}
        <div className="bg-white border border-[#dceaf2] rounded-2xl p-2.5 shadow-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-400" />
            </div>
            <div>
              <div className="text-[11px] font-extrabold text-[#17324d] leading-tight flex items-center gap-1.5">
                <span>CareBridge Access</span>
                {currentUser && (
                  <span className={`text-[9px] font-mono px-1 py-0.2 rounded font-bold ${
                    currentUser.role === 'hospital_staff' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'
                  }`}>
                    {currentUser.role === 'hospital_staff' ? 'HOSPITAL ER' : 'PATIENT'}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#6b8193] leading-none">
                {currentUser ? currentUser.name : '1-Click Direct Login'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {currentUser ? (
              <div className="flex items-center gap-1">
                <button
                  id="btn-switch-role-bar"
                  onClick={() => onOpenAuthModal && onOpenAuthModal(currentUser.role === 'hospital_staff' ? 'patient' : 'hospital_staff')}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#17324d] text-[10px] font-bold transition-all"
                >
                  Switch
                </button>
                {onLogout && (
                  <button
                    id="btn-logout-bar"
                    onClick={onLogout}
                    className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold transition-all"
                  >
                    Logout
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  id="btn-direct-user-login-bar"
                  onClick={() => onOpenAuthModal && onOpenAuthModal('patient')}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95"
                >
                  <User className="w-3 h-3 text-blue-600" />
                  <span>User</span>
                </button>
                <button
                  id="btn-direct-hospital-login-bar"
                  onClick={() => onOpenAuthModal && onOpenAuthModal('hospital_staff')}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95"
                >
                  <Building2 className="w-3 h-3 text-rose-600" />
                  <span>Hospital</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Screen Quick Jumper Strip */}
        <div className="bg-white border border-[#dceaf2] rounded-2xl px-2.5 py-1.5 shadow-xs overflow-x-auto no-scrollbar flex items-center gap-1">
          <span className="text-[9px] font-bold text-[#6b8193] uppercase tracking-wider shrink-0 mr-1">
            Screens:
          </span>
          {screenNames.map((name, idx) => {
            const isActive = current === idx;
            return (
              <button
                key={idx}
                id={`btn-screen-jump-${idx}`}
                onClick={() => go(idx)}
                className={`px-2 py-0.5 rounded-full text-[10px] whitespace-nowrap shrink-0 font-bold transition-all ${
                  isActive
                    ? 'bg-[#0873d1] text-white shadow-2xs'
                    : 'bg-[#f5fbff] text-[#244a69] hover:bg-[#e6f5ff]'
                }`}
              >
                {idx}. {name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Action Feedback Toast */}
      {customToast && (
        <div className="fixed top-5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-[#17324d] text-white px-4 py-2 rounded-2xl shadow-xl border border-slate-700 text-xs font-bold flex items-center gap-2">
            <span>✨</span>
            <span>{customToast}</span>
          </div>
        </div>
      )}

      {/* Main Container matching .app */}
      <div className="cb-app">
        {/* =================================================================== */}
        {/* SCREEN 0: HOME                                                      */}
        {/* =================================================================== */}
        {current === 0 && (
          <section className="cb-screen" data-title="Home">
            {/* Top Brand & Language */}
            <div className="cb-logo">
              <div className="cb-logo-mark">❤️‍🩹</div>
              <div>
                <div className="cb-brand">CareBridge</div>
                <div className="cb-sub">Emergency Healthcare Navigator</div>
              </div>
              <div className="relative ml-auto">
                <button
                  id="btn-home-lang-toggle"
                  className="cb-lang"
                  onClick={() => setShowLangMenu(!showLangMenu)}
                >
                  🌐 {selectedLang === 'hi' ? 'हिंदी⌄' : selectedLang === 'en' ? 'English⌄' : 'Hinglish⌄'}
                </button>
                {showLangMenu && (
                  <div className="absolute right-0 top-10 bg-white border border-[#c9dce9] rounded-xl shadow-lg p-1.5 z-30 min-w-[110px] text-xs font-bold">
                    <button
                      onClick={() => { setSelectedLang('hi'); setShowLangMenu(false); showFeedback('Language: हिन्दी (Hindi)'); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#eaf2f8] rounded-lg"
                    >
                      हिन्दी (Hindi)
                    </button>
                    <button
                      onClick={() => { setSelectedLang('hinglish'); setShowLangMenu(false); showFeedback('Language: Hinglish'); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#eaf2f8] rounded-lg"
                    >
                      Hinglish
                    </button>
                    <button
                      onClick={() => { setSelectedLang('en'); setShowLangMenu(false); showFeedback('Language: English'); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#eaf2f8] rounded-lg"
                    >
                      English
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Hero Card: "Your Health is Our Priority" */}
            <div className="cb-hero">
              <div className="cb-heart">💗</div>
              <h1>Your Health is<br />Our Priority</h1>
              <p>Fast guidance when every second matters.</p>
            </div>

            {/* Tell Your Problem Card */}
            <div 
              id="card-home-tell-problem"
              className="cb-card cb-input-card" 
              onClick={() => go(1)}
            >
              <div className="cb-icon">🎙️</div>
              <div>
                <b>Tell your problem...</b>
                <div className="cb-small">Type or speak in Hindi / English</div>
              </div>
              <b className="ml-auto text-xl text-[#6b8193]">›</b>
            </div>

            {/* Red Emergency Button (Auto-Calls Primary Emergency Contact!) */}
            <div 
              id="btn-home-emergency"
              className="cb-emergency cb-red group cursor-pointer" 
              onClick={() => {
                SoundFX.codeBlueAlarm();
                if (onTriggerSos) {
                  onTriggerSos();
                } else {
                  const primary = getPrimaryEmergencyContact();
                  dialPhoneNumber(primary.phone);
                  go(3);
                }
              }}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2.5 text-left">
                  <span className="text-2xl animate-bounce">🚨</span>
                  <span>
                    EMERGENCY AUTO-CALL<br />
                    <small className="cb-small">
                      Auto-calls {emergencyContacts.find(c => c.isPrimary)?.name || 'Primary Contact (108)'}
                    </small>
                  </span>
                </div>
                <b className="text-2xl text-white">›</b>
              </div>
            </div>

            {/* 2x2 Quick Action Tiles */}
            <div className="cb-grid">
              <div 
                id="tile-hospitals"
                className="cb-tile" 
                onClick={() => go(4)}
              >
                🏥<br />Find Hospitals<br />&amp; Emergency
              </div>
              <div 
                id="tile-blood-bank"
                className="cb-tile" 
                onClick={() => {
                  showFeedback('Blood Bank Directory: 6 Units B+ Available in Indore');
                  go(4);
                }}
              >
                🩸<br />Blood Bank<br />Donors
              </div>
              <div 
                id="tile-pharmacy"
                className="cb-tile" 
                onClick={() => {
                  showFeedback('24×7 Pharmacies: Apollo Pharmacy & Choithram Meds Open');
                  go(4);
                }}
              >
                💊<br />Pharmacies<br />(24×7)
              </div>
              <div 
                id="tile-share-family"
                className="cb-tile" 
                onClick={() => {
                  if (onOpenEmergencyContacts) {
                    onOpenEmergencyContacts();
                  } else {
                    go(10);
                  }
                }}
              >
                📞<br />Emergency Numbers<br />({emergencyContacts.length} Contacts)
              </div>
            </div>
          </section>
        )}

        {/* =================================================================== */}
        {/* SCREEN 1: TELL YOUR PROBLEM                                         */}
        {/* =================================================================== */}
        {current === 1 && (
          <section className="cb-screen" data-title="Tell Problem">
            <div className="cb-top">
              <button className="cb-back" onClick={() => go(0)}>←</button>
              <div className="cb-title">Tell Your Problem</div>
            </div>

            <div className="cb-mic-wrap">
              <button 
                id="btn-mic-record"
                className="cb-mic" 
                onClick={toggleListening}
                style={{
                  boxShadow: isListening 
                    ? '0 0 0 24px rgba(237, 28, 47, 0.25), 0 0 0 48px rgba(237, 28, 47, 0.12)' 
                    : '0 0 0 20px #dceeff, 0 0 0 40px #edf7ff',
                  backgroundColor: isListening ? '#ed1c2f' : '#0c73d1',
                }}
              >
                🎙️
              </button>
              <div className="cb-listen">
                {isListening ? 'Listening to voice...' : 'Listening...'}
              </div>
              <div className="cb-small">Speak clearly in Hindi or English</div>
              <div className="cb-wave">
                <i style={{ animationPlayState: isListening ? 'running' : 'paused' }}></i>
                <i style={{ animationPlayState: isListening ? 'running' : 'paused' }}></i>
                <i style={{ animationPlayState: isListening ? 'running' : 'paused' }}></i>
                <i style={{ animationPlayState: isListening ? 'running' : 'paused' }}></i>
                <i style={{ animationPlayState: isListening ? 'running' : 'paused' }}></i>
                <i style={{ animationPlayState: isListening ? 'running' : 'paused' }}></i>
                <i style={{ animationPlayState: isListening ? 'running' : 'paused' }}></i>
                <i style={{ animationPlayState: isListening ? 'running' : 'paused' }}></i>
                <i style={{ animationPlayState: isListening ? 'running' : 'paused' }}></i>
              </div>
            </div>

            {/* Editable Problem Field */}
            <div className="cb-card">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-[#17324d]">Input Symptoms / Complaint:</span>
                <span className="text-[10px] text-[#6b8193]">Type or speak</span>
              </div>
              <textarea
                id="input-problem-text"
                value={problemText}
                onChange={(e) => setProblemText(e.target.value)}
                rows={2}
                className="w-full bg-[#f7fbfe] border border-[#dceaf2] rounded-xl p-2.5 text-xs text-[#17324d] font-semibold focus:outline-none focus:border-[#0873d1]"
                placeholder="Type your symptoms in Hindi or English (e.g., mujhe bukhaar h)..."
              />
            </div>

            {/* AI Auto-Analyzer with Gemini (No click required) */}
            <div className="cb-card border-[#cce5f7] bg-gradient-to-b from-[#f5faff] to-[#edf6fc] shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-[#d8eaf6]">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <span className="text-xs font-bold text-[#17324d]">Gemini AI Auto-Analyzer</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isGeminiAnalyzing ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full animate-pulse border border-blue-200">
                      <RotateCw className="w-2.5 h-2.5 animate-spin text-blue-600" />
                      Auto-Analyzing...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                      Live AI Triage Active
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setAutoAnalyzeEnabled(!autoAnalyzeEnabled);
                      showFeedback(`AI Auto-Analyze ${!autoAnalyzeEnabled ? 'Enabled' : 'Disabled'}`);
                    }}
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded border transition-colors ${
                      autoAnalyzeEnabled 
                        ? 'bg-[#0873d1] text-white border-[#0873d1]' 
                        : 'bg-slate-200 text-slate-700 border-slate-300'
                    }`}
                    title="Toggle automatic AI problem analysis without clicking"
                  >
                    Auto: {autoAnalyzeEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* Live AI Analysis Results Panel (Updates automatically on input without clicking) */}
              <div className="mt-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#6b8193] font-medium">Clinical Category:</span>
                  <span className="text-xs font-extrabold text-[#0873d1] bg-white px-2 py-0.5 rounded-md border border-[#d8eaf6] shadow-2xs">
                    {geminiResult?.triageCategory || categorized.primaryCategory}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#6b8193] font-medium">Urgency Triage:</span>
                  <span 
                    className="text-xs font-extrabold px-2 py-0.5 rounded-md text-white shadow-2xs"
                    style={{
                      backgroundColor: (geminiResult?.triageLevel === 1 || categorized.urgency === 'High') 
                        ? '#bd1020' 
                        : (geminiResult?.triageLevel === 2 || categorized.urgency === 'Moderate') 
                          ? '#d97706' 
                          : '#059669'
                    }}
                  >
                    Level {geminiResult?.triageLevel || (categorized.urgency === 'High' ? 1 : 2)} · {geminiResult?.triageCategory || categorized.urgency}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2 pt-1 border-t border-[#e2eff7]">
                  <span className="text-[11px] text-[#6b8193] font-medium shrink-0">Key Signals:</span>
                  <span className="text-xs font-bold text-[#17324d] text-right">
                    {(geminiResult?.keySignals && geminiResult.keySignals.length > 0) 
                      ? geminiResult.keySignals.slice(0, 2).join(', ') 
                      : categorized.symptoms.join(', ')}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] text-[#6b8193] font-medium shrink-0">Recommended Care:</span>
                  <span className="text-xs font-semibold text-[#0c6b45] text-right">
                    {geminiResult?.suggestedFacilityType || categorized.recommendedDepartment}
                  </span>
                </div>

                {geminiResult?.urgencyReasoning && (
                  <p className="text-[11px] text-[#335370] bg-white/80 p-2 rounded-lg border border-[#dceaf2] leading-tight italic">
                    “{geminiResult.urgencyReasoning}”
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-[#d8eaf6]">
                <button
                  id="btn-direct-hospital-nav"
                  className="cb-btn text-xs py-2 px-2"
                  style={{ margin: 0 }}
                  onClick={() => {
                    showFeedback(`Navigating to ${selectedFacility.name} (Matched by Gemini)`);
                    go(4);
                  }}
                >
                  Direct Hospital →
                </button>
                <button
                  id="btn-review-triage"
                  className="cb-btn cb-secondary text-xs py-2 px-2"
                  style={{ margin: 0 }}
                  onClick={() => go(2)}
                >
                  Full Triage Flow →
                </button>
              </div>
            </div>

            <div className="space-y-2 mt-2">
              <span className="text-[11px] font-bold text-[#6b8193] uppercase tracking-wider block">
                Quick Test Prompts (Tap to test):
              </span>
              
              <div 
                id="btn-example-fever"
                className={`cb-card cursor-pointer transition-all ${problemText.toLowerCase().includes('bukhaar') || problemText.toLowerCase().includes('bukhar') ? 'ring-2 ring-[#0873d1] bg-[#f0f8ff]' : 'hover:bg-slate-50'}`}
                onClick={() => {
                  setProblemText('mujhe bukhaar h');
                  showFeedback('Selected: "mujhe bukhaar h" (Fever)');
                }}
              >
                <div className="flex items-center justify-between">
                  <b>💡 Mujhe bukhaar h</b>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">Fever · Self</span>
                </div>
                <p className="cb-small mt-0.5 text-slate-600">Tests acute fever triage &amp; fever clinic navigation.</p>
              </div>

              <div 
                id="btn-example-chest-pain"
                className={`cb-card cursor-pointer transition-all ${problemText.toLowerCase().includes('saans') || problemText.toLowerCase().includes('chest') ? 'ring-2 ring-[#bd1020] bg-[#fff5f5]' : 'hover:bg-slate-50'}`}
                onClick={() => {
                  setProblemText('Mere papa ko saans lene mein dikkat ho rahi hai aur chest mein pain hai.');
                  showFeedback('Selected: Chest pain & breathing (Father)');
                }}
              >
                <div className="flex items-center justify-between">
                  <b>💡 Chest pain &amp; Saans dikkat</b>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">Emergency · Father</span>
                </div>
                <p className="cb-small mt-0.5 text-slate-600">“Mere papa ko saans lene mein dikkat ho rahi hai aur chest mein pain hai.”</p>
              </div>

              <div 
                id="btn-example-stomach"
                className="cb-card cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => {
                  setProblemText('Mummy ko pet mein tez dard ho raha hai aur ulti aa rahi hai');
                  showFeedback('Selected: Stomach pain & vomiting (Mother)');
                }}
              >
                <div className="flex items-center justify-between">
                  <b>💡 Pet dard &amp; Ulti</b>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">Urgent · Mother</span>
                </div>
                <p className="cb-small mt-0.5 text-slate-600">“Mummy ko pet mein tez dard ho raha hai aur ulti aa rahi hai”</p>
              </div>

              <div 
                id="btn-example-trauma"
                className="cb-card cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => {
                  setProblemText('Bhai ka accident hua hai haddi toot gayi aur khoon nikal raha hai');
                  showFeedback('Selected: Accident trauma & bleeding (Brother)');
                }}
              >
                <div className="flex items-center justify-between">
                  <b>💡 Accident &amp; Haddi tootna</b>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">Trauma OT · Brother</span>
                </div>
                <p className="cb-small mt-0.5 text-slate-600">“Bhai ka accident hua hai haddi toot gayi aur khoon nikal raha hai”</p>
              </div>
            </div>
          </section>
        )}

        {/* =================================================================== */}
        {/* SCREEN 2: ANALYZING YOUR INPUT...                                   */}
        {/* =================================================================== */}
        {current === 2 && (
          <section className="cb-screen" data-title="Analyzing">
            <div className="cb-top">
              <button className="cb-back" onClick={() => go(1)}>←</button>
              <div className="cb-title">Analyzing your input...</div>
            </div>

            {/* Gemini AI Auto-Analyzed Banner */}
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-between text-xs text-blue-900 font-bold mb-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span>Auto-Analyzed by Gemini 3.8 Flash</span>
              </div>
              <span className="text-[10px] bg-blue-200/80 text-blue-800 px-2 py-0.5 rounded-full font-extrabold">
                Live AI Triage
              </span>
            </div>

            <div className="cb-chat">
              <div className="cb-bubble">
                “{problemText}”
              </div>
              <div className="cb-bubble cb-me">
                {geminiResult?.detectedLanguage || categorized.languageDetected}
              </div>
            </div>

            <div className="cb-check">
              <b>✓</b>Language detected: {geminiResult?.detectedLanguage || categorized.languageDetected}
            </div>
            {geminiResult?.englishTranslation && geminiResult.englishTranslation.toLowerCase() !== problemText.toLowerCase() && (
              <div className="cb-check">
                <b>✓</b>Clinical translation: “{geminiResult.englishTranslation}”
              </div>
            )}
            <div className="cb-check">
              <b>✓</b>Clinical Category: {geminiResult?.triageCategory || categorized.primaryCategory}
            </div>
            <div className="cb-check">
              <b>✓</b>Symptoms categorized: {(geminiResult?.keySignals && geminiResult.keySignals.length > 0) ? geminiResult.keySignals.length : categorized.symptoms.length} indicators identified
            </div>

            <div className="cb-info">
              <b>🔎 Detected Information (Gemini AI Engine)</b>
              <div className="cb-row">
                <span>Patient</span>
                <b>{categorized.patient}</b>
              </div>
              <div className="cb-row">
                <span>Symptoms</span>
                <b>{(geminiResult?.keySignals && geminiResult.keySignals.length > 0) ? geminiResult.keySignals.join(', ') : categorized.symptoms.join(', ')}</b>
              </div>
              <div className="cb-row">
                <span>Urgency</span>
                <b className={
                  (geminiResult?.triageLevel === 1 || categorized.urgency === 'High')
                    ? 'text-[#bd1020]' 
                    : (geminiResult?.triageLevel === 2 || categorized.urgency === 'Moderate')
                    ? 'text-[#d97706]' 
                    : 'text-[#059669]'
                }>
                  Level {geminiResult?.triageLevel || (categorized.urgency === 'High' ? 1 : 2)} ({geminiResult?.triageCategory || categorized.urgency})
                </b>
              </div>
              <div className="cb-row">
                <span>Care Facility</span>
                <b>{geminiResult?.suggestedFacilityType || categorized.recommendedDepartment}</b>
              </div>
              <div className="cb-row">
                <span>Location</span>
                <b>{categorized.location}</b>
              </div>
            </div>

            {geminiResult?.sbar?.situation && (
              <div className="cb-card text-xs text-slate-700 bg-slate-50 border border-slate-200">
                <b className="text-[#17324d] block mb-1">📋 Emergency SBAR Summary:</b>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  {geminiResult.sbar.situation}
                </p>
              </div>
            )}

            <div className="cb-card cb-small text-center">
              ⚕️ We don't diagnose.<br />We help you reach the right care immediately.
            </div>

            <button 
              id="btn-proceed-emergency-detected"
              className="cb-btn" 
              onClick={() => go(3)}
            >
              View Urgency Assessment →
            </button>
          </section>
        )}

        {/* =================================================================== */}
        {/* SCREEN 3: EMERGENCY DETECTED                                        */}
        {/* =================================================================== */}
        {current === 3 && (
          <section className="cb-screen" data-title="Emergency Detected">
            <div className="cb-top">
              <button className="cb-back" onClick={() => go(2)}>←</button>
              <div className="cb-title">Urgency Assessment</div>
            </div>

            {effectiveUrgency === 'High' ? (
              <div className="cb-urgent">
                🚨 LEVEL 1: CRITICAL EMERGENCY<br />
                <small className="font-normal text-xs">Immediate life-saving hospital care required under the Golden Hour window.</small>
              </div>
            ) : effectiveUrgency === 'Moderate' ? (
              <div className="cb-urgent" style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a', color: '#b45309' }}>
                ⚠️ LEVEL 2: URGENT CARE RECOMMENDED<br />
                <small className="font-normal text-xs">Prompt clinical evaluation and diagnostics required to prevent deterioration.</small>
              </div>
            ) : (
              <div className="cb-urgent" style={{ backgroundColor: '#ecfdf5', borderColor: '#a7f3d0', color: '#047857' }}>
                🟢 LEVEL 3: NON-URGENT / OPD CARE<br />
                <small className="font-normal text-xs">Consult a general physician or outpatient clinic during regular hours.</small>
              </div>
            )}

            <div 
              className="cb-warning"
              style={{
                backgroundColor: effectiveUrgency === 'High' ? '#fff1f2' : (effectiveUrgency === 'Moderate' ? '#fffbeb' : '#f8fafc'),
                borderColor: effectiveUrgency === 'High' ? '#fecdd3' : (effectiveUrgency === 'Moderate' ? '#fde68a' : '#e2e8f0'),
                color: '#1e293b'
              }}
            >
              {effectiveReasoning}
            </div>

            <h3 className="font-extrabold text-sm text-[#17324d] mt-4 mb-2 flex items-center justify-between">
              <span>Recommended First-Aid Steps</span>
              {geminiResult?.immediateFirstAidGuidance && (
                <span className="text-[10px] font-normal text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Gemini Verified
                </span>
              )}
            </h3>

            {effectiveFirstAid.map((step, idx) => (
              <div key={idx} className="cb-card flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                  effectiveUrgency === 'High'
                    ? 'bg-rose-100 text-rose-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {idx + 1}
                </div>
                <div className="text-xs font-semibold text-[#17324d]">{step}</div>
              </div>
            ))}

            <button 
              id="btn-find-nearby-hospitals"
              className={`cb-btn ${effectiveUrgency === 'High' ? 'cb-redbtn' : ''}`}
              onClick={() => go(4)}
            >
              Find Nearby {effectiveUrgency === 'High' ? 'Emergency Hospitals' : 'Medical Facilities'} →
            </button>
          </section>
        )}

        {/* =================================================================== */}
        {/* SCREEN 4: NEARBY EMERGENCY FACILITIES                               */}
        {/* =================================================================== */}
        {current === 4 && (
          <section className="cb-screen" data-title="Facilities">
            <div className="cb-top">
              <button className="cb-back" onClick={() => go(3)}>←</button>
              <div className="cb-title">Nearby Emergency Facilities</div>
            </div>

            <div className="cb-small mb-3">
              📍 Your Location<br />
              <b className="text-sm text-[#17324d]">Indore, Madhya Pradesh</b>
            </div>

            <div className="p-2 mb-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between text-xs text-blue-900">
              <span className="font-semibold">Condition: <b>{effectiveCategory}</b></span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200/80 text-blue-800">
                Sorted by Specialty Match
              </span>
            </div>

            {rankedFacilities.map((fac, idx) => (
              <div 
                key={fac.id}
                id={`card-facility-${fac.id}`}
                className={`cb-card cb-facility relative ${idx === 0 ? 'ring-2 ring-emerald-500 bg-emerald-50/20' : ''}`}
                onClick={() => {
                  setSelectedFacility(fac);
                  go(5);
                }}
              >
                {idx === 0 && (
                  <div className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full mb-1 border border-emerald-300">
                    ★ #1 BEST MATCH FOR {effectiveCategory.toUpperCase()}
                  </div>
                )}
                <h3>🏥 {fac.name}</h3>
                <div className="cb-muted">🟢 Open 24×7 · {fac.distance} · {fac.costRange}</div>
                <div className="cb-tags">
                  {fac.tags.map((t, tIdx) => (
                    <span 
                      key={tIdx} 
                      className={`cb-tag ${t.isRed ? 'cb-redtag' : ''}`}
                    >
                      {t.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* =================================================================== */}
        {/* SCREEN 5: HOSPITAL DETAILS                                          */}
        {/* =================================================================== */}
        {current === 5 && (
          <section className="cb-screen" data-title="Hospital Details">
            <div className="cb-top">
              <button className="cb-back" onClick={() => go(4)}>←</button>
              <div className="cb-title">Hospital Details</div>
            </div>

            <div className="cb-hospital-img">🏥</div>

            <h2 className="font-extrabold text-[17px] text-[#17324d] leading-tight">
              {selectedFacility.name}
            </h2>
            <div className="cb-muted">📍 {selectedFacility.address}</div>

            <div className="cb-tags">
              {selectedFacility.tags.map((t, idx) => (
                <span key={idx} className={`cb-tag ${t.isRed ? 'cb-redtag' : ''}`}>
                  {t.label}
                </span>
              ))}
            </div>

            <h3 className="font-extrabold text-sm text-[#17324d] mt-4 mb-2">
              Contact Information
            </h3>

            <div className="cb-card flex items-center justify-between">
              <div>
                <span className="text-xs text-[#6b8193] block">Direct ER Desk</span>
                <span className="font-mono font-bold text-sm text-[#17324d]">📞 {selectedFacility.phone}</span>
              </div>
              <button 
                id="btn-call-hospital"
                className="cb-btn" 
                style={{ width: 'auto', padding: '8px 18px', margin: 0 }}
                onClick={() => {
                  showFeedback(`Calling ${selectedFacility.name}...`);
                  window.open(`tel:${selectedFacility.phone.replace(/[^0-9+]/g, '')}`, '_self');
                }}
              >
                Call
              </button>
            </div>

            <h3 className="font-extrabold text-sm text-[#17324d] mt-4 mb-2">
              Why this facility?
            </h3>
            {categorized.primaryCategory === 'Fever & Infection' ? (
              <>
                <div className="cb-check">✓ 24/7 Emergency &amp; Fever Clinic Assessment</div>
                <div className="cb-check">✓ In-house Pathology Lab (Rapid CBC, Dengue, Widal, Malaria)</div>
                <div className="cb-check">✓ General Medicine &amp; Infectious Disease Doctors on duty</div>
                <div className="cb-check">✓ 24/7 Pharmacy with immediate antipyretic medications</div>
              </>
            ) : categorized.primaryCategory === 'Respiratory Distress' ? (
              <>
                <div className="cb-check">✓ 24/7 Emergency Department with Oxygen Manifold</div>
                <div className="cb-check">✓ Guaranteed ICU &amp; Ventilator support on standby</div>
                <div className="cb-check">✓ Pulmonology &amp; Critical Care resuscitation team</div>
                <div className="cb-check">✓ Fast-track respiratory triage pathway</div>
              </>
            ) : categorized.primaryCategory === 'Cardiac / Chest Emergency' ? (
              <>
                <div className="cb-check">✓ 24/7 Cath Lab &amp; Interventional Cardiology OT</div>
                <div className="cb-check">✓ Guaranteed Coronary ICU &amp; Oxygen Support</div>
                <div className="cb-check">✓ Senior Interventional Cardiologist on call</div>
                <div className="cb-check">✓ Direct Code-STEMI door-to-balloon pathway</div>
              </>
            ) : (
              <>
                <div className="cb-check">✓ 24/7 Emergency Department &amp; Specialty Care</div>
                <div className="cb-check">✓ ICU &amp; Oxygen Support Available</div>
                <div className="cb-check">✓ Specialist Team on call for {categorized.primaryCategory}</div>
                <div className="cb-check">✓ Closest certified facility based on your condition</div>
              </>
            )}

            <div className="cb-card">
              <span className="cb-small">Estimated Cost ({categorized.primaryCategory})</span>
              <div className="cb-cost">{selectedFacility.costRange}</div>
            </div>

            <button 
              id="btn-get-directions"
              className="cb-btn cb-redbtn" 
              onClick={() => go(6)}
            >
              Get Directions →
            </button>
          </section>
        )}

        {/* =================================================================== */}
        {/* SCREEN 6: ROUTE TO HOSPITAL                                         */}
        {/* =================================================================== */}
        {current === 6 && (
          <section className="cb-screen" data-title="Route">
            <div className="cb-top">
              <button className="cb-back" onClick={() => go(5)}>←</button>
              <div className="cb-title">Route to Hospital</div>
            </div>

            {/* Map Visual with styled route */}
            <div className="cb-map">
              <div className="cb-route"></div>
              <div className="cb-pin cb-start" title="Your Location">🔵</div>
              <div className="cb-pin cb-end" title="Hospital Location">📍</div>
              
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-bold text-[#17324d] border border-[#d4e0e6]">
                🟢 Fastest Route · Light Traffic
              </div>
            </div>

            <div className="cb-card">
              <b>{selectedFacility.name}</b>
              <div className="cb-muted">📍 {selectedFacility.distance} · ~8 min (approx.)</div>
            </div>

            <div className="cb-grid">
              <button 
                id="btn-start-navigation"
                className="cb-btn" 
                onClick={() => showFeedback('Navigation started: Turn right in 200m towards Ring Road')}
              >
                🚗 Start Navigation
              </button>
              <button 
                id="btn-share-route"
                className="cb-btn cb-secondary" 
                onClick={() => go(10)}
              >
                ↗ Share Route
              </button>
            </div>

            <button 
              id="btn-view-cost-from-route"
              className="cb-btn" 
              onClick={() => go(7)}
            >
              View Estimated Cost →
            </button>
          </section>
        )}

        {/* =================================================================== */}
        {/* SCREEN 7: ESTIMATED TREATMENT COST                                  */}
        {/* =================================================================== */}
        {current === 7 && (
          <section className="cb-screen" data-title="Cost Breakdown">
            <div className="cb-top">
              <button className="cb-back" onClick={() => go(6)}>←</button>
              <div className="cb-title">Estimated Treatment Cost</div>
            </div>

            <div className="cb-card">
              <b>🏥 {selectedFacility.name}</b>
              <div className="cb-small">Emergency Department</div>
            </div>

            <h3 className="font-extrabold text-sm text-[#17324d] mt-3 mb-2">
              Estimated Cost Breakdown ({categorized.primaryCategory})
            </h3>

            <div className="cb-card">
              {categorized.costBreakdown.map((item, idx) => (
                <div className="cb-row" key={idx}>
                  <span>{item.item}</span>
                  <b>{item.cost}</b>
                </div>
              ))}
            </div>

            <div className="cb-card cb-small">
              ℹ️ This is an estimated cost range for {categorized.primaryCategory.toLowerCase()}. Actual costs may vary depending on physician assessment.
            </div>

            <button 
              id="btn-create-handoff"
              className="cb-btn" 
              onClick={() => go(8)}
            >
              Create Emergency Handoff →
            </button>
          </section>
        )}

        {/* =================================================================== */}
        {/* SCREEN 8: EMERGENCY HANDOFF CARD                                    */}
        {/* =================================================================== */}
        {current === 8 && (
          <section className="cb-screen" data-title="Handoff Card">
            <div className="cb-top">
              <button className="cb-back" onClick={() => go(7)}>←</button>
              <div className="cb-title">Emergency Handoff Card</div>
            </div>

            <div className="cb-urgent">
              🚨 EMERGENCY HANDOFF<br />
              <small className="font-normal text-xs">Quick summary for healthcare providers</small>
            </div>

            <div className="cb-card">
              <div className="cb-row">
                <span>👤 Patient</span>
                <b>{categorized.patient}</b>
              </div>
              <div className="cb-row">
                <span>🌐 Input Language</span>
                <b>{categorized.languageDetected}</b>
              </div>
              <div className="cb-row">
                <span>🩺 Clinical Category</span>
                <b>{categorized.primaryCategory}</b>
              </div>
              <div className="cb-row">
                <span>🫁 Symptoms</span>
                <b>{categorized.symptoms.join(', ')}</b>
              </div>
              <div className="cb-row">
                <span>🚨 Urgency</span>
                <b style={{ color: categorized.urgency === 'High' ? '#c21a2a' : categorized.urgency === 'Moderate' ? '#d97706' : '#059669' }}>
                  {categorized.urgency.toUpperCase()}
                </b>
              </div>
              <div className="cb-row">
                <span>🏥 Target Care Unit</span>
                <b>{categorized.recommendedDepartment}</b>
              </div>
              <div className="cb-row">
                <span>📍 Location</span>
                <b>{categorized.location}</b>
              </div>
            </div>

            {/* Stylized QR Code block matching prototype */}
            <div className="cb-qr" title="Scan by Hospital Staff"></div>

            <button 
              id="btn-share-whatsapp"
              className="cb-btn cb-green" 
              onClick={() => {
                const shareText = categorized.getFamilyShareMessage(selectedFacility.name, selectedFacility.distance);
                showFeedback('WhatsApp handoff summary sent to emergency contacts');
                window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
              }}
            >
              Share via WhatsApp
            </button>

            <button 
              id="btn-download-pdf"
              className="cb-btn cb-secondary" 
              onClick={() => showFeedback('Emergency Handoff PDF generated & saved')}
            >
              Download PDF
            </button>
          </section>
        )}

        {/* =================================================================== */}
        {/* SCREEN 9: OFFLINE MODE                                              */}
        {/* =================================================================== */}
        {current === 9 && (
          <section className="cb-screen" data-title="Offline Mode" style={{ paddingBottom: '92px' }}>
            <div className="cb-offline">
              <div style={{ fontSize: '55px', lineHeight: 1 }}>📡</div>
              <h2 className="font-extrabold text-2xl mt-2 mb-1">Offline Mode</h2>
              <p className="text-sm opacity-90 mb-4">No internet connection</p>

              <div className="cb-card" style={{ color: '#17324d', textAlign: 'left' }}>
                <b className="text-sm mb-2 block">You can still:</b>
                <div className="cb-check">✓ Use emergency keywords</div>
                <div className="cb-check">✓ Get basic guidance</div>
                <div className="cb-check">✓ Access downloaded hospital list</div>
                <div className="cb-check">✓ Use GPS for your location</div>
                <div className="cb-check">✓ Send SMS to family contacts</div>
              </div>

              <p className="cb-small" style={{ color: '#d8e8f3' }}>
                Live data, route and real-time availability will be available when internet is restored.
              </p>

              <button 
                id="btn-offline-return-home"
                className="cb-btn mt-4" 
                style={{ backgroundColor: '#0873d1' }}
                onClick={() => go(0)}
              >
                Return to Home
              </button>
            </div>
          </section>
        )}

        {/* =================================================================== */}
        {/* SCREEN 10: SHARE WITH FAMILY                                        */}
        {/* =================================================================== */}
        {current === 10 && (
          <section className="cb-screen" data-title="Share with Family">
            <div className="cb-top">
              <button className="cb-back" onClick={() => go(9)}>←</button>
              <div className="cb-title">Share with Family</div>
            </div>

            <div className="cb-card" style={{ background: '#e8fff4', borderColor: '#a3e6c8' }}>
              <b className="text-sm text-[#0c6b45]">🟢 Emergency Assistance Requested</b>
              <p className="cb-small text-[#1e5a40] mt-1">
                Your live location and details have been shared with your family.
              </p>
            </div>

            <div className="cb-card">
              <b className="text-xs text-[#6b8193]">Message sent via WhatsApp / SMS</b>
              <p className="text-xs font-semibold text-[#17324d] mt-1.5 leading-relaxed bg-[#f5fbff] p-2.5 rounded-xl border border-[#dceaf2]">
                “{categorized.getFamilyShareMessage(selectedFacility.name, selectedFacility.distance)}”
              </p>
            </div>

            <div 
              id="row-view-maps"
              className="cb-card flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => showFeedback('Opening Google Maps location...')}
            >
              <span className="font-bold text-xs text-[#17324d]">📍 Location</span>
              <span className="text-xs text-[#0873d1] font-bold">View on Maps</span>
            </div>

            <div 
              id="row-open-live-location"
              className="cb-card flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => showFeedback('Live location broadcasting active')}
            >
              <span className="font-bold text-xs text-[#17324d]">📡 Live Location</span>
              <span className="text-xs text-[#0873d1] font-bold">Open</span>
            </div>

            {/* Configured Emergency Numbers & Quick Auto-Call Deck */}
            <div className="cb-card space-y-2.5">
              <div className="flex items-center justify-between">
                <b className="text-xs text-[#17324d] flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-red-600" />
                  <span>Emergency Numbers ({emergencyContacts.length})</span>
                </b>
                {onOpenEmergencyContacts && (
                  <button
                    type="button"
                    onClick={onOpenEmergencyContacts}
                    className="text-[11px] font-bold text-[#0873d1] hover:underline flex items-center gap-0.5"
                  >
                    <Settings className="w-3 h-3" />
                    <span>+ Add / Edit</span>
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                {emergencyContacts.slice(0, 3).map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#f5fbff] border border-[#dceaf2] text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-[#17324d]">{contact.name}</span>
                        {contact.isPrimary && (
                          <span className="text-[9px] px-1 py-0.2 bg-amber-100 text-amber-800 rounded font-bold">
                            ★ Primary
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-[#6b8193]">{contact.phone}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        SoundFX.codeBlueAlarm();
                        if (onTriggerSos) {
                          onTriggerSos();
                        } else {
                          dialPhoneNumber(contact.phone);
                        }
                      }}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded font-bold text-[11px] flex items-center gap-1"
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>Call</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button 
              id="btn-share-again"
              className="cb-btn" 
              onClick={() => {
                const shareText = categorized.getFamilyShareMessage(selectedFacility.name, selectedFacility.distance);
                showFeedback('Emergency alert broadcasted again to family contacts');
                window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
              }}
            >
              Share Again
            </button>
          </section>
        )}

        {/* =================================================================== */}
        {/* BOTTOM FIXED PROGRESS BAR & NEXT BUTTON                             */}
        {/* Exact match to user prototype: .nextbar, #progress, #next           */}
        {/* =================================================================== */}
        <div className="cb-nextbar">
          <div className="cb-progress">
            <span 
              id="progress" 
              style={{ width: `${((current + 1) / 11) * 100}%` }}
            />
          </div>
          <button 
            id="next" 
            className="cb-btn" 
            onClick={next}
          >
            {current === 10 ? '↻ Restart' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
};
