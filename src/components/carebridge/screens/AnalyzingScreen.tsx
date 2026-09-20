import React, { useEffect, useState } from 'react';
import { Bot, CheckCircle2, AlertCircle, ShieldAlert, Sparkles, MapPin } from 'lucide-react';
import { SoundFX } from '../../../utils/speech';
import { StickyBottomActionBar } from '../StickyBottomActionBar';

interface AnalyzingScreenProps {
  problemText: string;
  onProceed: () => void;
  onBack: () => void;
  detectedInfo: {
    patient: string;
    symptoms: string[];
    urgency: 'High' | 'Moderate' | 'Low';
    language: string;
    location: string;
  };
}

export const AnalyzingScreen: React.FC<AnalyzingScreenProps> = ({
  problemText,
  onProceed,
  onBack,
  detectedInfo,
}) => {
  const [step, setStep] = useState<number>(1);

  useEffect(() => {
    // Step 1: Language detected (0.6s)
    const t1 = setTimeout(() => {
      setStep(2);
      SoundFX.tapTick();
    }, 700);

    // Step 2: Emergency indicators found (1.4s)
    const t2 = setTimeout(() => {
      setStep(3);
      SoundFX.alertSonar();
    }, 1500);

    // Step 3: Extracting key info complete (2.2s)
    const t3 = setTimeout(() => {
      setStep(4);
    }, 2300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div className="w-full flex flex-col justify-between min-h-[580px] animate-in fade-in duration-200">
      <div className="space-y-3.5 text-left">
        {/* Top Header - No back button icon */}
        <div className="pt-2 pb-1 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Analyzing Clinical Urgency
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Real-time symptom extraction &amp; acuity scoring
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] tracking-wide">
            LIVE AI
          </span>
        </div>

        {/* User Transcript Quote Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs">
          <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed italic">
            &ldquo;{problemText || 'Mere papa ko saans lene mein dikkat ho rahi hai aur chest mein pain hai.'}&rdquo;
          </p>
          <div className="flex justify-end mt-2">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-700 font-bold text-[10px] uppercase tracking-wider">
              {detectedInfo.language || 'Hinglish'}
            </span>
          </div>
        </div>

        {/* Checklist Status */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-2 shadow-xs">
          {/* Item 1: Language */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <CheckCircle2 className={`w-4 h-4 ${step >= 2 ? 'text-emerald-500' : 'text-slate-300'} transition-colors`} />
            <span>Language detected: <strong className="text-slate-900">{detectedInfo.language || 'Hinglish'}</strong></span>
          </div>

          {/* Item 2: Emergency indicators */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <CheckCircle2 className={`w-4 h-4 ${step >= 3 ? 'text-emerald-500' : 'text-slate-300'} transition-colors`} />
            <span>Emergency indicators identified</span>
          </div>

          {/* Item 3: Extracting key information */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <CheckCircle2 className={`w-4 h-4 ${step >= 4 ? 'text-emerald-500' : 'text-slate-300'} transition-colors`} />
            <span>Matching critical care facilities in Indore...</span>
          </div>
        </div>

        {/* Detected Information Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Triage Summary</span>
          </div>

          <div className="text-xs space-y-1.5 divide-y divide-slate-100 text-slate-700">
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-500">Patient:</span>
              <span className="font-bold text-slate-900">{detectedInfo.patient || 'Father'}</span>
            </div>

            <div className="flex items-start justify-between pt-1.5">
              <span className="text-slate-500">Symptoms:</span>
              <span className="font-bold text-slate-900 text-right max-w-[200px]">
                {detectedInfo.symptoms.join(', ') || 'Breathing difficulty, Chest pain'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1.5">
              <span className="text-slate-500">Urgency:</span>
              <span className="font-black px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[10px] tracking-wider uppercase">
                {detectedInfo.urgency || 'High'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1.5">
              <span className="text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                Location:
              </span>
              <span className="font-medium text-slate-700">
                {detectedInfo.location || 'Indore, Madhya Pradesh'}
              </span>
            </div>
          </div>
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 text-center">
          <p className="text-[11px] font-medium text-slate-600">
            <span className="text-red-600 font-bold mr-1">+</span>
            CareBridge connects emergency services &amp; facilities, not medical diagnosis.
          </p>
        </div>
      </div>

      {/* Standardized Sticky Bottom Action Area */}
      <StickyBottomActionBar
        onBack={onBack}
        backLabel="Back"
        onNext={onProceed}
        nextLabel="Proceed to Triage Detection →"
        stepInfo={{
          current: 2,
          total: 8,
          title: 'Input Analysis',
        }}
        emergencyAction={{
          label: 'Call 108',
          onEmergencyCall: () => {
            SoundFX.codeBlueAlarm();
            window.open('tel:108', '_self');
          },
        }}
      />
    </div>
  );
};
