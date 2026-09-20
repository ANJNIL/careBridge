import React from 'react';
import { ChevronRight, ArrowLeft, PhoneCall, AlertTriangle, Radio } from 'lucide-react';
import { SoundFX } from '../../utils/speech';

export interface StickyBottomActionBarProps {
  // Secondary button (Back or Cancel)
  onBack?: () => void;
  backLabel?: string; // e.g. "Back", "Cancel"
  showBack?: boolean;

  // Primary button (Sequential action)
  onNext: () => void;
  nextLabel: string; // e.g. "Find Nearby Hospitals →", "Proceed to Facility Details →"
  nextDisabled?: boolean;
  isHighUrgency?: boolean; // Red contrast for emergency steps
  isNextLoading?: boolean;

  // Emergency quick action (accessible 1-tap without breaking flow)
  emergencyAction?: {
    label?: string; // e.g. "Call 108", "SOS 108"
    onEmergencyCall?: () => void;
  };

  // Step indicator
  stepInfo?: {
    current: number;
    total: number;
    title: string;
  };
}

export const StickyBottomActionBar: React.FC<StickyBottomActionBarProps> = ({
  onBack,
  backLabel = 'Back',
  showBack = true,
  onNext,
  nextLabel,
  nextDisabled = false,
  isHighUrgency = false,
  isNextLoading = false,
  emergencyAction = {
    label: 'Call 108',
    onEmergencyCall: () => {
      SoundFX.codeBlueAlarm();
      window.open('tel:108', '_self');
    },
  },
  stepInfo,
}) => {
  return (
    <div
      id="carebridge-sticky-bottom-bar"
      className="sticky bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-4 py-3 shadow-[0_-8px_20px_rgba(0,0,0,0.06)] transition-all"
    >
      {/* Step Progress & Quick 1-Tap Emergency Bar */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        {/* Step Micro-Indicator */}
        {stepInfo ? (
          <div className="flex items-center gap-2">
            {/* Multi-segment micro bar */}
            <div className="flex items-center gap-1">
              {Array.from({ length: stepInfo.total }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i + 1 === stepInfo.current
                      ? 'w-5 bg-blue-600'
                      : i + 1 < stepInfo.current
                      ? 'w-2 bg-emerald-500'
                      : 'w-2 bg-slate-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-bold text-slate-500">
              Step {stepInfo.current}/{stepInfo.total} •{' '}
              <span className="text-slate-800 font-extrabold">{stepInfo.title}</span>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>CareBridge Active Triage</span>
          </div>
        )}

        {/* 1-Tap Emergency Quick Call / SOS (always accessible without breaking sequential layout) */}
        {emergencyAction && (
          <button
            id="btn-bottom-quick-emergency"
            type="button"
            onClick={() => {
              SoundFX.codeBlueAlarm();
              if (emergencyAction.onEmergencyCall) {
                emergencyAction.onEmergencyCall();
              } else {
                window.open('tel:108', '_self');
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-[11px] font-black tracking-wide shadow-xs active:scale-95 transition-all group shrink-0"
            title="Immediate 1-tap Emergency Call"
          >
            <PhoneCall className="w-3 h-3 text-red-600 group-hover:animate-bounce" />
            <span>{emergencyAction.label || 'Call 108'}</span>
          </button>
        )}
      </div>

      {/* Main Dual Action Container */}
      <div className="flex items-center gap-2.5">
        {/* Secondary Action: Back / Cancel */}
        {showBack && onBack ? (
          <button
            id="btn-bottom-secondary-back"
            type="button"
            onClick={() => {
              SoundFX.tapTick();
              onBack();
            }}
            className="px-4 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 shrink-0 select-none"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>{backLabel}</span>
          </button>
        ) : null}

        {/* Primary Action: High-Contrast Sequential CTA */}
        <button
          id="btn-bottom-primary-next"
          type="button"
          disabled={nextDisabled || isNextLoading}
          onClick={() => {
            SoundFX.tapTick();
            onNext();
          }}
          className={`flex-1 py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm tracking-wide shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 select-none ${
            nextDisabled
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              : isHighUrgency
              ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-600/30'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/25'
          }`}
        >
          {isNextLoading ? (
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <span>Processing...</span>
            </div>
          ) : (
            <>
              <span className="truncate">{nextLabel}</span>
              <ChevronRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
