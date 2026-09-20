import React, { useState, useEffect, useRef } from 'react';
import { CareBridgeScreen } from '../types';
import { Mic, Lightbulb, Sparkles, Send, Activity } from 'lucide-react';
import { SoundFX } from '../../../utils/speech';
import { StickyBottomActionBar } from '../StickyBottomActionBar';

interface TellProblemScreenProps {
  onBack: () => void;
  onAnalyze: (text: string) => void;
  initialText?: string;
}

export const TellProblemScreen: React.FC<TellProblemScreenProps> = ({
  onBack,
  onAnalyze,
  initialText = '',
}) => {
  const [inputText, setInputText] = useState(initialText);
  const [isListening, setIsListening] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  const defaultExample = 'Mere papa ko saans lene mein dikkat ho rahi hai aur chest mein pain hai.';

  useEffect(() => {
    SoundFX.tapTick();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'hi-IN';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript.trim()) {
            setInputText(transcript);
          }
        };

        recognition.onerror = () => {};

        recognition.start();
        recognitionRef.current = recognition;
      } catch {
        setSpeechSupported(false);
      }
    } else {
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const handleSelectExample = (text: string) => {
    SoundFX.tapTick();
    setInputText(text);
  };

  const handleProceed = () => {
    const textToAnalyze = inputText.trim() || defaultExample;
    SoundFX.tapTick();
    onAnalyze(textToAnalyze);
  };

  return (
    <div className="w-full flex flex-col justify-between min-h-[580px]">
      {/* Top Header without any back clicks */}
      <div className="pt-2 pb-1 border-b border-slate-100 flex items-center justify-between text-left">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
            Describe Your Problem
          </h2>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Voice &amp; Text Triage Engine • Hindi / Hinglish / English
          </p>
        </div>
        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
          <Activity className="w-4 h-4 animate-pulse" />
        </div>
      </div>

      {/* Center Listening Orb & Waveform */}
      <div className="flex flex-col items-center justify-center py-6 text-center">
        {/* Pulsing Concentric Circles */}
        <div className="relative flex items-center justify-center my-3">
          <div className="absolute w-44 h-44 rounded-full bg-sky-200/40 animate-ping opacity-60 pointer-events-none" />
          <div className="absolute w-36 h-36 rounded-full bg-sky-300/40 animate-pulse pointer-events-none" />
          <div className="absolute w-28 h-28 rounded-full bg-sky-400/30 pointer-events-none" />

          {/* Center Mic Button */}
          <button
            type="button"
            onClick={() => {
              if (isListening) {
                setIsListening(false);
                if (recognitionRef.current) recognitionRef.current.stop();
              } else {
                setIsListening(true);
                if (recognitionRef.current) recognitionRef.current.start();
              }
            }}
            className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-600 shadow-xl shadow-blue-500/40 flex items-center justify-center text-white active:scale-95 transition-all cursor-pointer"
            title={isListening ? 'Tap to pause' : 'Tap to listen'}
          >
            <Mic className="w-9 h-9 text-white animate-pulse" />
          </button>
        </div>

        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-2">
          {isListening ? 'Listening to voice...' : 'Microphone Paused'}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Speak symptoms clearly or select an example prompt below
        </p>

        {/* Audio Waveform Bars */}
        <div className="flex items-center justify-center gap-1.5 h-7 my-4">
          {[40, 75, 55, 95, 60, 85, 45, 90, 65, 80, 50, 70, 35].map((height, i) => (
            <span
              key={i}
              className="w-1 rounded-full bg-sky-500/80 transition-all duration-150"
              style={{
                height: isListening ? `${height}%` : '20%',
                opacity: isListening ? 1 : 0.3,
                animation: isListening ? `pulse 1.2s ease-in-out infinite alternate ${i * 0.08}s` : 'none',
              }}
            />
          ))}
        </div>
      </div>

      {/* Input / Example Prompts Box */}
      <div className="space-y-2.5 mb-4 text-left">
        {/* Clickable Example Box */}
        <div
          id="btn-sample-prompt-box"
          onClick={() => handleSelectExample(defaultExample)}
          className="bg-sky-50/80 hover:bg-sky-100/80 border border-sky-200/80 rounded-2xl p-3 text-left cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-700 mb-0.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Tap to load sample:</span>
          </div>
          <p className="text-xs text-slate-700 italic group-hover:text-slate-900 transition-colors">
            &ldquo;{defaultExample}&rdquo;
          </p>
        </div>

        {/* Text Input / Fallback */}
        <div className="relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type symptoms here (e.g. chest pain, breathing problem)..."
            className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
          />
        </div>
      </div>

      {/* Standardized Sticky Bottom Action Area */}
      <StickyBottomActionBar
        onBack={onBack}
        backLabel="Cancel"
        onNext={handleProceed}
        nextLabel="Analyze Problem →"
        stepInfo={{
          current: 1,
          total: 8,
          title: 'Voice/Text Input',
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
