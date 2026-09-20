import React, { useState, useEffect, useRef } from 'react';
import { 
  Hospital, 
  IncomingEmergencyDispatch, 
  DistressTriageResult, 
  SupportedLanguage,
  ActiveAppView 
} from '../../types';
import { SoundFX, LANGUAGE_LOCALE_MAP } from '../../utils/speech';
import { 
  Radio, 
  Shield, 
  Cross, 
  AlertOctagon, 
  Mic, 
  MicOff,
  Speech, 
  Navigation2, 
  MapPin, 
  CheckCircle, 
  PhoneCall, 
  Send, 
  Zap, 
  RadioTower, 
  Activity, 
  Plus, 
  Volume2, 
  Check, 
  SplitSquareVertical, 
  FileText,
  RefreshCw,
  AlertTriangle,
  Keyboard,
  Sparkles,
  Info,
  XCircle
} from 'lucide-react';

interface TacticalHudViewProps {
  hospitals: Hospital[];
  dispatches: IncomingEmergencyDispatch[];
  onDispatchPatient: (payload: {
    triageResult: DistressTriageResult;
    hospital: Hospital;
    ambulanceDispatched: boolean;
  }) => void;
  onUpdateHospitalResources: (
    hospitalId: string,
    updates: {
      icuBedsAvailable?: number;
      oxygenBedsAvailable?: number;
      ventilatorsAvailable?: number;
    }
  ) => void;
  onUpdateDispatchStatus: (
    dispatchId: string,
    newStatus: IncomingEmergencyDispatch['status']
  ) => void;
  onSwitchView?: (view: ActiveAppView) => void;
  currentUser?: import('../../types').AuthUser | null;
  onOpenLogin?: () => void;
  onOpenAIAnalyzer?: (initialText?: string) => void;
}

interface TacticalHospitalState {
  id: number;
  hospitalRefId: string;
  name: string;
  eta: string;
  dist: string;
  icuBeds: number;
  o2Beds: number;
  bloodOneg: number;
  isAiTarget: boolean;
  specialty: string;
}

interface ErQueueItem {
  id: string;
  eta: string;
  level: string;
  symptoms: string;
  bedReserved: string;
  status: string;
}

