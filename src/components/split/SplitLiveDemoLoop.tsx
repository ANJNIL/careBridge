import React from 'react';
import { Hospital, IncomingEmergencyDispatch, DistressTriageResult, AuthUser } from '../../types';
import { PatientMobileView } from '../patient/PatientMobileView';
import { HospitalPortalView } from '../hospital/HospitalPortalView';
import { Radio, Sparkles, SplitSquareVertical, ArrowRight, ShieldCheck } from 'lucide-react';

interface SplitLiveDemoLoopProps {
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
  onUpdateDispatchStatus: (dispatchId: string, newStatus: IncomingEmergencyDispatch['status']) => void;
  currentUser?: AuthUser | null;
  onOpenLogin?: () => void;
}

export const SplitLiveDemoLoop: React.FC<SplitLiveDemoLoopProps> = ({
  hospitals,
  dispatches,
  onDispatchPatient,
  onUpdateHospitalResources,
  onUpdateDispatchStatus,
  currentUser,
  onOpenLogin,
}) => {
  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-4 px-3 sm:px-6 py-4">
      {/* Live Verification Loop Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <SplitSquareVertical className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">
                Live Demo Verification Loop
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                Zero Slides • 100% Live Execution
              </span>
            </div>
            <p className="text-slate-400 mt-0.5">
              Left: Distress Input & AI Triage (Patient Mobile) <ArrowRight className="inline w-3 h-3 mx-1 text-rose-400" /> Right: Pre-Arrival Intake & ICU Bed Hold (Hospital ER Portal)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <span className="text-[11px] text-slate-400 hidden sm:inline">Active Telemetry Sync:</span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 font-mono font-bold flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-emerald-400 animate-ping" />
            <span>2-Way Live Sync Active</span>
          </span>
        </div>
      </div>

      {/* Side-by-side Container */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Mobile View Simulation */}
        <div className="xl:col-span-5 bg-slate-950/50 p-2 sm:p-4 rounded-3xl border border-slate-800/80 shadow-2xl">
          <div className="text-center pb-2 mb-2 border-b border-slate-800 flex items-center justify-between px-3 text-xs">
            <span className="font-extrabold text-rose-400 uppercase tracking-wider">
              📱 Patient & Caregiver Distress View
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              Viewport: 390px Mobile
            </span>
          </div>

          <PatientMobileView
            hospitals={hospitals}
            onDispatchPatient={onDispatchPatient}
            currentUser={currentUser}
            onOpenLogin={onOpenLogin}
          />
        </div>

        {/* Right Column: Hospital ER Command Dashboard */}
        <div className="xl:col-span-7 bg-slate-950/50 p-2 sm:p-4 rounded-3xl border border-slate-800/80 shadow-2xl">
          <div className="text-center pb-2 mb-2 border-b border-slate-800 flex items-center justify-between px-3 text-xs">
            <span className="font-extrabold text-emerald-400 uppercase tracking-wider">
              🏥 Hospital ER Triage Command & Bed Portal
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              Live Intake Feed
            </span>
          </div>

          <HospitalPortalView
            hospitals={hospitals}
            dispatches={dispatches}
            onUpdateHospitalResources={onUpdateHospitalResources}
            onUpdateDispatchStatus={onUpdateDispatchStatus}
            currentUser={currentUser}
            onOpenLogin={onOpenLogin}
          />
        </div>
      </div>
    </div>
  );
};

