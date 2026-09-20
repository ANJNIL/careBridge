import React, { useState, useEffect } from 'react';
import { Hospital, IncomingEmergencyDispatch, EmergencySectionType } from '../../types';
import { SoundFX, speakFirstAidInstruction } from '../../utils/speech';
import { dialPhoneNumber, getPrimaryEmergencyContact, getStoredEmergencyContacts } from '../../utils/emergencyContacts';
import {
  EmergencySirenIllustration,
  RoadAccidentBannerIllustration,
  PregnancyCareBannerIllustration,
  RoadAccidentBadgeIcon,
  PregnancyBadgeIcon,
} from './EmergencyIllustrations';
import {
  PhoneCall,
  MapPin,
  Building2,
  Ambulance,
  ChevronRight,
  ArrowLeft,
  X,
  AlertCircle,
  Clock,
  ShieldCheck,
  Share2,
  Navigation,
  UserCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export type EmergencyFlowStep = 'hub' | 'road_accident' | 'pregnancy' | 'dispatched_accident' | 'dispatched_pregnancy';

interface SpecializedEmergencyHubProps {
  hospitals: Hospital[];
  onDispatchPatient?: (dispatchData: {
    triageResult: any;
    hospital: Hospital;
    ambulanceDispatched: boolean;
    specializedDispatch?: Partial<IncomingEmergencyDispatch>;
  }) => void;
  defaultSection?: EmergencySectionType | 'hub';
  onClose?: () => void;
  isCompact?: boolean;
}

export const SpecializedEmergencyHub: React.FC<SpecializedEmergencyHubProps> = ({
  hospitals,
  onDispatchPatient,
  defaultSection = 'hub',
  onClose,
  isCompact = false,
}) => {
  // Determine initial step
  const [currentStep, setCurrentStep] = useState<EmergencyFlowStep>(() => {
    if (defaultSection === 'road_accident') return 'road_accident';
    if (defaultSection === 'pregnancy') return 'pregnancy';
    return 'hub';
  });

  // Countdown timers for ambulance arriving
  const [accidentEtaSeconds, setAccidentEtaSeconds] = useState<number>(230); // 3m 50s
  const [pregnancyEtaSeconds, setPregnancyEtaSeconds] = useState<number>(265); // 4m 25s
  const [accidentAmbulanceDispatched, setAccidentAmbulanceDispatched] = useState<boolean>(false);
  const [pregnancyAmbulanceDispatched, setPregnancyAmbulanceDispatched] = useState<boolean>(false);

  // Active Dispatched Data
  const [activeDispatchToken, setActiveDispatchToken] = useState<string>('');
  const [showAdvancedTelemetry, setShowAdvancedTelemetry] = useState<boolean>(false);

  // Fallback / Matched target hospitals
  const traumaHospital = hospitals.find(
    (h) =>
      h.traumaLevel === 1 ||
      h.capabilities.some((c) => /trauma|surgical ot|emergency/i.test(c)) ||
      h.name.toLowerCase().includes('bombay') ||
      h.name.toLowerCase().includes('choithram')
  ) || hospitals[0];

  const maternityHospital = hospitals.find(
    (h) =>
      h.specialtiesTags?.some((t) => /maternity|nicu|child|obgyn/i.test(t)) ||
      h.capabilities.some((c) => /maternity|labour|nicu/i.test(c)) ||
      h.name.toLowerCase().includes('sanjeevani') ||
      h.name.toLowerCase().includes('choithram')
  ) || hospitals[0];

  // ETA countdown interval
  useEffect(() => {
    const timer = setInterval(() => {
      if (accidentAmbulanceDispatched) {
        setAccidentEtaSeconds((prev) => (prev > 15 ? prev - 1 : 15));
      }
      if (pregnancyAmbulanceDispatched) {
        setPregnancyEtaSeconds((prev) => (prev > 20 ? prev - 1 : 20));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [accidentAmbulanceDispatched, pregnancyAmbulanceDispatched]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Trigger Road Accident Dispatch
  const handleTriggerRoadAccident = () => {
    SoundFX.init();
    SoundFX.codeBlueAlarm();
    setAccidentAmbulanceDispatched(true);
    const token = `MLC-ACC-${Math.floor(1000 + Math.random() * 9000)}`;
    setActiveDispatchToken(token);
    setCurrentStep('dispatched_accident');

    const sbar = {
      situation: 'Critical Road Accident: Multi-trauma with potential fractures, severe bleeding and head impact.',
      background: 'Reported via CareBridge 1-Tap Road Accident Emergency Responder.',
      assessment: 'Level-1 Polytrauma requiring priority ALS resuscitation, spine stabilization, and Trauma ER clearance.',
      recommendation: 'Trauma ALS Ambulance dispatched. Police Thana and Trauma ER informed for green corridor clearance.',
    };

    if (onDispatchPatient && traumaHospital) {
      onDispatchPatient({
        triageResult: {
          triageLevel: 1,
          urgencyReasoning: 'Critical Road Traffic Accident with trauma emergency dispatch and hospital pre-clearance.',
          keySignals: ['Road Accident Trauma', 'Severe Bleeding / Fracture Risk', 'Trauma Resuscitation'],
          sbar,
        },
        hospital: traumaHospital,
        ambulanceDispatched: true,
        specializedDispatch: {
          emergencyCategory: 'road_accident',
          digitalHandshakeToken: token,
          ambulanceEtaMinutes: 4,
          policeStationNotification: {
            stationName: 'Palasia Police Station (Indore Commissionerate)',
            jurisdictionZone: 'East Zone Police Division',
            district: 'Indore City',
            accidentLocation: 'A.B. Road / Palasia Junction',
            gpsCoordinates: { lat: 22.7244, lng: 75.8839 },
            firIncidentDiaryNumber: `GD-ACC-${Math.floor(1000 + Math.random() * 9000)}/2026`,
            pcrPhone: '112 / +91 731 249 1100',
            sentAt: new Date().toLocaleTimeString(),
            status: 'PCR Van Dispatched',
            destinationHospitalSent: traumaHospital.name,
            destinationHospitalAddress: traumaHospital.address,
            casualtyMlcDeskToken: token,
          },
        },
      });
    }

    speakFirstAidInstruction(
      `Emergency road accident response activated. Nearest trauma hospital ${traumaHospital.name} notified. Ambulance arriving in 3 minutes. Keep the patient still and do not remove helmet if spinal injury is suspected.`,
      'en'
    );
  };

  // Trigger Pregnancy Case Dispatch
  const handleTriggerPregnancy = () => {
    SoundFX.init();
    SoundFX.sirenBurst();
    setPregnancyAmbulanceDispatched(true);
    const token = `NET-OBGYN-${Math.floor(1000 + Math.random() * 9000)}`;
    setActiveDispatchToken(token);
    setCurrentStep('dispatched_pregnancy');

    const sbar = {
      situation: 'Obstetric / Pregnancy Emergency: Active labour pains or sudden obstetric complications.',
      background: 'Reported via CareBridge Code Pink Maternity Emergency Portal.',
      assessment: 'Imminent obstetric delivery with priority Code Pink transit and trained onboard midwife.',
      recommendation: 'Reserve Delivery OT Bay and Neonatal Resuscitation Warmer at receiving maternity hospital.',
    };

    if (onDispatchPatient && maternityHospital) {
      onDispatchPatient({
        triageResult: {
          triageLevel: 1,
          urgencyReasoning: 'Emergency Obstetric Transit with Onboard Maternity Nurse and Hospital Net Pre-Clearance.',
          keySignals: ['Pregnancy Emergency', 'Active Labour', 'Fetal Distress Monitoring'],
          sbar,
        },
        hospital: maternityHospital,
        ambulanceDispatched: true,
        specializedDispatch: {
          emergencyCategory: 'pregnancy',
          digitalHandshakeToken: token,
          ambulanceEtaMinutes: 4,
          onboardNurse: {
            name: 'Sister Shalini Verma, RN, RM',
            designation: 'Senior Obstetric & Neonatal Resuscitation Nurse',
            badgeId: 'OBGYN-RN-4821',
            phone: '+91 731 475 1902',
            certifications: ['Advanced Midwifery & Obstetric Life Support (ALSO)', 'Neonatal Resuscitation Program (NRP)'],
            equipmentList: ['Sterile Childbirth Delivery Kit', 'Portable Fetal Doppler (140 bpm)', 'Neonatal Bag-Valve-Mask', 'Maternal IV Oxytocin Line'],
          },
        },
      });
    }

    speakFirstAidInstruction(
      `Code Pink Pregnancy Emergency activated. Maternity ambulance reaching in 4 minutes with trained onboard nurse Sister Shalini Verma. Destination labour suite pre-cleared at ${maternityHospital.name}.`,
      'en'
    );
  };

  const handleDialSos = (customNumber?: string) => {
    SoundFX.init();
    SoundFX.codeBlueAlarm();
    const primary = getPrimaryEmergencyContact(getStoredEmergencyContacts());
    const phone = customNumber || primary.phone || '112';
    dialPhoneNumber(phone);
  };

  const handleShareFamily = () => {
    const text = `🚨 EMERGENCY ALERT: ${
      currentStep.includes('accident') ? 'Road Accident' : 'Pregnancy Emergency'
    } reported. Ambulance dispatched to ${
      currentStep.includes('accident') ? traumaHospital.name : maternityHospital.name
    }. ER Token: ${activeDispatchToken || 'CB-EMERGENCY'}. Track at https://carebridge.health/live`;

    if (navigator.share) {
      navigator.share({
        title: 'Emergency Medical Alert',
        text,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert('Emergency message copied to clipboard! You can paste it in WhatsApp or SMS.');
    }
  };

  return (
    <div className="w-full max-w-[420px] mx-auto bg-white rounded-[32px] overflow-hidden shadow-2xl border border-[#e2e8f0] text-[#17324d] font-sans transition-all duration-300">
      {/* ========================================================================= */}
      {/* SCREEN 1: "What kind of emergency is it?" (Matching Image 3)             */}
      {/* ========================================================================= */}
      {currentStep === 'hub' && (
        <div className="p-6 sm:p-7 flex flex-col items-center animate-in fade-in duration-200">
          {/* Top Header */}
          <div className="w-full flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={onClose || (() => {})}
              className="p-1 -ml-1 text-[#17324d] hover:text-black transition-colors rounded-lg hover:bg-slate-100 flex items-center gap-2 font-bold text-lg"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-[#17324d] stroke-[2.5]" />
              <span className="text-[#0f2444] font-extrabold text-base sm:text-lg tracking-tight">Emergency</span>
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Centered Siren Beacon Illustration */}
          <div className="my-2 flex justify-center items-center">
            <EmergencySirenIllustration className="w-24 h-24 sm:w-28 sm:h-28" />
          </div>

          {/* Title & Subtitle */}
          <h1 className="text-xl sm:text-[22px] font-extrabold text-[#0f2444] text-center mt-2 leading-tight">
            What kind of emergency is it?
          </h1>
          <p className="text-xs sm:text-sm text-[#5a6e85] text-center mt-2 mb-6 max-w-[280px] leading-relaxed">
            Choose the option that fits your situation and get quick help.
          </p>

          {/* Emergency Option Cards */}
          <div className="w-full space-y-3.5">
            {/* 1. Road Accident Card */}
            <div
              id="card-select-road-accident"
              onClick={() => {
                SoundFX.tapTick();
                setCurrentStep('road_accident');
              }}
              className="w-full bg-[#fff1f1] hover:bg-[#ffebeb] active:scale-[0.98] transition-all rounded-[22px] p-3.5 sm:p-4 border border-[#fed7d7]/70 flex items-center justify-between cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="shrink-0 group-hover:scale-105 transition-transform">
                  <RoadAccidentBadgeIcon className="w-13 h-13" />
                </div>
                <div className="text-left">
                  <h3 className="font-extrabold text-[#dc2626] text-base leading-snug">
                    Road Accident
                  </h3>
                  <p className="text-xs text-[#4a5568] font-normal leading-tight mt-0.5">
                    Accident, injury, trauma
                  </p>
                </div>
              </div>
              <div className="text-[#dc2626] pr-1">
                <ChevronRight className="w-6 h-6 stroke-[2.5] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* 2. Pregnancy Case Card */}
            <div
              id="card-select-pregnancy"
              onClick={() => {
                SoundFX.tapTick();
                setCurrentStep('pregnancy');
              }}
              className="w-full bg-[#f8f5fe] hover:bg-[#f3edfd] active:scale-[0.98] transition-all rounded-[22px] p-3.5 sm:p-4 border border-[#e9d8fd]/70 flex items-center justify-between cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="shrink-0 group-hover:scale-105 transition-transform">
                  <PregnancyBadgeIcon className="w-13 h-13" />
                </div>
                <div className="text-left">
                  <h3 className="font-extrabold text-[#4c1d95] text-base leading-snug">
                    Pregnancy Case
                  </h3>
                  <p className="text-xs text-[#4a5568] font-normal leading-tight mt-0.5">
                    Labour pain, complications
                  </p>
                </div>
              </div>
              <div className="text-[#6d28d9] pr-1">
                <ChevronRight className="w-6 h-6 stroke-[2.5] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* 3. Cancel Card */}
            <div
              id="card-select-cancel"
              onClick={() => {
                SoundFX.tapTick();
                if (onClose) onClose();
              }}
              className="w-full bg-[#f8fafc] hover:bg-[#f1f5f9] active:scale-[0.98] transition-all rounded-[22px] p-3.5 sm:p-4 border border-[#e2e8f0] flex items-center justify-between cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-full bg-[#edf2f7] border border-[#e2e8f0] flex items-center justify-center shrink-0 text-[#718096] group-hover:scale-105 transition-transform">
                  <X className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div className="text-left">
                  <h3 className="font-extrabold text-[#2d3748] text-base leading-snug">
                    Cancel
                  </h3>
                  <p className="text-xs text-[#718096] font-normal leading-tight mt-0.5">
                    Go back to home
                  </p>
                </div>
              </div>
              <div className="text-[#a0aec0] pr-1">
                <ChevronRight className="w-6 h-6 stroke-[2.5] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 2: "Road Accident" (Matching Image 1)                             */}
      {/* ========================================================================= */}
      {currentStep === 'road_accident' && (
        <div className="p-5 sm:p-6 flex flex-col animate-in fade-in duration-200">
          {/* Top Bar with Back Arrow */}
          <div className="flex items-center justify-between mb-3.5">
            <button
              type="button"
              onClick={() => setCurrentStep('hub')}
              className="p-1 -ml-1 flex items-center gap-2 font-bold text-[#0f2444] hover:text-black transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#0f2444] stroke-[2.5]" />
              <span className="text-[#0f2444] font-extrabold text-base sm:text-lg tracking-tight">Road Accident</span>
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Hero Banner Illustration Card */}
          <div className="w-full rounded-[22px] overflow-hidden border border-[#e2e8f0] shadow-2xs mb-4 bg-[#e0f2fe]">
            <RoadAccidentBannerIllustration className="w-full h-44 sm:h-48" />
          </div>

          {/* Description Text */}
          <p className="text-[#17324d] font-semibold text-sm sm:text-[15px] leading-snug mb-3.5">
            We will help you find the nearest hospital and ambulance immediately.
          </p>

          {/* Warning Banner */}
          <div className="w-full bg-[#fff0f0] border border-[#fecaca]/80 rounded-2xl p-3.5 mb-3.5 flex items-start gap-3 text-left">
            <div className="w-5 h-5 rounded-full bg-[#ef4444] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              !
            </div>
            <p className="text-[#dc2626] font-bold text-xs sm:text-[13px] leading-tight">
              Please make sure you are in a safe place before proceeding.
            </p>
          </div>

          {/* Primary Red CTA Button */}
          <button
            id="btn-find-hospital-ambulance"
            type="button"
            onClick={handleTriggerRoadAccident}
            className="w-full bg-[#e5252a] hover:bg-[#d01c21] active:scale-[0.98] text-white rounded-2xl p-3.5 sm:p-4 font-extrabold text-sm sm:text-[15px] flex items-center justify-between shadow-lg shadow-red-600/20 transition-all cursor-pointer group mb-5"
          >
            <div className="flex items-center gap-3">
              <Ambulance className="w-5 h-5 text-white stroke-[2.2]" />
              <span>Find Nearest Hospital &amp; Ambulance</span>
            </div>
            <ChevronRight className="w-5 h-5 text-white stroke-[2.5] group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Quick Info Section */}
          <div className="w-full text-left mb-5">
            <h4 className="font-extrabold text-[#0f2444] text-sm sm:text-base mb-3 tracking-tight">
              Quick Info
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3.5 text-xs sm:text-[13px] text-[#2d3748] font-semibold">
                <MapPin className="w-4 h-4 text-[#1e3a8a] stroke-[2.5] shrink-0" />
                <span>Your location will be shared</span>
              </div>
              <div className="flex items-center gap-3.5 text-xs sm:text-[13px] text-[#2d3748] font-semibold">
                <Building2 className="w-4 h-4 text-[#1e3a8a] stroke-[2.5] shrink-0" />
                <span>Nearby trauma centres will be notified</span>
              </div>
              <div className="flex items-center gap-3.5 text-xs sm:text-[13px] text-[#2d3748] font-semibold">
                <Ambulance className="w-4 h-4 text-[#1e3a8a] stroke-[2.5] shrink-0" />
                <span>Ambulance will be dispatched</span>
              </div>
            </div>
          </div>

          {/* Bottom Card: Call SOS 112 */}
          <div
            id="card-call-sos-112-accident"
            onClick={() => handleDialSos('112')}
            className="w-full bg-[#f0f7ff] hover:bg-[#e4effd] border border-[#d0e4f7] rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-colors active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#0256b9] text-white flex items-center justify-center shrink-0 shadow-xs">
                <PhoneCall className="w-4 h-4 fill-white" />
              </div>
              <div className="text-left">
                <div className="text-[11px] text-[#4a5568] font-medium leading-none">Need to speak now?</div>
                <div className="text-sm font-extrabold text-[#0256b9] leading-snug mt-0.5">Call SOS 112</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#0256b9] stroke-[2.5]" />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 3: "Pregnancy Case" (Matching Image 2)                             */}
      {/* ========================================================================= */}
      {currentStep === 'pregnancy' && (
        <div className="p-5 sm:p-6 flex flex-col animate-in fade-in duration-200">
          {/* Top Bar with Back Arrow */}
          <div className="flex items-center justify-between mb-3.5">
            <button
              type="button"
              onClick={() => setCurrentStep('hub')}
              className="p-1 -ml-1 flex items-center gap-2 font-bold text-[#0f2444] hover:text-black transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#0f2444] stroke-[2.5]" />
              <span className="text-[#0f2444] font-extrabold text-base sm:text-lg tracking-tight">Pregnancy Case</span>
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Hero Banner Illustration Card */}
          <div className="w-full rounded-[22px] overflow-hidden border border-[#e2e8f0] shadow-2xs mb-4 bg-[#f5f3ff]">
            <PregnancyCareBannerIllustration className="w-full h-44 sm:h-48" />
          </div>

          {/* Description Text */}
          <p className="text-[#17324d] font-semibold text-sm sm:text-[15px] leading-snug mb-3.5">
            We will connect you to the nearest maternity hospital and ambulance for quick assistance.
          </p>

          {/* Warning Banner */}
          <div className="w-full bg-[#fff0f0] border border-[#fecaca]/80 rounded-2xl p-3.5 mb-3.5 flex items-start gap-3 text-left">
            <div className="w-5 h-5 rounded-full bg-[#ef4444] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              !
            </div>
            <p className="text-[#dc2626] font-bold text-xs sm:text-[13px] leading-tight">
              If you are in labour or facing severe pain, don't wait.
            </p>
          </div>

          {/* Primary Purple CTA Button */}
          <button
            id="btn-find-maternity-hospital"
            type="button"
            onClick={handleTriggerPregnancy}
            className="w-full bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] hover:from-[#6d28d9] hover:to-[#5b21b6] active:scale-[0.98] text-white rounded-2xl p-3.5 sm:p-4 font-extrabold text-sm sm:text-[15px] flex items-center justify-between shadow-lg shadow-purple-600/20 transition-all cursor-pointer group mb-5"
          >
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-white stroke-[2.2]" />
              <span>Find Nearest Maternity Hospital</span>
            </div>
            <ChevronRight className="w-5 h-5 text-white stroke-[2.5] group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Quick Info Section */}
          <div className="w-full text-left mb-5">
            <h4 className="font-extrabold text-[#0f2444] text-sm sm:text-base mb-3 tracking-tight">
              Quick Info
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3.5 text-xs sm:text-[13px] text-[#2d3748] font-semibold">
                <MapPin className="w-4 h-4 text-[#1e3a8a] stroke-[2.5] shrink-0" />
                <span>Your location will be shared</span>
              </div>
              <div className="flex items-center gap-3.5 text-xs sm:text-[13px] text-[#2d3748] font-semibold">
                <Building2 className="w-4 h-4 text-[#1e3a8a] stroke-[2.5] shrink-0" />
                <span>Nearest maternity hospitals will be notified</span>
              </div>
              <div className="flex items-center gap-3.5 text-xs sm:text-[13px] text-[#2d3748] font-semibold">
                <UserCheck className="w-4 h-4 text-[#1e3a8a] stroke-[2.5] shrink-0" />
                <span>Ambulance with trained staff will arrive</span>
              </div>
            </div>
          </div>

          {/* Bottom Card: Call SOS 112 */}
          <div
            id="card-call-sos-112-pregnancy"
            onClick={() => handleDialSos('112')}
            className="w-full bg-[#f0f7ff] hover:bg-[#e4effd] border border-[#d0e4f7] rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-colors active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#0256b9] text-white flex items-center justify-center shrink-0 shadow-xs">
                <PhoneCall className="w-4 h-4 fill-white" />
              </div>
              <div className="text-left">
                <div className="text-[11px] text-[#4a5568] font-medium leading-none">Need to talk now?</div>
                <div className="text-sm font-extrabold text-[#0256b9] leading-snug mt-0.5">Call SOS 112</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#0256b9] stroke-[2.5]" />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 4: DISPATCHED & ACTIVE HOSPITAL MATCH (Accident / Pregnancy)      */}
      {/* ========================================================================= */}
      {(currentStep === 'dispatched_accident' || currentStep === 'dispatched_pregnancy') && (
        <div className="p-5 sm:p-6 flex flex-col text-left animate-in fade-in duration-300">
          {/* Top Bar with Return to Flow */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep === 'dispatched_accident' ? 'road_accident' : 'pregnancy')}
              className="p-1 -ml-1 flex items-center gap-1.5 font-bold text-xs text-[#0f2444] hover:text-black"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Back to Overview</span>
            </button>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold font-mono uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ALS En Route
            </span>
          </div>

          {/* Active Live Ambulance Tracker Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white border border-slate-800 shadow-xl mb-3.5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white animate-pulse">
                  <Ambulance className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-red-300">
                    {currentStep === 'dispatched_accident' ? 'Trauma ALS-108 Dispatched' : 'Code Pink Maternity ALS'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Token: {activeDispatchToken}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Estimated Arrival</div>
                <div className="text-xl font-black font-mono text-emerald-400">
                  {formatTimer(currentStep === 'dispatched_accident' ? accidentEtaSeconds : pregnancyEtaSeconds)}
                </div>
              </div>
            </div>

            {/* Live Transit Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full w-[72%] animate-pulse" />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span>Driver: Ramesh Yadav (+91 98201 44100)</span>
              <span className="font-semibold text-emerald-300">GPS Live Ping</span>
            </div>
          </div>

          {/* Target Matched Hospital Card */}
          <div className="p-4 rounded-2xl bg-[#f8fbfe] border border-[#cde2f2] shadow-2xs mb-3.5">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#0873d1] block">
                  {currentStep === 'dispatched_accident' ? 'Target Trauma Emergency Hospital' : 'Target Maternity Hospital & Labour OT'}
                </span>
                <h3 className="text-base font-extrabold text-[#17324d] leading-tight">
                  {currentStep === 'dispatched_accident' ? traumaHospital.name : maternityHospital.name}
                </h3>
                <div className="text-xs text-[#4a5568] mt-0.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span>
                    {currentStep === 'dispatched_accident' ? traumaHospital.address : maternityHospital.address}
                  </span>
                </div>
              </div>
              <div className="px-2 py-1 bg-blue-50 border border-blue-200 rounded-xl text-center shrink-0">
                <div className="text-xs font-black text-[#0873d1]">
                  {currentStep === 'dispatched_accident' 
                    ? (traumaHospital.distance || `${traumaHospital.distanceKm} km`)
                    : (maternityHospital.distance || `${maternityHospital.distanceKm} km`)}
                </div>
                <div className="text-[9px] text-slate-500 font-medium">Distance</div>
              </div>
            </div>

            {/* Hospital Beds / Critical Capabilities */}
            <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-[#e2eff7] text-center text-xs">
              <div className="bg-white p-1.5 rounded-lg border border-[#e2eff7]">
                <div className="font-black text-[#17324d]">
                  {currentStep === 'dispatched_accident' ? traumaHospital.icuBedsAvailable : maternityHospital.icuBedsAvailable}
                </div>
                <div className="text-[9px] text-slate-500">ICU Beds</div>
              </div>
              <div className="bg-white p-1.5 rounded-lg border border-[#e2eff7]">
                <div className="font-black text-emerald-600">
                  {currentStep === 'dispatched_accident' ? 'Ready' : 'Prepared'}
                </div>
                <div className="text-[9px] text-slate-500">
                  {currentStep === 'dispatched_accident' ? 'Trauma Bay' : 'Labour Suite'}
                </div>
              </div>
              <div className="bg-white p-1.5 rounded-lg border border-[#e2eff7]">
                <div className="font-black text-[#0873d1]">
                  {currentStep === 'dispatched_accident' ? traumaHospital.ventilatorsAvailable : maternityHospital.ventilatorsAvailable}
                </div>
                <div className="text-[9px] text-slate-500">Ventilators</div>
              </div>
            </div>
          </div>

          {/* Specific Case Add-on Cards */}
          {currentStep === 'dispatched_accident' ? (
            /* Police Thana Intimation Alert for Road Accident */
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs mb-3.5 space-y-1.5">
              <div className="flex items-center justify-between font-extrabold text-amber-900">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Police Thana Intimation (Auto-Logged)
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-200 font-bold">
                  GD Entry Confirmed
                </span>
              </div>
              <p className="text-[11px] text-amber-800 leading-snug">
                Incident broadcast to <b>Palasia Police Thana</b> &amp; 112 PCR Patrol Van for traffic green corridor clearance to {traumaHospital.name}.
              </p>
            </div>
          ) : (
            /* Onboard Obstetric Nurse Card for Pregnancy */
            <div className="p-3.5 rounded-2xl bg-pink-50/80 border border-pink-200 text-pink-950 text-xs mb-3.5 space-y-1.5">
              <div className="flex items-center justify-between font-extrabold text-pink-900">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-pink-600" />
                  Assigned Onboard Obstetric Nurse
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-pink-200 font-bold">
                  Sister Shalini Verma
                </span>
              </div>
              <p className="text-[11px] text-pink-800 leading-snug">
                Certified in ALSO &amp; NRP. Onboard kit includes Fetal Doppler (140 bpm), sterile childbirth kit, and neonatal oxygen line.
              </p>
            </div>
          )}

          {/* Direct Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              type="button"
              onClick={() =>
                handleDialSos(
                  currentStep === 'dispatched_accident'
                    ? (traumaHospital.phone || traumaHospital.contactNumber || traumaHospital.emergencyDeskDirect)
                    : (maternityHospital.phone || maternityHospital.contactNumber || maternityHospital.emergencyDeskDirect)
                )
              }
              className="py-3 px-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call Hospital ER</span>
            </button>
            <button
              type="button"
              onClick={handleShareFamily}
              className="py-3 px-2 rounded-xl bg-[#0873d1] hover:bg-[#0764b8] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>Share with Family</span>
            </button>
          </div>

          {/* Reset / Choose another option */}
          <button
            type="button"
            onClick={() => setCurrentStep('hub')}
            className="w-full py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs text-center transition-colors"
          >
            Change Emergency Category
          </button>
        </div>
      )}
    </div>
  );
};