export const TacticalHudView: React.FC<TacticalHudViewProps> = ({
  hospitals,
  dispatches,
  onDispatchPatient,
  onUpdateHospitalResources,
  onUpdateDispatchStatus,
  onSwitchView,
  currentUser,
  onOpenLogin,
  onOpenAIAnalyzer,
}) => {
  // Mode: 'patient' (SOS Distress) or 'desk' (ER Command Desk)
  const [hudMode, setHudMode] = useState<'patient' | 'desk'>('patient');
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [audioBannerVisible, setAudioBannerVisible] = useState(true);
  const [showSosModal, setShowSosModal] = useState(false);

  // Radar & Selected Hospital State
  const [activeHospitalId, setActiveHospitalId] = useState<number>(1);
  const [currentTriageLevel, setCurrentTriageLevel] = useState<'L1' | 'L2'>('L1');
  const [triageCodeText, setTriageCodeText] = useState<'RED ALERT' | 'AMBER URGENT'>('RED ALERT');
  const [urgencyLabel, setUrgencyLabel] = useState<string>('ACUTE CARDIAC / TRAUMA');
  const [facilityReq, setFacilityReq] = useState<string>('Req: 24/7 Cath Lab + ICU Bed');
  
  // Real-time transcript & speech state
  const [transcript, setTranscript] = useState<string>(
    'Mere father ko saans lene mein dikkat ho rahi hai aur severe chest pain hai'
  );
  const [detectedLangTag, setDetectedLangTag] = useState<string>('HINDI / HINGLISH');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);

  // Advanced Speech & Mic state
  const [micStatus, setMicStatus] = useState<'idle' | 'requesting' | 'listening' | 'analyzing' | 'error' | 'unsupported'>('idle');
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [manualInputText, setManualInputText] = useState<string>('');
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const [speechInterimText, setSpeechInterimText] = useState<string>('');

  // Local synced hospitals
  const [tacticalHospitals, setTacticalHospitals] = useState<TacticalHospitalState[]>([
    {
      id: 1,
      hospitalRefId: hospitals[0]?.id || 'hosp-apex',
      name: 'Apex Trauma & Cardiac Center',
      eta: '7 mins',
      dist: '2.1 km',
      icuBeds: hospitals[0]?.icuBedsAvailable ?? 3,
      o2Beds: hospitals[0]?.oxygenBedsAvailable ?? 14,
      bloodOneg: 2,
      isAiTarget: true,
      specialty: 'Cath Lab • Trauma OT',
    },
    {
      id: 2,
      hospitalRefId: hospitals[1]?.id || 'hosp-metro',
      name: 'City Metro Life Care',
      eta: '12 mins',
      dist: '3.8 km',
      icuBeds: hospitals[1]?.icuBedsAvailable ?? 1,
      o2Beds: hospitals[1]?.oxygenBedsAvailable ?? 8,
      bloodOneg: 0,
      isAiTarget: false,
      specialty: 'Level-1 Trauma • General',
    },
    {
      id: 3,
      hospitalRefId: hospitals[2]?.id || 'hosp-sanjeevani',
      name: 'Sanjeevani Blood & ER',
      eta: '16 mins',
      dist: '5.4 km',
      icuBeds: hospitals[2]?.icuBedsAvailable ?? 0,
      o2Beds: hospitals[2]?.oxygenBedsAvailable ?? 19,
      bloodOneg: 8,
      isAiTarget: false,
      specialty: 'State Blood Bank • Apheresis',
    },
  ]);

  // ER Queue items
  const [erQueue, setErQueue] = useState<ErQueueItem[]>([
    {
      id: 'CB-9021',
      eta: '7m ETA',
      level: 'L1 CRITICAL',
      symptoms: 'Acute Chest Pain & Dyspnea (Hinglish Voice)',
      bedReserved: 'Cath Lab 1 + ICU Bed Reserved',
      status: 'En-Route',
    },
    {
      id: 'CB-8419',
      eta: 'Arrived',
      level: 'L2 URGENT',
      symptoms: 'Bike Crash Trauma - Arm Dislocation',
      bedReserved: 'Triage Bay 2',
      status: 'In Bay',
    },
  ]);

  // Sync external hospitals when props change
  useEffect(() => {
    if (hospitals.length >= 3) {
      setTacticalHospitals((prev) => [
        {
          ...prev[0],
          icuBeds: hospitals[0]?.icuBedsAvailable ?? prev[0].icuBeds,
          o2Beds: hospitals[0]?.oxygenBedsAvailable ?? prev[0].o2Beds,
        },
        {
          ...prev[1],
          icuBeds: hospitals[1]?.icuBedsAvailable ?? prev[1].icuBeds,
          o2Beds: hospitals[1]?.oxygenBedsAvailable ?? prev[1].o2Beds,
        },
        {
          ...prev[2],
          icuBeds: hospitals[2]?.icuBedsAvailable ?? prev[2].icuBeds,
          o2Beds: hospitals[2]?.oxygenBedsAvailable ?? prev[2].o2Beds,
        },
      ]);
    }
  }, [hospitals]);

  // Sync external dispatches to erQueue
  useEffect(() => {
    if (dispatches.length > 0) {
      const mapped = dispatches.slice(0, 6).map((d) => ({
        id: d.digitalHandshakeToken || d.id,
        eta: `${d.ambulanceEtaMinutes || 7}m ETA`,
        level: `L${d.triageLevel} ${d.triageLevel === 1 ? 'CRITICAL' : 'URGENT'}`,
        symptoms: d.symptoms.slice(0, 2).join(', ') || d.sbar.situation,
        bedReserved: `${d.hospitalName || 'Apex Trauma'} Bay Reserved`,
        status: d.status,
      }));
      setErQueue(mapped);
    }
  }, [dispatches]);

  // Waveform canvas & real audio stream refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveOffsetRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Animated Ambulance beacon ref on vector
  const [ambPos, setAmbPos] = useState({ x: 140, y: 200 });
  const ambProgressRef = useRef<number>(0);

  // Clean up streams on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        try {
          audioCtxRef.current.close();
        } catch {}
      }
    };
  }, []);

  // Audio Visualizer Waveform Loop (Uses Real Microphone Stream when available)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawWave = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.lineWidth = 2.5;

      const analyser = analyserRef.current;
      if (isListening && analyser) {
        const bufferLength = analyser.fftSize;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);

        ctx.strokeStyle = '#FF1744';
        const sliceWidth = canvas.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * canvas.height) / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
      } else {
        ctx.strokeStyle = isListening ? '#FF1744' : '#1E2D4A';
        const sliceWidth = canvas.width / 40;
        let x = 0;

        for (let i = 0; i < 40; i++) {
          const amplitude = isListening
            ? Math.sin(i * 0.4 + waveOffsetRef.current) * 14
            : Math.sin(i * 0.2 + waveOffsetRef.current) * 3.5;
          const y = canvas.height / 2 + amplitude;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        waveOffsetRef.current += 0.12;
      }
      ctx.stroke();
      animFrameRef.current = requestAnimationFrame(drawWave);
    };

    drawWave();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isListening]);

  // Ambulance moving beacon animation along vector
  useEffect(() => {
    let frameId: number;
    const animateAmbulance = () => {
      ambProgressRef.current = (ambProgressRef.current + 0.003) % 1;
      const curX = 90 + ambProgressRef.current * 320;
      const curY = 210 - Math.sin(ambProgressRef.current * Math.PI) * 70;
      setAmbPos({ x: curX, y: curY });
      frameId = requestAnimationFrame(animateAmbulance);
    };
    frameId = requestAnimationFrame(animateAmbulance);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Live Distress Triage via Server API (with robust heuristic fallback)
  const analyzeDistressVoice = async (textToTriage: string) => {
    const cleanText = textToTriage.replace(/^["']|["']$/g, '').trim();
    if (!cleanText) return;

    setIsAiProcessing(true);
    setMicStatus('analyzing');
    SoundFX.cardiacPulse();

    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputText: cleanText,
          languageCode: language,
        }),
      });

      if (!res.ok) throw new Error('API triage error');

      const data: DistressTriageResult = await res.json();
      const isL1 = data.triageLevel === 1;

      setCurrentTriageLevel(isL1 ? 'L1' : 'L2');
      setTriageCodeText(isL1 ? 'RED ALERT' : 'AMBER URGENT');
      setUrgencyLabel(data.keySignals[0] || (isL1 ? 'CRITICAL EMERGENCY' : 'URGENT MEDICAL CARE'));
      setFacilityReq(`Req: ${data.requiredSpecialties.slice(0, 2).join(' • ')}`);
      setDetectedLangTag(data.detectedLanguage.toUpperCase().slice(0, 18));
      setTranscript(`"${cleanText}"`);
      setManualInputText(cleanText);

      // Select best matching hospital
      if (isL1) {
        selectRadarHospital(1);
        SoundFX.sirenBurst();
      } else {
        selectRadarHospital(2);
        SoundFX.alertSonar();
      }
    } catch (err) {
      console.warn('API triage fallback:', err);
      const lower = cleanText.toLowerCase();
      const isL1 = /chest|heart|saans|chhati|breath|stroke|paralysis|unconscious|behosh|bleed|khun|accident|head|severe|attack|dying/i.test(lower);
      setCurrentTriageLevel(isL1 ? 'L1' : 'L2');
      setTriageCodeText(isL1 ? 'RED ALERT' : 'AMBER URGENT');
      setUrgencyLabel(isL1 ? 'ACUTE CARDIO / RESPIRATORY' : 'URGENT INJURY');
      setFacilityReq(isL1 ? 'Req: Cath Lab • ICU Bay' : 'Req: 24/7 ER Trauma Bay');
      setTranscript(`"${cleanText}"`);
      setManualInputText(cleanText);
      if (isL1) selectRadarHospital(1);
      else selectRadarHospital(2);
    } finally {
      setIsAiProcessing(false);
      setMicStatus('idle');
    }
  };

  // Handle Quick Symptom Injection
  const injectSymptom = (code: string, level: 'L1' | 'L2', desc: string, requirement: string) => {
    SoundFX.cardiacPulse();
    setCurrentTriageLevel(level);
    setTranscript(`"${desc}"`);
    setManualInputText(desc);
    setDetectedLangTag('INSTANT INJECT');
    setFacilityReq(`Req: ${requirement}`);

    if (level === 'L1') {
      setTriageCodeText('RED ALERT');
      setUrgencyLabel(`${code} CRITICAL`);
      selectRadarHospital(1);
    } else {
      setTriageCodeText('AMBER URGENT');
      setUrgencyLabel(`${code} URGENT`);
      selectRadarHospital(2);
    }
  };

  // Stop listening & release hardware
  const stopListening = (runAnalysis = true) => {
    setIsListening(false);
    setMicStatus('idle');
    setSpeechInterimText('');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    if (runAnalysis) {
      const textToAnalyze = transcript.replace(/^["']|["']$/g, '').trim();
      if (textToAnalyze) {
        analyzeDistressVoice(textToAnalyze);
      }
    }
  };

  // Start listening with real microphone audio + Web Speech API
  const startListening = async () => {
    SoundFX.init();
    setMicErrorMessage(null);
    setMicStatus('requesting');
    setSpeechInterimText('');

    // 1. Request real microphone audio stream for visualizer & permission trigger
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
          }
          audioCtxRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 128;
          source.connect(analyser);
          analyserRef.current = analyser;
        }
      }
    } catch (err: any) {
      console.warn('Microphone permission / getUserMedia notice:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicStatus('error');
        setMicErrorMessage('Microphone access blocked. Click the lock/camera icon in your browser address bar to allow mic access, or type your symptoms below.');
        return;
      }
    }

    // 2. Initialize Web Speech Recognition
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setMicStatus('unsupported');
      setMicErrorMessage('Speech recognition is not supported in this browser. Please type your symptoms or choose a quick preset below.');
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
      recognition.lang = LANGUAGE_LOCALE_MAP[language] || 'hi-IN';
      recognition.maxAlternatives = 1;

      let speechBuffer = '';

      recognition.onstart = () => {
        setIsListening(true);
        setMicStatus('listening');
        SoundFX.alertSonar();
      };

      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = 0; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            finalText += item[0].transcript + ' ';
          } else {
            interimText += item[0].transcript;
          }
        }

        const combined = (finalText + interimText).trim();
        if (combined) {
          speechBuffer = combined;
          setTranscript(`"${combined}"`);
          setSpeechInterimText(interimText);
          setManualInputText(combined);
          setDetectedLangTag(`${language.toUpperCase()} SPEECH`);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event.error);
        if (event.error === 'not-allowed') {
          setMicStatus('error');
          setMicErrorMessage('Microphone permission blocked. Please allow mic in browser settings, or type symptoms below.');
          stopListening(false);
        } else if (event.error === 'no-speech') {
          // Do not cancel listening on temporary silence
        } else if (event.error === 'network') {
          setMicStatus('error');
          setMicErrorMessage('Speech recognition network error. Type symptoms below or select quick presets.');
          stopListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setSpeechInterimText('');
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach((t) => t.stop());
          audioStreamRef.current = null;
        }

        if (speechBuffer.trim()) {
          analyzeDistressVoice(speechBuffer.trim());
        } else {
          setMicStatus('idle');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Speech recognition start failed:', err);
      setMicStatus('error');
      setMicErrorMessage('Could not activate speech recognition. Please type your symptoms below.');
      stopListening(false);
    }
  };

  // Toggle voice listening
  const toggleDistressVoice = () => {
    if (isListening) {
      stopListening(true);
    } else {
      startListening();
    }
  };

  // Hospital Selection & Route Vector
  const selectRadarHospital = (id: number) => {
    SoundFX.beep(640, 0.08, 'sine');
    setActiveHospitalId(id);
  };

  const currentActiveHosp =
    tacticalHospitals.find((h) => h.id === activeHospitalId) || tacticalHospitals[0];

  // Route vector path definition based on active hospital
  const routePathD =
    activeHospitalId === 1
      ? 'M 90,210 Q 180,180 280,200 T 410,130'
      : activeHospitalId === 2
      ? 'M 90,210 Q 140,140 160,110 T 190,80'
      : 'M 90,210 Q 190,270 240,280 T 320,280';

  // Transmit SBAR Handshake
  const transmitEmergencyHandshake = () => {
    SoundFX.alertSonar();
    setTimeout(() => SoundFX.sirenBurst(), 160);
    setIsTransmitting(true);

    const token = `CB-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTicket: ErQueueItem = {
      id: token,
      eta: `${currentActiveHosp.eta} ETA`,
      level: `${currentTriageLevel} CRITICAL`,
      symptoms: transcript.replace(/"/g, ''),
      bedReserved: `${currentActiveHosp.name} Pre-Alerted`,
      status: 'En-Route',
    };

    setErQueue((prev) => [newTicket, ...prev]);

    // Construct DistressTriageResult for system consistency
    const triageResult: DistressTriageResult = {
      detectedLanguage: language,
      originalText: transcript,
      englishTranslation: transcript,
      keySignals: [urgencyLabel, currentTriageLevel, 'Emergency En-Route'],
      triageLevel: currentTriageLevel === 'L1' ? 1 : 2,
      triageCategory: currentTriageLevel === 'L1' ? 'Immediate / Critical' : 'Urgent',
      urgencyReasoning: 'Emergency tactical distress transmitted from CareBridge HUD.',
      requiredSpecialties: ['Cath Lab', 'Trauma Resuscitation', 'Emergency ICU'],
      immediateFirstAidGuidance: [
        'Keep patient calm in semi-fowler seated position',
        'Loosen tight clothing around neck and chest',
        'Do not give solid food or liquids while transit is underway',
      ],
      safetyDisclaimer: 'Non-diagnostic tactical triage routing guidance.',
      sbar: {
        situation: transcript.replace(/"/g, ''),
        background: 'Acute distress reported via CareBridge Tactical HUD vector dispatch.',
        assessment: `${currentTriageLevel} ${urgencyLabel} en route to ${currentActiveHosp.name}`,
        recommendation: `Prep ER Bay and hold ${currentActiveHosp.specialty} bed immediately.`,
      },
      suggestedFacilityType: currentActiveHosp.name,
    };

    const targetHospObj = hospitals.find((h) => h.id === currentActiveHosp.hospitalRefId) || hospitals[0];
    onDispatchPatient({
      triageResult,
      hospital: targetHospObj,
      ambulanceDispatched: true,
    });

    setTimeout(() => {
      setIsTransmitting(false);
    }, 3000);
  };

  // Modify Hospital Resources from ER Desk
  const modifyResource = (type: 'icu' | 'o2', delta: number) => {
    SoundFX.beep(520, 0.05, 'triangle');
    setTacticalHospitals((prev) =>
      prev.map((h, i) => {
        if (i === 0) {
          const newIcu = type === 'icu' ? Math.max(0, h.icuBeds + delta) : h.icuBeds;
          const newO2 = type === 'o2' ? Math.max(0, h.o2Beds + delta) : h.o2Beds;
          
          onUpdateHospitalResources(h.hospitalRefId, {
            icuBedsAvailable: newIcu,
            oxygenBedsAvailable: newO2,
          });

          return { ...h, icuBeds: newIcu, o2Beds: newO2 };
        }
        return h;
      })
    );
  };

  const modifyBloodUnit = (delta: number) => {
    SoundFX.beep(520, 0.05, 'triangle');
    setTacticalHospitals((prev) =>
      prev.map((h, i) => (i === 0 ? { ...h, bloodOneg: Math.max(0, h.bloodOneg + delta) } : h))
    );
  };

  const acknowledgeBay = (id: string) => {
    SoundFX.beep(880, 0.1, 'sine');
    setErQueue((prev) => prev.filter((i) => i.id !== id));
    onUpdateDispatchStatus(id, 'Bed Reserved');
  };

  const simulateInboundEmergency = () => {
    SoundFX.sirenBurst();
    const newSos: ErQueueItem = {
      id: `CB-${Math.floor(2000 + Math.random() * 7000)}`,
      eta: '4m ETA',
      level: 'L1 CRITICAL',
      symptoms: 'Multi-vehicle RTA: Massive blood loss (O-Neg needed)',
      bedReserved: 'Trauma OT Ready',
      status: 'En-Route',
    };
    setErQueue((prev) => [newSos, ...prev]);
  };

  const shareTacticalGps = () => {
    SoundFX.beep(900, 0.1, 'sine');
    const text = encodeURIComponent(
      `🚨 EMERGENCY: Rushing patient to ${currentActiveHosp.name}. Live Radar GPS: https://maps.google.com/?q=28.6139,77.2090`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="bg-tactical-black text-slate-100 font-sans min-h-screen selection:bg-tactical-red selection:text-white antialiased overflow-x-hidden pb-12">
      
      {/* Audio unlock banner overlay for browser autoplay policies */}
      {audioBannerVisible && (
        <div
          id="audioInitBadge"
          onClick={() => {
            SoundFX.init();
            setAudioBannerVisible(false);
          }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 hud-glass px-4 py-1.5 rounded-full border border-tactical-cyan/40 text-[11px] font-mono text-tactical-cyan flex items-center gap-2 cursor-pointer shadow-xl animate-bounce"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>TAP ANYWHERE TO ACTIVATE TACTICAL AUDIO FX</span>
        </div>
      )}

      {/* Tactical Top Header */}
      <header className="sticky top-0 z-40 bg-tactical-black/90 backdrop-blur-md border-b border-tactical-border px-3 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 flex-wrap">
          
          {/* Brand & Mode Indicator */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-tactical-red text-white shadow-lg shadow-tactical-red/40 font-black">
              <Cross className="w-5 h-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-tactical-emerald rounded-full border-2 border-tactical-black"></span>
            </div>
            <div className="leading-none">
              <span className="font-hud text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                CareBridge{' '}
                <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-tactical-red/20 text-tactical-red border border-tactical-red/40">
                  HUD v3.4
                </span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">EMERGENCY DISPATCH OS</span>
            </div>
          </div>

          {/* Mode Switcher Pill (Patient vs ER Desk) */}
          <div className="bg-tactical-surface p-1 rounded-xl border border-tactical-border flex items-center shadow-inner">
            <button
              id="tabPatient"
              onClick={() => {
                SoundFX.beep(700, 0.05, 'sine');
                setHudMode('patient');
              }}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-hud font-bold flex items-center gap-1.5 transition-all ${
                hudMode === 'patient'
                  ? 'bg-tactical-red text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span className="hidden sm:inline">SOS DISTRESS</span>
              <span className="sm:hidden">SOS</span>
            </button>
            <button
              id="tabDesk"
              onClick={() => {
                SoundFX.beep(700, 0.05, 'sine');
                setHudMode('desk');
              }}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-hud font-bold flex items-center gap-1.5 transition-all relative ${
                hudMode === 'desk'
                  ? 'bg-tactical-red text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ER COMMAND DESK</span>
              <span className="sm:hidden">ER DESK</span>
              <span
                id="badgeErCount"
                className="w-4 h-4 rounded-full bg-tactical-red/40 text-tactical-red font-mono text-[10px] font-bold flex items-center justify-center"
              >
                {erQueue.length}
              </span>
            </button>
          </div>

          {/* View Switchers to Live Demo Loop & PM Spec */}
          {onSwitchView && (
            <div className="hidden md:flex items-center gap-1 bg-tactical-surface p-1 rounded-xl border border-tactical-border">
              <button
                onClick={() => onSwitchView('split_live_loop')}
                title="Open Dual Split Demo Loop"
                className="px-2.5 py-1 rounded text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1"
              >
                <SplitSquareVertical className="w-3.5 h-3.5 text-tactical-amber" />
                <span>Live Loop</span>
              </button>
              <button
                onClick={() => onSwitchView('pm_spec')}
                title="View PM Specification"
                className="px-2.5 py-1 rounded text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5 text-tactical-cyan" />
                <span>PM Spec</span>
              </button>
            </div>
          )}

          {/* Quick Language Selector Pills */}
          <div className="flex items-center gap-1 bg-tactical-surface p-1 rounded-xl border border-tactical-border">
            {(
              [
                { code: 'en', label: 'EN' },
                { code: 'hi', label: 'हिं' },
                { code: 'ta', label: 'தமி' },
                { code: 'te', label: 'తెలు' },
                { code: 'mr', label: 'मरा' },
              ] as const
            ).map((lang) => (
              <button
                key={lang.code}
                id={`lang_${lang.code}`}
                onClick={() => {
                  SoundFX.beep(800, 0.04, 'sine');
                  setLanguage(lang.code);
                }}
                className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition-all ${
                  language === lang.code
                    ? 'bg-slate-700 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                } ${['ta', 'te', 'mr'].includes(lang.code) ? 'hidden sm:block' : ''}`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ultra-Clean Non-Diagnostic Safety HUD Strip */}
        <div className="max-w-7xl mx-auto mt-2 flex items-center justify-between text-[11px] font-mono bg-tactical-amber/10 text-tactical-amber border border-tactical-amber/30 px-3 py-1 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-3.5 h-3.5 text-tactical-amber shrink-0 animate-pulse" />
            <span id="lblSafetyBanner">
              {language === 'hi'
                ? 'आपातकालीन नेविगेटर • केवल तात्कालिकता मार्गदर्शन • गैर-निदान'
                : 'TACTICAL NAVIGATOR ONLY • NON-DIAGNOSTIC TRIAGE GUIDANCE'}
            </span>
          </div>
          <span className="hidden md:inline font-bold tracking-wider text-[10px] bg-tactical-amber/20 px-1.5 py-0.5 rounded">
            IEC-62304 COMPLIANT
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4">
        
        {/* VIEW 1: PATIENT SOS DISTRESS VIEW */}
        {hudMode === 'patient' && (
          <div id="viewPatient" className="space-y-4">
            
            {/* TOP GRID: Hero Central SOS Dial + Tactical Quick Symptom Chips */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

              {/* Central Giant Interactive SOS / Audio Visualizer Core (7 cols) */}
              <div className="lg:col-span-7 hud-glass rounded-2xl p-5 border border-tactical-border relative overflow-hidden flex flex-col items-center justify-between min-h-[380px]">
                
                {/* Tactical HUD Corner Accents */}
                <div className="absolute top-2 left-2 text-[9px] font-mono text-slate-500">
                  SYS.LOC // 28.6139° N, 77.2090° E
                </div>
                <div className="absolute top-2 right-2 text-[9px] font-mono text-tactical-emerald flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-tactical-emerald animate-ping"></span> BHASHINI ASR READY
                </div>

                {/* Realtime Audio Visualizer Canvas Strip */}
                <div className="w-full h-12 flex items-center justify-center mt-4">
                  <canvas
                    ref={canvasRef}
                    id="waveformCanvas"
                    width={360}
                    height={44}
                    className="w-full max-w-sm rounded-lg opacity-80"
                  />
                </div>

                {/* Dynamic Mic Status & Permission Indicator */}
                <div className="w-full flex items-center justify-center my-1">
                  {micStatus === 'listening' && (
                    <div className="bg-tactical-red/20 border border-tactical-red/40 px-3 py-1 rounded-full text-xs font-mono text-tactical-red flex items-center gap-2 animate-pulse shadow-lg shadow-tactical-red/20">
                      <span className="w-2.5 h-2.5 rounded-full bg-tactical-red animate-ping" />
                      <span className="font-bold">LISTENING // SPEAK CLEARLY ({language.toUpperCase()} - {LANGUAGE_LOCALE_MAP[language]})</span>
                    </div>
                  )}

                  {micStatus === 'requesting' && (
                    <div className="bg-tactical-amber/20 border border-tactical-amber/40 px-3 py-1 rounded-full text-xs font-mono text-tactical-amber flex items-center gap-2 animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>INITIALIZING MICROPHONE HARDWARE...</span>
                    </div>
                  )}

                  {micStatus === 'analyzing' && (
                    <div className="bg-tactical-cyan/20 border border-tactical-cyan/40 px-3 py-1 rounded-full text-xs font-mono text-tactical-cyan flex items-center gap-2 animate-pulse">
                      <Sparkles className="w-3.5 h-3.5 animate-spin text-tactical-cyan" />
                      <span>GEMINI TRIAGE RUNNING // ROUTING TO GOLDEN HOUR BAY...</span>
                    </div>
                  )}

                  {micErrorMessage && (
                    <div className="bg-rose-950/70 border border-rose-500/50 px-3 py-1.5 rounded-xl text-xs font-mono text-rose-300 flex items-center justify-between gap-2 max-w-md w-full">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span className="text-[11px] leading-tight">{micErrorMessage}</span>
                      </div>
                      <button
                        onClick={() => setShowManualInput(true)}
                        className="px-2 py-1 bg-rose-800 hover:bg-rose-700 text-white rounded text-[10px] font-bold shrink-0 shadow"
                      >
                        Type Text
                      </button>
                    </div>
                  )}

                  {!isListening && !micErrorMessage && micStatus === 'idle' && (
                    <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                      <Radio className="w-3 h-3 text-tactical-cyan" />
                      <span>Voice ASR supports Hinglish, Hindi, Tamil, Telugu, Marathi & English</span>
                    </div>
                  )}
                </div>

                {/* Giant Central Tactile Dial Button */}
                <div className="relative my-3 flex items-center justify-center">
                  
                  {/* Radiating sonar waves when active */}
                  <div
                    id="beaconRing1"
                    className={`absolute w-48 h-48 rounded-full border-2 border-tactical-red/50 pointer-events-none transition-all ${
                      isListening ? 'animate-ping opacity-100' : 'opacity-0'
                    }`}
                  />
                  <div
                    id="beaconRing2"
                    className={`absolute w-60 h-60 rounded-full border border-tactical-red/30 pointer-events-none transition-all ${
                      isListening ? 'opacity-100' : 'opacity-0'
                    }`}
                  />

                  <button
                    id="btnCentralSOS"
                    onClick={toggleDistressVoice}
                    className={`relative z-10 w-36 h-36 sm:w-44 sm:h-44 rounded-full text-white flex flex-col items-center justify-center shadow-2xl transform active:scale-90 hover:scale-105 transition-all duration-200 border-4 group ${
                      isListening 
                        ? 'bg-gradient-to-tr from-red-600 via-rose-600 to-red-500 hud-glow-red border-white animate-pulse' 
                        : 'bg-gradient-to-tr from-rose-700 via-tactical-red to-red-500 hud-glow-red border-rose-400/40'
                    }`}
                  >
                    {isListening ? (
                      <Radio className="w-12 h-12 sm:w-16 sm:h-16 text-white animate-bounce" />
                    ) : (
                      <Mic className="w-12 h-12 sm:w-16 sm:h-16 text-white group-hover:scale-110 transition-transform" />
                    )}
                    <span id="lblSosAction" className="font-hud text-xs sm:text-sm font-black tracking-wider uppercase mt-1">
                      {isListening ? 'TAP TO SEND' : 'HOLD / TAP'}
                    </span>
                    <span id="lblSosSub" className="text-[9px] font-mono tracking-widest text-rose-200 uppercase">
                      {isListening ? 'RECORDING VOICE' : 'VOICE DISTRESS'}
                    </span>
                  </button>
                </div>

                {/* Dynamic Speech Transcript Strip with Edit / Keyboard Toggle */}
                <div className="w-full space-y-2">
                  <div className="w-full bg-tactical-surface/90 border border-tactical-border rounded-xl p-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                      <Speech className="w-4 h-4 text-tactical-red shrink-0" />
                      <p id="txtRealtimeTranscript" className="font-mono text-xs text-slate-200 truncate">
                        {speechInterimText ? (
                          <span className="text-tactical-amber font-semibold">{speechInterimText} ...</span>
                        ) : (
                          transcript
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setShowManualInput((prev) => !prev)}
                        title="Type symptoms manually"
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono flex items-center gap-1 border border-slate-700"
                      >
                        <Keyboard className="w-3 h-3 text-tactical-cyan" />
                        <span className="hidden sm:inline">Type</span>
                      </button>
                      <span
                        id="tagDetectedLang"
                        className="text-[10px] font-mono font-bold bg-tactical-red/20 text-tactical-red border border-tactical-red/30 px-2 py-0.5 rounded"
                      >
                        {detectedLangTag}
                      </span>
                    </div>
                  </div>

                  {/* Manual Type / Edit Input Box (Expands when clicked) */}
                  {showManualInput && (
                    <div className="bg-tactical-black/90 border border-tactical-border rounded-xl p-3 space-y-2 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span className="flex items-center gap-1">
                          <Keyboard className="w-3.5 h-3.5 text-tactical-cyan" />
                          <span>Type Symptoms / Medical Distress:</span>
                        </span>
                        <button
                          onClick={() => setShowManualInput(false)}
                          className="text-slate-500 hover:text-slate-300"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={manualInputText}
                          onChange={(e) => setManualInputText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              analyzeDistressVoice(manualInputText);
                              setShowManualInput(false);
                            }
                          }}
                          placeholder="e.g. Mere father ko chest pain hai aur breathing problem hai..."
                          className="flex-1 bg-tactical-surface border border-tactical-border rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-tactical-red"
                        />
                        <button
                          onClick={() => {
                            analyzeDistressVoice(manualInputText);
                            setShowManualInput(false);
                          }}
                          disabled={!manualInputText.trim() || isAiProcessing}
                          className="px-3 py-1.5 bg-tactical-red hover:bg-red-600 disabled:opacity-40 text-white rounded-lg text-xs font-hud font-bold flex items-center gap-1 shadow"
                        >
                          <Send className="w-3 h-3" />
                          <span>TRIAGE</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* AI Problem Auto-Analyzer Trigger */}
                  {onOpenAIAnalyzer && (
                    <button
                      id="tactical-btn-ai-auto-analyzer"
                      onClick={() => onOpenAIAnalyzer(transcript ? transcript.replace(/^"|"$/g, '') : undefined)}
                      className="w-full py-2 px-3.5 rounded-xl bg-gradient-to-r from-cyan-950/90 via-slate-900 to-blue-950/90 border border-cyan-500/50 hover:border-cyan-400 text-cyan-200 text-xs font-hud font-bold flex items-center justify-between shadow-lg shadow-cyan-950/40 transition-all active:scale-[0.99] group"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform animate-pulse" />
                        <span>✨ Auto-Analyze Problem by AI &amp; Suggest Best Hospitals</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        Need-Aware Match
                      </span>
                    </button>
                  )}

                  {/* Quick Voice Demo Presets */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-mono text-slate-400 scrollbar-none">
                    <span className="shrink-0 text-slate-500">Quick Test:</span>
                    <button
                      onClick={() =>
                        analyzeDistressVoice('Mere father ko saans lene mein dikkat ho rahi hai aur chest pain hai')
                      }
                      className="px-2 py-0.5 bg-tactical-surface hover:bg-slate-800 rounded border border-tactical-border text-slate-300 whitespace-nowrap hover:border-tactical-red"
                    >
                      🫀 Hinglish Cardiac
                    </button>
                    <button
                      onClick={() =>
                        analyzeDistressVoice('Highway bike accident, arterial thigh bleeding and losing consciousness')
                      }
                      className="px-2 py-0.5 bg-tactical-surface hover:bg-slate-800 rounded border border-tactical-border text-slate-300 whitespace-nowrap hover:border-tactical-red"
                    >
                      💥 English Trauma
                    </button>
                    <button
                      onClick={() =>
                        analyzeDistressVoice('என் பாட்டிக்கு பேச்சு குளறுகிறது, முகம் ஒரு பக்கமாக சாய்ந்துள்ளது')
                      }
                      className="px-2 py-0.5 bg-tactical-surface hover:bg-slate-800 rounded border border-tactical-border text-slate-300 whitespace-nowrap hover:border-tactical-red"
                    >
                      🧠 Tamil Stroke
                    </button>
                    <button
                      onClick={() =>
                        analyzeDistressVoice('బాబుకు విపరీతమైన ఆస్తమా అటాక్ వచ్చింది, పెదవులు నీలంగా మారుతున్నాయి')
                      }
                      className="px-2 py-0.5 bg-tactical-surface hover:bg-slate-800 rounded border border-tactical-border text-slate-300 whitespace-nowrap hover:border-tactical-red"
                    >
                      🫁 Telugu Asthma
                    </button>
                  </div>
                </div>

              </div>

              {/* Right: Tactile Quick Symptom Chips & Urgency HUD Gauge (5 cols) */}
              <div className="lg:col-span-5 flex flex-col gap-4">

                {/* Minimal High-Impact Urgency Meter (HUD Telemetry) */}
                <div
                  id="hudUrgencyCard"
                  className={`hud-glass rounded-2xl p-4 border-2 transition-all duration-300 ${
                    currentTriageLevel === 'L1'
                      ? 'border-tactical-red hud-glow-red'
                      : 'border-tactical-amber hud-glow-amber'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase">
                      TRIAGE TELEMETRY
                    </span>
                    <span
                      id="hudTriageCode"
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow ${
                        currentTriageLevel === 'L1'
                          ? 'bg-tactical-red text-white'
                          : 'bg-tactical-amber text-tactical-black'
                      }`}
                    >
                      {triageCodeText}
                    </span>
                  </div>

                  {/* Visual Radial-Style Urgency Gauge */}
                  <div className="mt-3 flex items-center gap-4">
                    <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-800"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          id="urgencyGaugeFill"
                          className={`transition-all duration-700 ${
                            currentTriageLevel === 'L1' ? 'text-tactical-red' : 'text-tactical-amber'
                          }`}
                          strokeDasharray={currentTriageLevel === 'L1' ? '92, 100' : '60, 100'}
                          strokeLinecap="round"
                          strokeWidth="3.8"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                        <span id="hudLevelNumber" className="font-hud font-black text-2xl text-white">
                          {currentTriageLevel}
                        </span>
                        <span className="text-[8px] font-mono text-slate-400">
                          {currentTriageLevel === 'L1' ? 'CRITICAL' : 'URGENT'}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="text-sm font-hud font-extrabold text-white flex items-center gap-1.5" id="hudUrgencyLabel">
                        <span
                          className={`w-2 h-2 rounded-full animate-ping ${
                            currentTriageLevel === 'L1' ? 'bg-tactical-red' : 'bg-tactical-amber'
                          }`}
                        />
                        {urgencyLabel}
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
                        <span className="flex items-center gap-1">
                          <Navigation2 className="w-3.5 h-3.5 text-tactical-cyan" />{' '}
                          <strong id="hudTargetEta">{currentActiveHosp.eta.toUpperCase()}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />{' '}
                          <strong id="hudTargetDist">{currentActiveHosp.dist.toUpperCase()}</strong>
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-tactical-amber flex items-center gap-1 pt-1">
                        <CheckCircle className="w-3 h-3" />
                        <span id="hudFacilityReq">{facilityReq}</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* 1-Tap Visual Symptom Chips (Big Tactile Buttons, Minimal Words) */}
                <div className="hud-glass rounded-2xl p-4 border border-tactical-border flex-1 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase mb-2 block">
                    1-TAP VISUAL SYMPTOM INJECTION
                  </span>
                  
                  <div className="grid grid-cols-3 gap-2">
                    
                    {/* 1. Chest Pain */}
                    <button
                      onClick={() =>
                        injectSymptom('CHEST', 'L1', 'Severe Chest Pain & Radiating Left Arm Pain', 'Cardiac Cath Lab')
                      }
                      className="symptom-chip bg-tactical-surface hover:bg-tactical-card p-3 rounded-xl border border-tactical-border hover:border-tactical-red transition-all flex flex-col items-center justify-center gap-1 active:scale-95 group"
                    >
                      <span className="text-2xl group-hover:scale-125 transition-transform">🫀</span>
                      <span className="text-[11px] font-hud font-bold text-slate-200">Chest Pain</span>
                      <span className="text-[8px] font-mono text-tactical-red font-bold">L1 CRITICAL</span>
                    </button>

                    {/* 2. Breathless */}
                    <button
                      onClick={() =>
                        injectSymptom('BREATH', 'L1', 'Acute Respiratory Distress & Low SpO2', 'Ventilator / Oxygen Bay')
                      }
                      className="symptom-chip bg-tactical-surface hover:bg-tactical-card p-3 rounded-xl border border-tactical-border hover:border-tactical-red transition-all flex flex-col items-center justify-center gap-1 active:scale-95 group"
                    >
                      <span className="text-2xl group-hover:scale-125 transition-transform">🫁</span>
                      <span className="text-[11px] font-hud font-bold text-slate-200">Breathless</span>
                      <span className="text-[8px] font-mono text-tactical-red font-bold">L1 CRITICAL</span>
                    </button>

                    {/* 3. Severe Trauma */}
                    <button
                      onClick={() =>
                        injectSymptom('TRAUMA', 'L1', 'Massive Hemorrhage / RTA Collision', 'Level-1 Trauma OT')
                      }
                      className="symptom-chip bg-tactical-surface hover:bg-tactical-card p-3 rounded-xl border border-tactical-border hover:border-tactical-red transition-all flex flex-col items-center justify-center gap-1 active:scale-95 group"
                    >
                      <span className="text-2xl group-hover:scale-125 transition-transform">🩸</span>
                      <span className="text-[11px] font-hud font-bold text-slate-200">Trauma Bleed</span>
                      <span className="text-[8px] font-mono text-tactical-red font-bold">L1 CRITICAL</span>
                    </button>

                    {/* 4. Stroke / Faint */}
                    <button
                      onClick={() =>
                        injectSymptom('STROKE', 'L1', 'Facial Droop, Slurred Speech, Sudden Faint', 'Stroke Center CT')
                      }
                      className="symptom-chip bg-tactical-surface hover:bg-tactical-card p-3 rounded-xl border border-tactical-border hover:border-tactical-amber transition-all flex flex-col items-center justify-center gap-1 active:scale-95 group"
                    >
                      <span className="text-2xl group-hover:scale-125 transition-transform">⚡</span>
                      <span className="text-[11px] font-hud font-bold text-slate-200">Stroke / Faint</span>
                      <span className="text-[8px] font-mono text-tactical-amber font-bold">L2 URGENT</span>
                    </button>

                    {/* 5. Pediatric Fever */}
                    <button
                      onClick={() =>
                        injectSymptom('PEDIATRIC', 'L2', 'High Convulsive Fever in Child', 'Pediatric ICU')
                      }
                      className="symptom-chip bg-tactical-surface hover:bg-tactical-card p-3 rounded-xl border border-tactical-border hover:border-tactical-amber transition-all flex flex-col items-center justify-center gap-1 active:scale-95 group"
                    >
                      <span className="text-2xl group-hover:scale-125 transition-transform">👶</span>
                      <span className="text-[11px] font-hud font-bold text-slate-200">Child Fever</span>
                      <span className="text-[8px] font-mono text-tactical-amber font-bold">L2 URGENT</span>
                    </button>

                    {/* 6. Labor / Maternity */}
                    <button
                      onClick={() =>
                        injectSymptom('MATERNITY', 'L2', 'Active Contractions / Labor Waters Broken', 'Maternity Emergency')
                      }
                      className="symptom-chip bg-tactical-surface hover:bg-tactical-card p-3 rounded-xl border border-tactical-border hover:border-tactical-cyan transition-all flex flex-col items-center justify-center gap-1 active:scale-95 group"
                    >
                      <span className="text-2xl group-hover:scale-125 transition-transform">🤰</span>
                      <span className="text-[11px] font-hud font-bold text-slate-200">Labor SOS</span>
                      <span className="text-[8px] font-mono text-tactical-cyan font-bold">L2 URGENT</span>
                    </button>

                  </div>

                  {/* Instant Dual Call & WhatsApp Location Actions */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-tactical-border">
                    <button
                      onClick={() => {
                        SoundFX.sirenBurst();
                        setShowSosModal(true);
                      }}
                      className="bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-hud font-extrabold text-xs py-3 px-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-tactical-red/30 active:scale-95 transition-all"
                    >
                      <PhoneCall className="w-4 h-4 animate-bounce" />
                      <span>CALL 108 / 112</span>
                    </button>

                    <button
                      onClick={shareTacticalGps}
                      className="bg-tactical-emerald hover:bg-emerald-500 text-tactical-black font-hud font-black text-xs py-3 px-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                      <Send className="w-4 h-4" />
                      <span>ALERT FAMILY</span>
                    </button>
                  </div>

                </div>

              </div>

            </div>

            {/* Tactical Map & Vector Routing Section */}
            <div className="hud-glass rounded-2xl p-4 sm:p-5 border border-tactical-border">
              
              {/* Section Header HUD */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-tactical-cyan animate-ping"></span>
                  <h3 className="font-hud font-bold text-sm sm:text-base text-white tracking-wide">
                    LIVE TACTICAL RADAR & VECTOR ROUTING
                  </h3>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-slate-400">AMBULANCE BEACON:</span>
                  <span id="lblBeaconSpeed" className="text-tactical-emerald font-bold">
                    48 KM/H [ACTIVE EN ROUTE]
                  </span>
                </div>
              </div>

              {/* Interactive Tactical Map & Radar Area */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* Tactical Canvas Radar Grid (7 cols) */}
                <div className="lg:col-span-7 bg-tactical-surface rounded-xl border border-tactical-border relative h-80 sm:h-96 overflow-hidden flex items-center justify-center shadow-inner">
                  
                  {/* Background Radial Radar Rings */}
                  <div className="absolute w-44 h-44 rounded-full border border-slate-800/80 pointer-events-none" />
                  <div className="absolute w-72 h-72 rounded-full border border-slate-800/60 pointer-events-none" />
                  <div className="absolute w-96 h-96 rounded-full border border-slate-800/40 pointer-events-none" />

                  {/* Rotating Sonar Sweep Line */}
                  <div className="absolute w-96 h-96 rounded-full pointer-events-none animate-sonar-sweep origin-center flex items-center justify-center">
                    <div className="w-1/2 h-0.5 bg-gradient-to-r from-transparent to-tactical-cyan/40 ml-auto" />
                  </div>

                  {/* Vector Map SVG Layer */}
                  <svg className="w-full h-full absolute inset-0 grid-mesh" viewBox="0 0 500 360">
                    {/* Road network tracks */}
                    <path
                      d="M 40,180 Q 180,160 260,200 T 460,140"
                      fill="none"
                      stroke="#1E2D4A"
                      strokeWidth="14"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 180,40 L 200,320"
                      fill="none"
                      stroke="#1E2D4A"
                      strokeWidth="10"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 340,30 L 320,330"
                      fill="none"
                      stroke="#1E2D4A"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />

                    {/* Active Dynamic Glowing Polyline */}
                    <path
                      id="radarRouteLine"
                      d={routePathD}
                      fill="none"
                      stroke="#FF1744"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray="8 6"
                      className="animate-dash-move"
                    />

                    {/* User Distress GPS Marker */}
                    <g transform="translate(90, 210)" className="cursor-pointer">
                      <circle r="18" fill="#FF1744" opacity="0.3" className="animate-beacon-ping" />
                      <circle r="10" fill="#FF1744" />
                      <circle r="4" fill="#FFFFFF" />
                      <text
                        x="-25"
                        y="24"
                        fill="#FF80AB"
                        fontFamily="'JetBrains Mono'"
                        fontSize="9"
                        fontWeight="bold"
                      >
                        YOU [SOS]
                      </text>
                    </g>

                    {/* Hospital 1 (Apex Trauma - AI Target) */}
                    <g
                      id="svgHosp1"
                      onClick={() => selectRadarHospital(1)}
                      className="interactive-blip cursor-pointer group"
                      transform="translate(410, 130)"
                    >
                      <circle r="20" fill="#FF1744" opacity="0.25" className="animate-pulse" />
                      <circle r="13" fill="#FF1744" stroke="#FFFFFF" strokeWidth="2" />
                      <text
                        x="-4"
                        y="4"
                        fill="#FFFFFF"
                        fontSize="11"
                        fontWeight="bold"
                        fontFamily="'Plus Jakarta Sans'"
                      >
                        H
                      </text>
                      <rect
                        x="-65"
                        y="-34"
                        width="130"
                        height="22"
                        rx="6"
                        fill="#0B111E"
                        stroke="#FF1744"
                        strokeWidth="1.5"
                      />
                      <text
                        x="-58"
                        y="-20"
                        fill="#FFFFFF"
                        fontSize="9"
                        fontFamily="'Space Grotesk'"
                        fontWeight="bold"
                      >
                        ★ APEX TRAUMA [7m]
                      </text>
                    </g>

                    {/* Hospital 2 (Metro Life) */}
                    <g
                      id="svgHosp2"
                      onClick={() => selectRadarHospital(2)}
                      className="interactive-blip cursor-pointer"
                      transform="translate(190, 80)"
                    >
                      <circle r="11" fill="#00E5FF" stroke="#FFFFFF" strokeWidth="1.5" />
                      <text x="-4" y="4" fill="#FFFFFF" fontSize="10" fontWeight="bold">
                        H
                      </text>
                      <text x="-32" y="-12" fill="#94A3B8" fontSize="8" fontFamily="'JetBrains Mono'">
                        METRO (12m)
                      </text>
                    </g>

                    {/* Hospital 3 (Sanjeevani Blood Bank) */}
                    <g
                      id="svgHosp3"
                      onClick={() => selectRadarHospital(3)}
                      className="interactive-blip cursor-pointer"
                      transform="translate(320, 280)"
                    >
                      <circle r="11" fill="#00E676" stroke="#FFFFFF" strokeWidth="1.5" />
                      <text x="-4" y="4" fill="#FFFFFF" fontSize="10" fontWeight="bold">
                        H
                      </text>
                      <text x="-36" y="22" fill="#94A3B8" fontSize="8" fontFamily="'JetBrains Mono'">
                        SANJEEVANI (16m)
                      </text>
                    </g>

                    {/* Dynamic Animated Ambulance Beacon moving on vector */}
                    <g id="ambulanceBeacon" transform={`translate(${ambPos.x}, ${ambPos.y})`}>
                      <circle r="7" fill="#00E676" stroke="#FFFFFF" strokeWidth="1.5" className="animate-ping" />
                      <circle r="5" fill="#00E676" />
                    </g>
                  </svg>

                  {/* Bottom Tactical Status Tape on Map */}
                  <div className="absolute bottom-2 left-2 right-2 bg-tactical-black/90 backdrop-blur border border-tactical-border px-3 py-1.5 rounded-lg flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">
                      TARGET: <strong id="lblActiveTargetName" className="text-white">{currentActiveHosp.name}</strong>
                    </span>
                    <span className="text-tactical-cyan font-bold">TELEMETRY: STABLE</span>
                  </div>

                </div>

                {/* Tactile Hospital Cards & Live Inventory Dialers (5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-2.5 overflow-y-auto max-h-96 pr-1">
                  {tacticalHospitals.map((h) => {
                    const isSelected = h.id === activeHospitalId;
                    return (
                      <div
                        key={h.id}
                        onClick={() => selectRadarHospital(h.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-tactical-card border-tactical-red hud-glow-red'
                            : 'bg-tactical-surface/80 border-tactical-border hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-hud font-bold text-xs text-white">{h.name}</span>
                            {h.isAiTarget && (
                              <span className="bg-tactical-red text-white text-[8px] font-mono font-bold px-1.5 py-0.2 rounded">
                                ★ TOP MATCH
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-xs text-tactical-red font-bold">{h.eta}</span>
                        </div>

                        {/* Tactile Badges & Live Counters */}
                        <div className="grid grid-cols-3 gap-1.5 mt-2 text-[10px] font-mono">
                          <div className="bg-tactical-black p-1.5 rounded border border-tactical-border flex items-center justify-between">
                            <span className="text-slate-400">🛏️ ICU:</span>
                            <strong className={h.icuBeds > 0 ? 'text-tactical-red' : 'text-slate-500'}>
                              {h.icuBeds}
                            </strong>
                          </div>
                          <div className="bg-tactical-black p-1.5 rounded border border-tactical-border flex items-center justify-between">
                            <span className="text-slate-400">💨 O₂:</span>
                            <strong className="text-tactical-cyan">{h.o2Beds}</strong>
                          </div>
                          <div className="bg-tactical-black p-1.5 rounded border border-tactical-border flex items-center justify-between">
                            <span className="text-slate-400">🩸 O-:</span>
                            <strong className="text-tactical-amber">{h.bloodOneg}u</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* Bottom En-Route Emergency Handshake Transmission Bar */}
              <div className="mt-4 pt-3 border-t border-tactical-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-tactical-surface/70 p-3 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-tactical-red/20 text-tactical-red border border-tactical-red/40 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-hud font-bold text-white">EN-ROUTE EMERGENCY HANDSHAKE</span>
                      <span className="text-[9px] font-mono bg-tactical-red text-white px-1.5 py-0.2 rounded">
                        1-TAP TRANSMIT
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Dispatches SBAR patient intake telemetry directly to the ER Bay screen.
                    </p>
                  </div>
                </div>

                <button
                  onClick={transmitEmergencyHandshake}
                  id="btnTransmitHandshake"
                  className={`w-full sm:w-auto font-hud font-black text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all shrink-0 ${
                    isTransmitting
                      ? 'bg-tactical-emerald text-tactical-black shadow-emerald-500/30'
                      : 'bg-gradient-to-r from-tactical-red to-rose-600 hover:from-rose-500 hover:to-red-500 text-white shadow-tactical-red/30'
                  }`}
                >
                  {isTransmitting ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>TRANSMITTED TO ER!</span>
                    </>
                  ) : (
                    <>
                      <RadioTower className="w-4 h-4" />
                      <span>TRANSMIT SBAR TO ER DESK</span>
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>
        )}

        {/* VIEW 2: ER COMMAND DESK VIEW */}
        {hudMode === 'desk' && (
          <div id="viewDesk" className="space-y-4">
            
            {/* Top Command HUD: Live Bed Management & Blood Units */}
            <div className="hud-glass rounded-2xl p-5 border border-tactical-border">
              
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-tactical-red/20 border border-tactical-red/40 text-tactical-red flex items-center justify-center">
                    <Activity className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="font-hud text-base sm:text-lg font-black text-white">
                      APEX MULTI-SPECIALTY ER DESK
                    </h2>
                    <span className="text-[10px] font-mono text-tactical-emerald flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-tactical-emerald animate-ping"></span> RADAR RECEIVER LINK ACTIVE
                    </span>
                  </div>
                </div>

                {/* Rapid Test Trigger */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={simulateInboundEmergency}
                    className="bg-tactical-surface hover:bg-tactical-card text-slate-200 border border-tactical-border text-xs font-mono px-3 py-2 rounded-xl flex items-center gap-1.5 active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 text-tactical-red" />
                    <span>SIMULATE INCOMING SOS</span>
                  </button>
                </div>
              </div>

              {/* Tactile Resource Dialers / Live Steppers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-tactical-border">
                
                {/* ICU Stepper */}
                <div className="bg-tactical-black/80 p-3.5 rounded-xl border border-tactical-border flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block">LIVE ICU BEDS</span>
                    <span id="deskIcuCount" className="font-hud font-black text-2xl text-tactical-red">
                      {tacticalHospitals[0].icuBeds}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 block">Ventilators ready</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => modifyResource('icu', -1)}
                      className="w-9 h-9 rounded-lg bg-tactical-surface hover:bg-slate-800 text-white font-mono font-bold flex items-center justify-center text-lg active:scale-95"
                    >
                      -
                    </button>
                    <button
                      onClick={() => modifyResource('icu', 1)}
                      className="w-9 h-9 rounded-lg bg-tactical-surface hover:bg-slate-800 text-white font-mono font-bold flex items-center justify-center text-lg active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Oxygen Beds Stepper */}
                <div className="bg-tactical-black/80 p-3.5 rounded-xl border border-tactical-border flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block">OXYGEN BEDS</span>
                    <span id="deskO2Count" className="font-hud font-black text-2xl text-tactical-cyan">
                      {tacticalHospitals[0].o2Beds}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 block">High-flow ports</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => modifyResource('o2', -1)}
                      className="w-9 h-9 rounded-lg bg-tactical-surface hover:bg-slate-800 text-white font-mono font-bold flex items-center justify-center text-lg active:scale-95"
                    >
                      -
                    </button>
                    <button
                      onClick={() => modifyResource('o2', 1)}
                      className="w-9 h-9 rounded-lg bg-tactical-surface hover:bg-slate-800 text-white font-mono font-bold flex items-center justify-center text-lg active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Blood Bank Quick Units */}
                <div className="bg-tactical-black/80 p-3.5 rounded-xl border border-tactical-border flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block">O-NEG BLOOD BANK</span>
                    <span id="deskOnegCount" className="font-hud font-black text-2xl text-tactical-amber">
                      {tacticalHospitals[0].bloodOneg} Units
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 block">Universal Donor</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => modifyBloodUnit(-1)}
                      className="w-9 h-9 rounded-lg bg-tactical-surface hover:bg-slate-800 text-white font-mono font-bold flex items-center justify-center text-lg active:scale-95"
                    >
                      -
                    </button>
                    <button
                      onClick={() => modifyBloodUnit(1)}
                      className="w-9 h-9 rounded-lg bg-tactical-surface hover:bg-slate-800 text-white font-mono font-bold flex items-center justify-center text-lg active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* Live Incoming Emergency Intake Stream */}
            <div className="hud-glass rounded-2xl p-5 border border-tactical-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-hud font-bold text-white tracking-wider uppercase">
                  INCOMING TRIAGE QUEUE (EN-ROUTE TELEMETRY)
                </span>
                <span className="text-[10px] font-mono text-tactical-red animate-pulse">
                  ● LIVE QUEUE MONITOR
                </span>
              </div>

              <div id="erQueueList" className="space-y-3">
                {erQueue.map((item) => (
                  <div
                    key={item.id}
                    className="bg-tactical-black p-3.5 rounded-xl border border-tactical-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white">{item.id}</span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded font-bold bg-tactical-red/20 text-tactical-red border border-tactical-red/40">
                          {item.level}
                        </span>
                        <span className="text-xs font-mono font-bold text-tactical-cyan">
                          ⏳ {item.eta}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 font-medium">{item.symptoms}</p>
                      <div className="text-[10px] font-mono text-tactical-emerald flex items-center gap-1">
                        <span>✓ {item.bedReserved}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => acknowledgeBay(item.id)}
                      className="bg-tactical-surface hover:bg-tactical-card text-slate-200 border border-tactical-border hover:border-tactical-emerald text-xs font-mono font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all self-end sm:self-center"
                    >
                      CLEAR & PREP BAY
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Emergency Hotline 108 / 112 Modal Simulation */}
      {showSosModal && (
        <div
          id="modalSOS"
          className="fixed inset-0 z-50 bg-tactical-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="hud-glass rounded-3xl max-w-sm w-full p-6 text-center border-2 border-tactical-red hud-glow-red relative">
            <div className="w-20 h-20 rounded-full bg-tactical-red/20 text-tactical-red border border-tactical-red/50 flex items-center justify-center mx-auto mb-3 animate-pulse">
              <PhoneCall className="w-10 h-10" />
            </div>
            <h3 className="font-hud text-xl font-black text-white">DISPATCHING 108 / 112</h3>
            <p className="text-xs font-mono text-slate-300 mt-1">EMERGENCY PRIORITY CALL CONNECTED</p>
            
            <div className="my-4 bg-tactical-black p-3 rounded-xl border border-tactical-border font-mono text-xs text-left space-y-1">
              <div className="text-slate-400">
                GPS: <span className="text-white">28.6139° N, 77.2090° E</span>
              </div>
              <div className="text-slate-400">
                STATUS:{' '}
                <span className="text-tactical-emerald font-bold">
                  LINE OPEN • CREW ASSIGNED
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <a
                href="tel:108"
                onClick={() => {
                  SoundFX.sirenBurst();
                  setShowSosModal(false);
                }}
                className="w-full bg-tactical-red hover:bg-red-600 text-white font-mono text-xs py-2.5 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call 108 Ambulance</span>
              </a>

              <button
                onClick={() => setShowSosModal(false)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs py-2.5 rounded-xl font-bold transition-all"
              >
                DISMISS SIMULATION
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
