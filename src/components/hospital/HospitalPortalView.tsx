import React, { useState } from 'react';
import { Hospital, IncomingEmergencyDispatch, SBARCard, TriageLevel, AuthUser } from '../../types';
import { formatTriageBadge } from '../../utils/triage';
import { playEmergencyTone, SoundFX } from '../../utils/speech';
import { startVoiceInputSession } from '../../utils/voiceInput';
import { 
  Building2, 
  Bed, 
  Wind, 
  Activity, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sliders, 
  Search, 
  QrCode, 
  Ambulance, 
  PhoneCall, 
  ShieldCheck, 
  RefreshCw,
  ChevronDown,
  Volume2,
  Mic,
  UserCheck,
  Lock
} from 'lucide-react';

interface HospitalPortalViewProps {
  hospitals: Hospital[];
  dispatches: IncomingEmergencyDispatch[];
  onUpdateHospitalResources: (
    hospitalId: string,
    updates: {
      icuBedsAvailable?: number;
      oxygenBedsAvailable?: number;
      ventilatorsAvailable?: number;
    }
  ) => void;
  onUpdateDispatchStatus: (dispatchId: string, newStatus: IncomingEmergencyDispatch['status']) => void;
  currentUser?: AuthUser | null;
  onOpenLogin?: () => void;
}

