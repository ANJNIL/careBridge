import { SupportedLanguage } from '../types';

export const LANGUAGE_LOCALE_MAP: Record<SupportedLanguage, string> = {
  hi: 'hi-IN',
  en: 'en-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  mr: 'mr-IN',
};

// Web Audio procedural synthesizer (zero external audio files needed)
export const SoundFX = {
  ctx: null as AudioContext | null,
  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },
  beep(freq = 880, duration = 0.1, type: OscillatorType = 'sine') {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio context might be waiting for user interaction
    }
  },
  cardiacPulse() {
    this.beep(160, 0.12, 'triangle');
    setTimeout(() => this.beep(240, 0.18, 'triangle'), 140);
  },
  tapTick() {
    this.beep(800, 0.04, 'sine');
  },
  alertSonar() {
    this.beep(1200, 0.25, 'sine');
  },
  codeBlueAlarm() {
    this.beep(950, 0.18, 'sawtooth');
    setTimeout(() => this.beep(720, 0.22, 'sawtooth'), 190);
  },
  sirenBurst() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(500, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(850, this.ctx.currentTime + 0.25);
      osc.frequency.linearRampToValueAtTime(500, this.ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch {
      // Safe fallback
    }
  },
};

// Backwards-compatible playEmergencyTone wrapper
export function playEmergencyTone(type: 'alert' | 'success' | 'ping' = 'ping') {
  if (type === 'alert') {
    SoundFX.sirenBurst();
  } else if (type === 'success') {
    SoundFX.alertSonar();
  } else {
    SoundFX.beep(700, 0.15, 'sine');
  }
}

// Text-to-Speech playback for first aid instruction
export function speakFirstAidInstruction(text: string, lang: SupportedLanguage = 'en') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANGUAGE_LOCALE_MAP[lang] || 'en-IN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis playback error:', err);
  }
}


