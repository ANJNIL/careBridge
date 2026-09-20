// Voice-to-Text Input normalization utility for Form fields (Phone, Email, OTP, Distress)
import { LANGUAGE_LOCALE_MAP } from './speech';
import { SupportedLanguage } from '../types';

const DIGIT_WORDS: Record<string, string> = {
  zero: '0',
  oh: '0',
  one: '1',
  two: '2',
  to: '2',
  too: '2',
  three: '3',
  four: '4',
  for: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  ate: '8',
  nine: '9',
  shunya: '0',
  ek: '1',
  do: '2',
  teen: '3',
  char: '4',
  paanch: '5',
  chhah: '6',
  saat: '7',
  aath: '8',
  nau: '9',
};

/**
 * Normalizes spoken voice into digits (e.g., "nine eight four five" -> "9845")
 */
export function normalizeVoiceToPhoneNumber(spokenText: string): string {
  let text = spokenText.toLowerCase();

  // Handle "double X" and "triple X"
  text = text.replace(/double\s+([a-z0-9]+)/gi, (_, word) => {
    const digit = DIGIT_WORDS[word.toLowerCase()] || word;
    return `${digit}${digit}`;
  });
  text = text.replace(/triple\s+([a-z0-9]+)/gi, (_, word) => {
    const digit = DIGIT_WORDS[word.toLowerCase()] || word;
    return `${digit}${digit}${digit}`;
  });

  const words = text.split(/\s+/);
  let result = '';

  for (const word of words) {
    const clean = word.replace(/[^a-z0-9]/g, '');
    if (DIGIT_WORDS[clean]) {
      result += DIGIT_WORDS[clean];
    } else {
      // Extract any raw digits inside the word
      const digitsOnly = word.replace(/[^0-9]/g, '');
      if (digitsOnly) {
        result += digitsOnly;
      }
    }
  }

  // Remove non-digit characters
  return result.replace(/\D/g, '').slice(0, 10);
}

/**
 * Normalizes spoken voice into an email address
 * e.g., "doctor sarah at gmail dot com" -> "doctorsarah@gmail.com"
 */
export function normalizeVoiceToEmail(spokenText: string): string {
  let text = spokenText.toLowerCase().trim();

  // Common replacements
  text = text.replace(/\s+at\s+the\s+rate\s+/gi, '@');
  text = text.replace(/\s+at\s+/gi, '@');
  text = text.replace(/@\s+/g, '@');
  text = text.replace(/\s+@/g, '@');
  text = text.replace(/\s+dot\s+/gi, '.');
  text = text.replace(/\.com\b/gi, '.com');
  text = text.replace(/\.org\b/gi, '.org');
  text = text.replace(/\.in\b/gi, '.in');

  // Remove spaces
  text = text.replace(/\s+/g, '');

  // If no '@' is present but ends with gmail / yahoo / outlook
  if (!text.includes('@')) {
    if (text.includes('gmail')) {
      text = text.replace('gmail', '@gmail');
    } else if (text.includes('hospital')) {
      text = text.replace('hospital', '@hospital');
    }
  }

  // Ensure .com if ending with @gmail
  if (text.endsWith('@gmail')) {
    text += '.com';
  }

  return text;
}

/**
 * Normalizes spoken voice into a 6-digit OTP
 */
export function normalizeVoiceToDigits(spokenText: string, maxLength = 6): string {
  const digits = normalizeVoiceToPhoneNumber(spokenText);
  return digits.slice(0, maxLength);
}

export interface VoiceListenerHandle {
  stop: () => void;
}

/**
 * Starts a voice listening session for a form field
 */
export async function startVoiceInputSession({
  language = 'en',
  onInterim,
  onFinal,
  onError,
}: {
  language?: SupportedLanguage;
  onInterim?: (text: string) => void;
  onFinal: (text: string) => void;
  onError?: (errMessage: string) => void;
}): Promise<VoiceListenerHandle> {
  const SpeechRecognitionClass =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognitionClass) {
    onError?.('Speech recognition is not supported in this browser.');
    return { stop: () => {} };
  }

  try {
    if (navigator.mediaDevices?.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setTimeout(() => stream.getTracks().forEach((t) => t.stop()), 1000);
    }
  } catch (err: any) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      onError?.('Microphone permission blocked. Please allow mic in browser settings.');
      return { stop: () => {} };
    }
  }

  const recognition = new SpeechRecognitionClass();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = LANGUAGE_LOCALE_MAP[language] || 'en-IN';
  recognition.maxAlternatives = 1;

  let captured = '';

  recognition.onresult = (event: any) => {
    let interim = '';
    let finalStr = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        finalStr += event.results[i][0].transcript;
      } else {
        interim += event.results[i][0].transcript;
      }
    }

    const current = (finalStr || interim).trim();
    if (current) {
      captured = current;
      onInterim?.(current);
    }
  };

  recognition.onerror = (event: any) => {
    if (event.error === 'not-allowed') {
      onError?.('Microphone access denied.');
    } else if (event.error === 'no-speech') {
      // Handled gracefully
    } else {
      onError?.(`Speech input error: ${event.error}`);
    }
  };

  recognition.onend = () => {
    if (captured) {
      onFinal(captured);
    }
  };

  recognition.start();

  return {
    stop: () => {
      try {
        recognition.stop();
      } catch {}
    },
  };
}