export const HospitalPortalView: React.FC<HospitalPortalViewProps> = ({
  hospitals,
  dispatches,
  onUpdateHospitalResources,
  onUpdateDispatchStatus,
  currentUser,
  onOpenLogin,
}) => {
  // Select active hospital for portal management
  const [activeHospitalId, setActiveHospitalId] = useState<string>(
    (currentUser?.role === 'hospital_staff' && currentUser.hospitalId) || hospitals[0]?.id || 'hosp-1'
  );
  const [selectedDispatch, setSelectedDispatch] = useState<IncomingEmergencyDispatch | null>(
    dispatches[0] || null
  );
  
  // Handshake Token Search input
  const [scanToken, setScanToken] = useState('');
  const [tokenSearchFeedback, setTokenSearchFeedback] = useState<string | null>(null);
  const [isVoiceListening, setIsVoiceListening] = useState<boolean>(false);

  const activeHospital = hospitals.find((h) => h.id === activeHospitalId) || hospitals[0];

  // Local slider states for instant responsiveness
  const [icuCount, setIcuCount] = useState<number>(activeHospital?.icuBedsAvailable ?? 6);
  const [o2Count, setO2Count] = useState<number>(activeHospital?.oxygenBedsAvailable ?? 14);
  const [ventCount, setVentCount] = useState<number>(activeHospital?.ventilatorsAvailable ?? 5);

  const handleApplyResourceUpdates = () => {
    onUpdateHospitalResources(activeHospital.id, {
      icuBedsAvailable: icuCount,
      oxygenBedsAvailable: o2Count,
      ventilatorsAvailable: ventCount,
    });
    playEmergencyTone('success');
  };

  const handleVerifyToken = (tokenToVerify?: string) => {
    const target = (tokenToVerify || scanToken).trim().toLowerCase();
    if (!target) return;
    const match = dispatches.find(
      (d) =>
        d.digitalHandshakeToken.toLowerCase().includes(target) ||
        d.patientName.toLowerCase().includes(target) ||
        d.id.toLowerCase().includes(target)
    );
    if (match) {
      setSelectedDispatch(match);
      setTokenSearchFeedback(`✓ Patient ${match.patientName} Verified! Pre-clearing ER triage.`);
      playEmergencyTone('success');
    } else {
      setTokenSearchFeedback(`⚠️ No match found for "${target}".`);
    }
  };

  const handleVoiceTokenSearch = async () => {
    SoundFX.init();
    SoundFX.alertSonar();

    if (isVoiceListening) {
      setIsVoiceListening(false);
      return;
    }

    setIsVoiceListening(true);
    setTokenSearchFeedback('Listening... Speak token digits or patient name');

    try {
      await startVoiceInputSession({
        language: 'en',
        onInterim: (text) => {
          setScanToken(text);
        },
        onFinal: (finalSpeech) => {
          setIsVoiceListening(false);
          setScanToken(finalSpeech);
          handleVerifyToken(finalSpeech);
        },
        onError: (err) => {
          setIsVoiceListening(false);
          setTokenSearchFeedback(`Voice search: ${err}`);
        },
      });
    } catch {
      setIsVoiceListening(false);
      setTokenSearchFeedback('Speech input unavailable in browser.');
    }
  };

  const handleStatusChange = (dispatchId: string, status: IncomingEmergencyDispatch['status']) => {
    onUpdateDispatchStatus(dispatchId, status);
    playEmergencyTone(status === 'Bed Reserved' ? 'success' : 'ping');
    if (selectedDispatch && selectedDispatch.id === dispatchId) {
      setSelectedDispatch({
        ...selectedDispatch,
        status,
      });
    }
  };

  const isHospitalStaff = currentUser?.role === 'hospital_staff';

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 px-4 py-4 sm:py-6">
      {/* Hospital Portal Header & Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-rose-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{activeHospital.name}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Level-{activeHospital.traumaLevel} Trauma Center
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Emergency Department Command Portal • 24/7 Hotline: {activeHospital.emergencyDeskDirect}
            </p>
          </div>
        </div>

        {/* Staff Authorization Badge & Switcher */}
        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          {isHospitalStaff ? (
            <div className="px-3 py-1.5 rounded-xl bg-tactical-surface border border-tactical-emerald text-xs font-mono text-emerald-300 flex items-center gap-2 shadow">
              <UserCheck className="w-4 h-4 text-tactical-emerald" />
              <div>
                <span className="font-bold text-white block">{currentUser.name}</span>
                <span className="text-[10px] text-slate-400">
                  {currentUser.staffDesignation || 'Triage Officer'} • {currentUser.badgeId || 'ER-7429'}
                </span>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-3 py-1.5 rounded-xl bg-tactical-red hover:bg-red-600 text-white text-xs font-hud font-bold flex items-center gap-1.5 shadow"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Hospital Staff Login</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">Switch Facility:</span>
            <select
              id="select-hospital-dropdown"
              value={activeHospitalId}
              onChange={(e) => {
                const newId = e.target.value;
                setActiveHospitalId(newId);
                const hosp = hospitals.find((h) => h.id === newId);
                if (hosp) {
                  setIcuCount(hosp.icuBedsAvailable);
                  setO2Count(hosp.oxygenBedsAvailable);
                  setVentCount(hosp.ventilatorsAvailable);
                }
              }}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
            >
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Emergency Dashboard & Incoming Patients Queue */}
        <div className="lg:col-span-2 space-y-6">
          {/* Intake Queue Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-rose-500 animate-pulse" />
                <h3 className="font-bold text-white text-base">Incoming Emergency Patient Queue</h3>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-red-500/20 text-red-300 font-bold">
                  {dispatches.length} Incoming
                </span>
              </div>

              {/* Digital Handshake QR Token Quick Scanner with Voice to Text */}
              <div className="flex items-center gap-2">
                <div className="relative flex items-center">
                  <input
                    id="input-token-scan"
                    type="text"
                    value={scanToken}
                    onChange={(e) => setScanToken(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyToken()}
                    placeholder="Scan / Speak Token"
                    className="bg-slate-950 border border-slate-700 text-xs rounded-lg pl-2.5 pr-8 py-1.5 text-white font-mono placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500 w-44"
                  />
                  <button
                    type="button"
                    onClick={handleVoiceTokenSearch}
                    title="Speak Token or Patient Name"
                    className={`absolute right-1.5 p-1 rounded ${
                      isVoiceListening ? 'text-tactical-red animate-pulse' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  id="btn-verify-token"
                  onClick={() => handleVerifyToken()}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Verify</span>
                </button>
              </div>
            </div>

            {tokenSearchFeedback && (
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-amber-300 font-mono">
                {tokenSearchFeedback}
              </div>
            )}


            {/* List of Incoming Patients */}
            <div className="space-y-3">
              {dispatches.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No active incoming emergency alerts. Trigger a voice distress test from Patient Mobile.
                </div>
              ) : (
                dispatches.map((disp) => {
                  const isSelected = selectedDispatch?.id === disp.id;
                  const badge = formatTriageBadge(disp.triageLevel);

                  return (
                    <div
                      key={disp.id}
                      id={`dispatch-item-${disp.id}`}
                      onClick={() => setSelectedDispatch(disp)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-950 border-rose-500 ring-2 ring-rose-500/20 shadow-lg'
                          : 'bg-slate-950/60 hover:bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-3 h-3 rounded-full ${badge.dot} animate-ping`} />
                          <div>
                            <span className="font-bold text-white text-sm">{disp.patientName}</span>
                            <span className="text-xs text-slate-400 ml-2">
                              {disp.patientAge}y • {disp.patientGender} • Phone: {disp.phone}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${badge.bg}`}>
                            Level {disp.triageLevel} ({badge.label.split(':')[1]?.trim()})
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-slate-800 text-slate-300">
                            Token: {disp.digitalHandshakeToken}
                          </span>
                        </div>
                      </div>

                      {/* Symptoms & ETA */}
                      <div className="mt-2 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                        <div className="flex flex-wrap gap-1">
                          {disp.symptoms.map((s, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-rose-300"
                            >
                              {s}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-rose-400 font-bold flex items-center gap-1">
                            <Ambulance className="w-3.5 h-3.5 animate-pulse" />
                            <span>Ambulance ETA: ~{disp.ambulanceEtaMinutes} mins</span>
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-white font-semibold">
                            Status: {disp.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected Patient SBAR Card Inspector & Action Controls */}
          {selectedDispatch && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="font-bold text-white text-base flex items-center gap-2">
                    <span>Clinical SBAR Triage Intake</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      {selectedDispatch.digitalHandshakeToken}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Pre-Arrival Digital Handshake for {selectedDispatch.patientName}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="btn-preclear-triage"
                    onClick={() => handleStatusChange(selectedDispatch.id, 'Triage Pre-Cleared')}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Pre-Clear Triage Desk</span>
                  </button>

                  <button
                    id="btn-reserve-icu-bed"
                    onClick={() => handleStatusChange(selectedDispatch.id, 'Bed Reserved')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                  >
                    <Bed className="w-3.5 h-3.5" />
                    <span>Hold ICU Bed #04</span>
                  </button>
                </div>
              </div>

              {/* SBAR 4-Quadrant Clinical Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[11px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Situation (S)
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {selectedDispatch.sbar.situation}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[11px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Background (B)
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {selectedDispatch.sbar.background}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[11px] uppercase font-bold text-cyan-400 tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-500" />
                    Assessment (A)
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {selectedDispatch.sbar.assessment}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[11px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Recommendation (R)
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {selectedDispatch.sbar.recommendation}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Resource Update Portal (ICU Bed Count Slider, Oxygen Beds) */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-white text-base">Resource Update Portal</h3>
              </div>
              <span className="text-[11px] text-slate-400">Live ER Sync</span>
            </div>

            <p className="text-xs text-slate-400">
              Update real-time bed capacity to immediately influence the patient matchmaking algorithm.
            </p>

            {/* Slider 1: ICU Bed Count Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Bed className="w-4 h-4 text-emerald-400" />
                  Available ICU Beds:
                </span>
                <span className={`font-mono text-base font-bold ${
                  icuCount > 0 ? 'text-emerald-400' : 'text-rose-500 font-extrabold'
                }`}>
                  {icuCount} / {activeHospital.icuBedsTotal}
                </span>
              </div>
              <input
                id="slider-icu-beds"
                type="range"
                min="0"
                max={activeHospital.icuBedsTotal}
                value={icuCount}
                onChange={(e) => setIcuCount(Number(e.target.value))}
                className="w-full accent-emerald-500 h-2 bg-slate-950 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0 (Code Full)</span>
                <span>{activeHospital.icuBedsTotal} (Max)</span>
              </div>
            </div>

            {/* Slider 2: Oxygen Beds Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-cyan-400" />
                  Available Oxygen Beds:
                </span>
                <span className="font-mono text-base font-bold text-cyan-400">
                  {o2Count} / {activeHospital.oxygenBedsTotal}
                </span>
              </div>
              <input
                id="slider-oxygen-beds"
                type="range"
                min="0"
                max={activeHospital.oxygenBedsTotal}
                value={o2Count}
                onChange={(e) => setO2Count(Number(e.target.value))}
                className="w-full accent-cyan-500 h-2 bg-slate-950 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0</span>
                <span>{activeHospital.oxygenBedsTotal}</span>
              </div>
            </div>

            {/* Slider 3: Ventilators Ready */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-amber-400" />
                  Ventilators Ready:
                </span>
                <span className="font-mono text-base font-bold text-amber-400">
                  {ventCount} Ready
                </span>
              </div>
              <input
                id="slider-ventilators"
                type="range"
                min="0"
                max="15"
                value={ventCount}
                onChange={(e) => setVentCount(Number(e.target.value))}
                className="w-full accent-amber-500 h-2 bg-slate-950 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0</span>
                <span>15</span>
              </div>
            </div>

            {/* Save Button */}
            <button
              id="btn-save-resources"
              onClick={handleApplyResourceUpdates}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Publish Bed Counts to Patient Network</span>
            </button>
          </div>

          {/* Facility Status & Rapid Hotline Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-xs space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Facility Emergency Hotline
            </h4>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[10px]">Direct ER Desk:</span>
                <span className="font-mono font-bold text-white text-sm">
                  {activeHospital.emergencyDeskDirect}
                </span>
              </div>
              <a
                href={`tel:${activeHospital.emergencyDeskDirect}`}
                className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
              >
                <PhoneCall className="w-4 h-4" />
              </a>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[10px]">Verified Capabilities:</span>
              <div className="flex flex-wrap gap-1">
                {activeHospital.capabilities.map((cap, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
