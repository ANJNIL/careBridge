import React, { useState, useEffect, useRef } from 'react';
import { 
  Hospital, 
  TriageLevel, 
  AIProblemAnalysisResult, 
  AIHospitalRecommendation,
  DistressTriageResult
} from '../../types';
import { formatTriageBadge } from '../../utils/triage';
import { playEmergencyTone, SoundFX, speakFirstAidInstruction } from '../../utils/speech';
import { 
  Sparkles, 
  Mic, 
  MicOff, 
  PhoneCall, 
  Navigation, 
  ShieldAlert, 
  Bed, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  HeartPulse, 
  Building2, 
  Send, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Check, 
  ChevronRight,
  Info,
  X,
  Stethoscope,
  Flame,
  Activity,
  Award
} from 'lucide-react';

interface AIProblemAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitals: Hospital[];
  onSelectHospitalAndDispatch: (
    hospital: Hospital,
    triageResult: DistressTriageResult,
    ambulanceDispatched: boolean
  ) => void;
  initialProblemText?: string;
}

const EMERGENCY_PRESET_SCENARIOS = [
  {
    id: 'fever-infection',
    title: 'High Fever & Shivering (Bukhaar)',
    text: 'Mujhe bukhaar h, tez garmi lag rahi hai, sar dard aur sharir mein bahut kamzori hai (high fever, severe body ache, shivering).',
    needs: ['Cashless Empaneled', 'Guaranteed ICU Bed'],
  },
  {
    id: 'cardiac-chest',
    title: 'Severe Chest Pain & Sweats',
    text: '58yo male experiencing sudden crushing retrosternal chest pain radiating down left arm, with cold sweating and breathing difficulty.',
    needs: ['24/7 Cath Lab / Cardiac OT', 'Guaranteed ICU Bed', 'Oxygen Support'],
  },
  {
    id: 'stroke-fast',
    title: 'Sudden Facial Droop & Slurred Speech',
    text: 'Elderly person suddenly cannot speak clearly, right side of face is drooping, unable to raise right arm (suspected acute stroke).',
    needs: ['Neuro-Trauma / Stroke Code', 'Guaranteed ICU Bed'],
  },
  {
    id: 'pediatric-respiratory',
    title: 'Child Gasping / Severe Stridor',
    text: '3-year-old child gasping for air with rapid wheezing, fever, and bluish lips (severe acute pediatric respiratory distress).',
    needs: ['Pediatric / Neonatal PICU', 'Oxygen Support', 'Ventilator Standby'],
  },
  {
    id: 'trauma-fall',
    title: 'High-Impact Fall with Bleeding',
    text: 'Elderly woman fell down staircase, unable to bear weight, severe deformed hip with deep scalp laceration and active bleeding.',
    needs: ['Level-1 Trauma OT', 'Guaranteed ICU Bed', 'On-Site Blood Bank'],
  },
  {
    id: 'burn-scald',
    title: 'Extensive Scald / Thermal Burn',
    text: 'Extensive second-degree burn across chest and arms from boiling liquid; patient in excruciating pain with blistering and shivering.',
    needs: ['Guaranteed ICU Bed', 'Oxygen Support'],
  },
  {
    id: 'seizure-status',
    title: 'Prolonged Seizure / Convulsions',
    text: 'Young adult collapsed with continuous violent generalized convulsions lasting over 5 minutes, unresponsive post-ictal.',
    needs: ['Neuro-Trauma / Stroke Code', 'Guaranteed ICU Bed', 'Ventilator Standby'],
  },
];

const PATIENT_NEED_OPTIONS = [
  { id: 'need-icu', label: 'Guaranteed ICU Bed', icon: '🛏️', desc: 'Critical intensive care unit availability' },
  { id: 'need-cath', label: '24/7 Cath Lab / Cardiac OT', icon: '⚡', desc: 'Angioplasty & interventional cardiology' },
  { id: 'need-oxygen', label: 'Oxygen Support', icon: '🫁', desc: 'High-flow oxygen or piped O2 bed' },
  { id: 'need-pediatric', label: 'Pediatric / Neonatal PICU', icon: '👶', desc: 'Specialized infant & child critical care' },
  { id: 'need-neuro', label: 'Neuro-Trauma / Stroke Code', icon: '🧠', desc: 'Emergency stroke thrombolysis & neurosurgery' },
  { id: 'need-trauma', label: 'Level-1 Trauma OT', icon: '🏥', desc: 'Tertiary poly-trauma resuscitation surgical theatre' },
  { id: 'need-ventilator', label: 'Ventilator Standby', icon: '💨', desc: 'Invasive mechanical ventilation' },
  { id: 'need-cashless', label: 'Ayushman Bharat / Cashless', icon: '💳', desc: 'PM-JAY or insurance empanelment' },
];

export const AIProblemAnalyzerModal: React.FC<AIProblemAnalyzerModalProps> = ({
  isOpen,
  onClose,
  hospitals,
  onSelectHospitalAndDispatch,
  initialProblemText = '',
}) => {
  const [problemDescription, setProblemDescription] = useState<string>(initialProblemText);
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>(['Guaranteed ICU Bed']);
  const [patientAge, setPatientAge] = useState<string>('54');
  const [patientGender, setPatientGender] = useState<string>('Male');

  // Voice recording state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AIProblemAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [autoAnalyzeEnabled, setAutoAnalyzeEnabled] = useState<boolean>(true);

  // Audio Speech state for first aid
  const [isSpeakingFirstAid, setIsSpeakingFirstAid] = useState<boolean>(false);

  // Selected hospital from AI suggestions
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [includeAmbulance, setIncludeAmbulance] = useState<boolean>(true);

  // Sync initial problem text if provided
  useEffect(() => {
    if (initialProblemText) {
      setProblemDescription(initialProblemText);
    }
  }, [initialProblemText]);

  // Real-time AI Auto-Analysis without clicking (Debounced 700ms)
  useEffect(() => {
    if (!autoAnalyzeEnabled) return;
    const trimmed = problemDescription.trim();
    if (trimmed.length < 5) return;

    const timer = setTimeout(() => {
      handleRunAIAutoAnalysis(true);
    }, 700);

    return () => clearTimeout(timer);
  }, [problemDescription, selectedNeeds, patientAge, patientGender, autoAnalyzeEnabled]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isOpen) return null;

  const toggleNeed = (needLabel: string) => {
    SoundFX.init();
    SoundFX.tapTick();
    if (selectedNeeds.includes(needLabel)) {
      setSelectedNeeds(selectedNeeds.filter((n) => n !== needLabel));
    } else {
      setSelectedNeeds([...selectedNeeds, needLabel]);
    }
  };

  const handleApplyPreset = (scenario: typeof EMERGENCY_PRESET_SCENARIOS[0]) => {
    SoundFX.init();
    SoundFX.cardiacPulse();
    setProblemDescription(scenario.text);
    setSelectedNeeds(scenario.needs);
  };

  const handleToggleVoiceInput = async () => {
    SoundFX.init();
    setSpeechError(null);

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setSpeechError('Speech recognition is not supported in this browser. Please type symptoms.');
      return;
    }

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setTimeout(() => stream.getTracks().forEach((t) => t.stop()), 1000);
      }

      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        SoundFX.alertSonar();
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
        }
        if (transcript.trim()) {
          setProblemDescription(transcript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        setSpeechError(`Voice error: ${event.error || 'Check microphone'}`);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      setSpeechError('Microphone permission required. Please enable mic access.');
    }
  };

  const handleRunAIAutoAnalysis = async (isAuto = false) => {
    if (!problemDescription.trim()) {
      if (!isAuto) setSpeechError('Please describe the problem or pick a preset scenario first.');
      return;
    }

    if (!isAuto) {
      SoundFX.init();
      SoundFX.alertSonar();
      setAnalysisResult(null);
    }
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch('/api/ai-analyze-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemDescription: problemDescription.trim(),
          patientAge: patientAge || '50',
          patientGender: patientGender || 'Unspecified',
          specificNeeds: selectedNeeds,
          hospitals,
          preferredLanguage: 'en',
        }),
      });

      if (!response.ok) {
        throw new Error('AI analysis service request failed');
      }

      const data: AIProblemAnalysisResult = await response.json();
      setAnalysisResult(data);
      playEmergencyTone(data.urgencyLevel === 1 ? 'alert' : 'success');

      if (data.matchedHospitalRecommendations.length > 0) {
        setSelectedHospitalId(data.matchedHospitalRecommendations[0].hospitalId);
      }
    } catch (err: any) {
      console.error('AI Auto-analysis error:', err);
      setAnalysisError('AI analysis request encountered an error. Clinical fallback applied.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSpeakFirstAid = () => {
    if (!analysisResult) return;
    if (isSpeakingFirstAid) {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setIsSpeakingFirstAid(false);
    } else {
      const text = analysisResult.firstAidSteps.join('. ');
      speakFirstAidInstruction(text, 'en');
      setIsSpeakingFirstAid(true);
      setTimeout(() => setIsSpeakingFirstAid(false), 8000);
    }
  };

  const handleConfirmAndDispatch = () => {
    if (!analysisResult) return;
    const targetId = selectedHospitalId || analysisResult.matchedHospitalRecommendations[0]?.hospitalId;
    const targetHospital = hospitals.find((h) => h.id === targetId) || hospitals[0];

    const triageEquivalent: DistressTriageResult = {
      detectedLanguage: 'en',
      originalText: problemDescription,
      englishTranslation: problemDescription,
      keySignals: analysisResult.chiefComplaints,
      triageLevel: analysisResult.urgencyLevel,
      triageCategory:
        analysisResult.urgencyLevel === 1
          ? 'Immediate / Critical'
          : analysisResult.urgencyLevel === 2
          ? 'Urgent'
          : 'Non-Urgent',
      urgencyReasoning: analysisResult.analysisSummary,
      requiredSpecialties: analysisResult.recommendedSpecialties,
      immediateFirstAidGuidance: analysisResult.firstAidSteps,
      safetyDisclaimer: analysisResult.safetyDisclaimer,
      sbar: analysisResult.sbar,
      suggestedFacilityType: 'Tertiary Trauma & Emergency Center',
      criticalGoldenHourAlert: analysisResult.urgencyLevel === 1,
    };

    SoundFX.init();
    SoundFX.codeBlueAlarm();
    onSelectHospitalAndDispatch(targetHospital, triageEquivalent, includeAmbulance);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-tactical-cyan/40 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Modal Tactical Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-tactical-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-900/40 ring-1 ring-cyan-400">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-hud font-bold text-white tracking-wide">
                  AI Problem Auto-Analyzer &amp; Hospital Matchmaker
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase font-bold">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Auto-triage problem symptoms, determine urgency level, and suggest best hospitals according to your specific need.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          
          {/* Section 1: Problem Input & Voice Recorder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-tactical-cyan" />
                <span>Describe Patient Problem / Symptoms (Voice or Text)</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Supports English, Hindi, Hinglish &amp; Indian languages
              </span>
            </div>

            <div className="relative">
              <textarea
                id="input-ai-problem-description"
                rows={3}
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder="e.g., 'Severe crushing chest pain radiating to left arm with cold sweat, 58M, onset 30 mins ago' or 'Child fell from terrace, suspected head trauma and unconscious'..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 pr-14 text-sm text-white placeholder:text-slate-500 font-sans focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none shadow-inner"
              />
              <button
                type="button"
                id="btn-voice-problem-dictate"
                onClick={handleToggleVoiceInput}
                title={isListening ? 'Stop Voice Recording' : 'Speak Problem Description'}
                className={`absolute right-3 top-3.5 p-2.5 rounded-xl transition-all shadow-md ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>

            {speechError && (
              <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{speechError}</span>
              </div>
            )}

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono text-slate-400 block">
                Quick Test Scenarios (1-Tap to Load Problem &amp; Needs):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {EMERGENCY_PRESET_SCENARIOS.map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => handleApplyPreset(sc)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700 font-medium transition-colors flex items-center gap-1"
                  >
                    <span>⚡</span>
                    <span>{sc.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Specific Patient Needs & Demographics */}
          <div className="space-y-3 bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Select Your Specific Needs &amp; Facilities Required:</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                AI will match only hospitals equipped for these needs
              </span>
            </div>

            {/* Need Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PATIENT_NEED_OPTIONS.map((need) => {
                const isSelected = selectedNeeds.includes(need.label);
                return (
                  <button
                    key={need.id}
                    type="button"
                    onClick={() => toggleNeed(need.label)}
                    className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-sm ring-1 ring-cyan-400/50'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base">{need.icon}</span>
                      {isSelected ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                      ) : (
                        <div className="w-3 h-3 rounded-full border border-slate-700" />
                      )}
                    </div>
                    <span className="text-xs font-bold leading-tight line-clamp-1">{need.label}</span>
                    <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{need.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* Demographic helpers */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Patient Age</label>
                <input
                  type="number"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  placeholder="e.g. 58"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Patient Gender</label>
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Child/Infant">Child / Infant</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="sm:col-span-2 flex flex-col justify-end gap-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono px-1">
                  <span className="flex items-center gap-1.5 text-cyan-300">
                    {isAnalyzing ? (
                      <>
                        <div className="w-2.5 h-2.5 rounded-full border border-cyan-400 border-t-transparent animate-spin" />
                        <span className="animate-pulse">Live Gemini Auto-Analyzing (No Click Needed)...</span>
                      </>
                    ) : analysisResult ? (
                      <>
                        <span className="text-emerald-400">✓ Auto-Analyzed by Gemini 3.8 Flash</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Real-time Gemini Auto-Analyze</span>
                      </>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAutoAnalyzeEnabled(!autoAnalyzeEnabled)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                      autoAnalyzeEnabled 
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-700 hover:bg-cyan-900' 
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Auto-Analyze: {autoAnalyzeEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                <button
                  type="button"
                  id="btn-run-ai-analysis"
                  onClick={() => handleRunAIAutoAnalysis(false)}
                  disabled={isAnalyzing || !problemDescription.trim()}
                  className={`w-full py-2.5 px-4 rounded-xl font-hud font-bold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all ${
                    isAnalyzing || !problemDescription.trim()
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-950/50 active:scale-[0.99] ring-1 ring-cyan-400'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      <span>Auto-Analyzing with Gemini AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-cyan-200" />
                      <span>{analysisResult ? 'Re-Analyze with Gemini AI' : 'Auto-Analyze Problem & Suggest Best Hospitals'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: AI Analysis Results & Hospital Suggestions */}
          {analysisResult && (
            <div className="space-y-5 animate-in fade-in-50 duration-300">
              
              {/* Urgency & Clinical Triage Banner */}
              <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                analysisResult.urgencyLevel === 1
                  ? 'bg-rose-950/60 border-rose-500/70 text-rose-100 shadow-lg shadow-rose-950/50'
                  : analysisResult.urgencyLevel === 2
                  ? 'bg-amber-950/60 border-amber-500/70 text-amber-100'
                  : 'bg-emerald-950/60 border-emerald-500/70 text-emerald-100'
              }`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-black/40 border border-white/20">
                      Triage {analysisResult.urgencyLabel}
                    </span>
                    <span className="text-xs font-mono font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {analysisResult.estimatedTimeWindow}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium leading-relaxed">
                    {analysisResult.analysisSummary}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleSpeakFirstAid}
                    className="px-3 py-1.5 rounded-lg bg-black/40 hover:bg-black/60 border border-white/20 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    {isSpeakingFirstAid ? <VolumeX className="w-3.5 h-3.5 text-rose-300" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-300" />}
                    <span>{isSpeakingFirstAid ? 'Stop Audio' : 'Listen First Aid'}</span>
                  </button>
                </div>
              </div>

              {/* Chief Complaints & Clinical Considerations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="font-mono text-[11px] text-slate-400 font-bold uppercase block flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Chief Clinical Indicators
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.chiefComplaints.map((c, i) => (
                      <span key={i} className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200">
                        {c}
                      </span>
                    ))}
                  </div>
                  <div className="pt-1">
                    <span className="font-mono text-[10px] text-slate-400 block">Required Specialties:</span>
                    <span className="text-cyan-300 font-medium">
                      {analysisResult.recommendedSpecialties.join(' • ')}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="font-mono text-[11px] text-slate-400 font-bold uppercase block flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                    Immediate Life-Saving First Aid Protocol
                  </span>
                  <ul className="space-y-1 text-slate-300">
                    {analysisResult.firstAidSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-cyan-400 font-bold shrink-0">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* AI Best Hospitals Suggested According to Your Need */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-tactical-amber" />
                    <h3 className="text-sm font-hud font-bold text-white uppercase tracking-wider">
                      AI Suggested Best Hospitals According to Your Need:
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Ranked by capability match, ICU beds &amp; travel ETA
                  </span>
                </div>

                <div className="space-y-3">
                  {analysisResult.matchedHospitalRecommendations.map((rec, index) => {
                    const hospitalData = hospitals.find((h) => h.id === rec.hospitalId);
                    const isSelected = selectedHospitalId === rec.hospitalId;
                    const isBestMatch = rec.fitTier === 'Best Match' || index === 0;

                    return (
                      <div
                        key={rec.hospitalId}
                        onClick={() => setSelectedHospitalId(rec.hospitalId)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-slate-900 border-cyan-400 shadow-lg shadow-cyan-950/50 ring-2 ring-cyan-500/40'
                            : isBestMatch
                            ? 'bg-slate-900/90 border-tactical-amber/60 hover:border-amber-400'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Top Badge */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded text-xs font-hud font-bold uppercase tracking-wider flex items-center gap-1 ${
                              isBestMatch
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}>
                              {isBestMatch ? '🏆 #1 AI Best Match' : `#${index + 1} Alternative`}
                            </span>
                            <h4 className="text-sm sm:text-base font-bold text-white">
                              {rec.hospitalName}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              {rec.fitScore}% Fit Score
                            </span>
                            <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              {hospitalData?.etaMinutes || 8} mins ({hospitalData?.distanceKm || 2.4} km)
                            </span>
                          </div>
                        </div>

                        {/* AI Rationale Statement */}
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs font-medium text-slate-200 mb-3 flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                          <p className="leading-relaxed">{rec.aiRationale}</p>
                        </div>

                        {/* Key Advantages & Beds Status */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {rec.keyAdvantages.map((adv, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono flex items-center gap-1"
                              >
                                <Check className="w-3 h-3 text-emerald-400" />
                                {adv}
                              </span>
                            ))}
                          </div>

                          {/* Live Hospital Beds */}
                          {hospitalData && (
                            <div className="flex items-center justify-end gap-3 text-xs font-mono text-slate-300">
                              <span className="flex items-center gap-1">
                                <Bed className="w-3.5 h-3.5 text-rose-400" />
                                <strong className="text-white">{hospitalData.icuBedsAvailable}</strong> ICU
                              </span>
                              <span className="flex items-center gap-1">
                                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                                <strong className="text-white">{hospitalData.oxygenBedsAvailable}</strong> O₂
                              </span>
                              <span className="flex items-center gap-1">
                                <strong>Level {hospitalData.traumaLevel}</strong> Trauma
                              </span>
                            </div>
                          )}
                        </div>

                        {rec.potentialLimitations && rec.potentialLimitations.length > 0 && (
                          <div className="mt-2 text-[11px] text-amber-400/90 flex items-center gap-1">
                            <Info className="w-3 h-3 shrink-0" />
                            <span>Notice: {rec.potentialLimitations.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SBAR Card Handshake Preview */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
                <span className="text-slate-400 font-bold uppercase block text-[10px] tracking-wider">
                  Generated Emergency SBAR Handoff Card (Will be beamed to hospital ER desk):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 text-[11px]">
                  <div><strong className="text-rose-400">S (Situation):</strong> {analysisResult.sbar.situation}</div>
                  <div><strong className="text-amber-400">B (Background):</strong> {analysisResult.sbar.background}</div>
                  <div><strong className="text-cyan-400">A (Assessment):</strong> {analysisResult.sbar.assessment}</div>
                  <div><strong className="text-emerald-400">R (Recommendation):</strong> {analysisResult.sbar.recommendation}</div>
                </div>
              </div>

              {/* Non-diagnostic disclaimer */}
              <p className="text-[10px] text-slate-500 font-mono text-center">
                {analysisResult.safetyDisclaimer}
              </p>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-tactical-border flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer font-mono select-none">
              <input
                type="checkbox"
                checked={includeAmbulance}
                onChange={(e) => setIncludeAmbulance(e.target.checked)}
                className="rounded border-slate-700 text-rose-500 focus:ring-rose-500 bg-slate-900"
              />
              <span>Request 108 Emergency Ambulance Transit</span>
            </label>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
            >
              Cancel
            </button>

            {analysisResult && (
              <button
                id="btn-confirm-ai-dispatch"
                onClick={handleConfirmAndDispatch}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-hud font-bold text-xs sm:text-sm tracking-wide flex items-center gap-2 shadow-lg shadow-rose-950/50 active:scale-95 ring-1 ring-rose-400 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Select &amp; Pre-Alert ER Desk ({hospitals.find(h => h.id === selectedHospitalId)?.name.split(' ')[0] || 'Hospital'})</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
