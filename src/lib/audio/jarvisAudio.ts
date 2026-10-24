'use client';

import { JarvisControlMode, JarvisVoiceState } from '@/types';

type TranscriptCallback = (transcript: string, isFinal: boolean) => void;
type StateChangeCallback = (state: JarvisVoiceState) => void;

let globalSpeechListener: ((speaking: boolean) => void) | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const load = () => {
    cachedVoices = window.speechSynthesis.getVoices() || [];
  };
  load();
  window.speechSynthesis.onvoiceschanged = load;
}

export function onJarvisSpeechStateChange(cb: (speaking: boolean) => void) {
  globalSpeechListener = cb;
}

function setGlobalSpeaking(state: boolean) {
  if (globalSpeechListener) globalSpeechListener(state);
}

export function pickBestJarvisVoice(lang = 'en-GB'): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = cachedVoices.length ? cachedVoices : window.speechSynthesis.getVoices();
  if (!voices?.length) return null;

  if (lang.startsWith('ja')) {
    return (
      voices.find(v => v.lang.startsWith('ja') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Kyoko'))) ||
      voices.find(v => v.lang.startsWith('ja')) ||
      null
    );
  }

  const priorities = [
    'Microsoft Ryan Online (Natural)',
    'Microsoft Thomas Online (Natural)',
    'Google UK English Male',
    'Daniel (Enhanced)',
    'Daniel',
    'Arthur',
    'Oliver',
    'Microsoft George',
    'Microsoft Guy Online (Natural)',
    'Google US English'
  ];

  for (const name of priorities) {
    const found = voices.find(v => v.name.toLowerCase().includes(name.toLowerCase()));
    if (found) return found;
  }

  return (
    voices.find(v => v.lang === 'en-GB' && (v.name.includes('Natural') || v.name.includes('Male'))) ||
    voices.find(v => v.lang === 'en-GB') ||
    voices.find(v => v.lang.startsWith('en') && v.name.includes('Natural')) ||
    voices.find(v => v.lang.startsWith('en')) ||
    voices[0] ||
    null
  );
}

export function cleanTextForJarvisSpeech(rawText: string): string {
  return (rawText || '')
    .replace(/[*_#`~>]/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[✓⚠⚡🌧️🍜🗳️☀️🏛️🎯🏆🚑🚓🏥]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stopJarvisSpeech(wasInterrupted = false) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
  setGlobalSpeaking(false);
  jarvisAudio.stopSpeaking(wasInterrupted);
}

export function speakWithJarvisVoice(text: string, lang = 'en-GB', enabled = true, onDone?: () => void) {
  if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onDone) onDone();
    return;
  }
  jarvisAudio.speak(text, onDone);
}

export function playJarvisSound(kind: 'chime' | 'heal' | 'sos' | 'xp' = 'chime', enabled = true) {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const freqs =
      kind === 'sos'
        ? [520, 360, 520]
        : kind === 'heal'
        ? [440, 554.37, 659.25, 880]
        : kind === 'xp'
        ? [523.25, 659.25, 783.99, 1046.5]
        : [587.33, 880];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = kind === 'sos' ? 'sawtooth' : kind === 'xp' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.055);
      gain.gain.setValueAtTime(0.04, now + i * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + i * 0.055 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.055);
      osc.stop(now + i * 0.055 + 0.24);
    });
  } catch {}
}

export type JarvisChimeType = 'wake' | 'confirm' | 'alert' | 'sleep' | 'ambient';

export function playJarvisChime(type: JarvisChimeType) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'wake') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.12);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, now + 0.08);
      gain2.gain.setValueAtTime(0.18, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.22);
    } else if (type === 'confirm') {
      const freqs = [523.25, 659.25, 783.99];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * 0.04;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.25);
      });
    } else if (type === 'alert') {
      playJarvisSound('sos', true);
    } else if (type === 'sleep') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.exponentialRampToValueAtTime(493.88, now + 0.2);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    }
  } catch {}
}

export class JarvisAudioController {
  private recognition: any = null;
  private controlMode: JarvisControlMode = 'autonomous';
  private voiceState: JarvisVoiceState = 'idle';
  private isSystemActive: boolean = false;
  private isSpeakingNow: boolean = false;
  private currentSpokenText: string = '';
  private speechStartedAt: number = 0;
  private speechEndedAt: number = 0;

  private onTranscriptCb: TranscriptCallback | null = null;
  private onStateChangeCb: StateChangeCallback | null = null;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.setupRecognitionHandlers();
      }
    }
  }

  private setState(next: JarvisVoiceState) {
    this.voiceState = next;
    setGlobalSpeaking(next === 'speaking');
    if (this.onStateChangeCb) {
      this.onStateChangeCb(next);
    }
  }

  public getVoiceState(): JarvisVoiceState {
    return this.voiceState;
  }

  public getControlMode(): JarvisControlMode {
    return this.controlMode;
  }

  public isActive(): boolean {
    return this.isSystemActive;
  }

  public isSpeaking(): boolean {
    return this.isSpeakingNow;
  }

  /**
   * Normalizes text to compare microphone transcripts against Jarvis's own TTS output.
   * This prevents the acoustic feedback loop where Jarvis hears itself saying "At your service".
   */
  public normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Identifies any stop, silence, cancel, or barge-in interrupt command in English or Hindi.
   */
  public isInterruptPhrase(text: string): boolean {
    if (!text) return false;
    const norm = this.normalize(text);
    const words = norm.split(' ');
    const interruptWords = [
      'stop',
      'ruko',
      'ruk',
      'chup',
      'quiet',
      'pause',
      'cancel',
      'bas',
      'silence',
      'mute',
      'shant',
      'hush',
      'enough',
      'wait',
      'thamo',
    ];
    if (words.some((w) => interruptWords.includes(w))) return true;
    return (
      norm.includes('stop') ||
      norm.includes('shut up') ||
      norm.includes('band karo') ||
      norm.includes('ruk jao') ||
      norm.includes('arrey ruko') ||
      norm.includes('chup raho') ||
      norm.includes('hold on')
    );
  }

  /**
   * Checks if the microphone transcript is merely acoustic echo from Jarvis's own speaker output.
   */
  public isSelfEcho(heardText: string): boolean {
    if (!this.isSpeakingNow || !this.currentSpokenText) return false;
    const normHeard = this.normalize(heardText);
    const normSpoken = this.normalize(this.currentSpokenText);
    if (!normHeard || normHeard.length < 3) return true;

    // Explicit barge-in interruption keywords always break through immediately
    if (this.isInterruptPhrase(normHeard)) {
      return false;
    }

    // If the heard phrase is contained inside what Jarvis is currently speaking, it's speaker echo!
    if (normSpoken.includes(normHeard)) {
      return true;
    }

    // Check word overlap ratio: if >= 50% of heard words come from Jarvis's current sentence, ignore as echo
    const heardWords = normHeard.split(' ').filter((w) => w.length > 2);
    const spokenWords = new Set(normSpoken.split(' '));
    if (heardWords.length > 0) {
      const overlapCount = heardWords.filter((w) => spokenWords.has(w)).length;
      if (overlapCount / heardWords.length >= 0.5) {
        return true;
      }
    }

    return false;
  }

  private setupRecognitionHandlers() {
    if (!this.recognition) return;

    this.recognition.onresult = (event: any) => {
      // Cooldown guard: discard microphone audio for 450ms after speech ends to prevent speaker reverb
      if (Date.now() - this.speechEndedAt < 450) {
        return;
      }

      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += piece;
        } else {
          interimTranscript += piece;
        }
      }

      const candidate = (finalTranscript || interimTranscript).trim();
      if (!candidate) return;

      // 1. While Sahayak is actively speaking:
      if (this.isSpeakingNow) {
        // If the user explicitly commands STOP / RUKO:
        if (this.isInterruptPhrase(candidate)) {
          this.stopSpeaking(true);
          // STOP speech immediately and do NOT process candidate as a command
          return;
        }
        // If not an explicit interrupt keyword, ANY audio heard while speaking
        // is acoustic echo from device speakers. Reject it completely!
        return;
      }

      // 2. Self-echo guard for delayed transcripts
      if (this.isSelfEcho(candidate)) {
        return;
      }

      // 3. User said STOP while idle/listening:
      if (this.isInterruptPhrase(candidate)) {
        this.stopSpeaking(false);
        return;
      }

      if (interimTranscript && this.onTranscriptCb) {
        this.onTranscriptCb(interimTranscript.trim(), false);
      }

      if (finalTranscript && this.onTranscriptCb) {
        const cleaned = finalTranscript.trim();
        this.onTranscriptCb(cleaned, true);
        // In Manual mode, automatically stop mic after one complete command is captured
        if (this.controlMode === 'manual') {
          this.stopListening();
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }
      console.warn('[JarvisAudio] SpeechRecognition warning:', event.error);
    };

    this.recognition.onend = () => {
      // ONLY auto-restart in Autonomous mode when system is active
      if (this.isSystemActive && this.controlMode === 'autonomous') {
        if (this.restartTimer) clearTimeout(this.restartTimer);
        this.restartTimer = setTimeout(() => {
          if (this.isSystemActive && this.controlMode === 'autonomous') {
            try {
              this.recognition.start();
              if (!this.isSpeakingNow) {
                this.setState('listening');
              }
            } catch {
              // Already started
            }
          }
        }, 300);
      } else if (!this.isSpeakingNow) {
        this.setState('idle');
      }
    };
  }

  public configure(
    onTranscript: TranscriptCallback,
    onStateChange: StateChangeCallback
  ) {
    this.onTranscriptCb = onTranscript;
    this.onStateChangeCb = onStateChange;
  }

  public setControlMode(mode: JarvisControlMode) {
    this.controlMode = mode;
    if (mode === 'manual') {
      if (this.restartTimer) clearTimeout(this.restartTimer);
      try {
        this.recognition?.stop();
      } catch {}
      if (!this.isSpeakingNow) {
        this.setState('idle');
      }
    } else if (mode === 'autonomous' && this.isSystemActive) {
      this.startListening();
    }
  }

  public startSystem(mode: JarvisControlMode = this.controlMode) {
    this.isSystemActive = true;
    this.controlMode = mode;
    if (mode === 'autonomous') {
      this.startListening();
    } else {
      this.setState('idle');
    }
  }

  public stopSystem() {
    this.isSystemActive = false;
    if (this.restartTimer) clearTimeout(this.restartTimer);
    this.stopSpeaking(false);
    try {
      this.recognition?.stop();
    } catch {}
    this.setState('idle');
  }

  public startListening() {
    this.isSystemActive = true;
    if (this.isSpeakingNow) {
      this.stopSpeaking(true);
    }
    if (!this.recognition) return;
    try {
      this.recognition.start();
      this.setState('listening');
    } catch {
      this.setState('listening');
    }
  }

  public stopListening() {
    if (this.restartTimer) clearTimeout(this.restartTimer);
    try {
      this.recognition?.stop();
    } catch {}
    if (!this.isSpeakingNow) {
      this.setState('idle');
    }
  }

  public toggleManualMic() {
    if (this.isSpeakingNow) {
      this.stopSpeaking(true);
      this.startListening();
      return;
    }
    if (this.voiceState === 'listening') {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  public stopSpeaking(wasInterrupted: boolean = false) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    this.isSpeakingNow = false;
    this.currentSpokenText = '';
    this.speechEndedAt = Date.now();
    setGlobalSpeaking(false);

    if (wasInterrupted) {
      this.setState('interrupted');
      setTimeout(() => {
        if (this.isSystemActive && this.controlMode === 'autonomous') {
          this.setState('listening');
        } else {
          this.setState('idle');
        }
      }, 400);
    } else {
      if (this.isSystemActive && this.controlMode === 'autonomous') {
        this.setState('listening');
      } else {
        this.setState('idle');
      }
    }
  }

  public speak(text: string, onDone?: () => void) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onDone) onDone();
      return;
    }

    try {
      window.speechSynthesis.cancel();
    } catch {}

    const cleanText = cleanTextForJarvisSpeech(text);
    if (!cleanText) {
      if (onDone) onDone();
      return;
    }

    this.currentSpokenText = cleanText;
    this.isSpeakingNow = true;
    this.speechStartedAt = Date.now();
    this.setState('speaking');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.02;
    utterance.pitch = 0.95;

    const voice = pickBestJarvisVoice('en-GB');
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }

    utterance.onend = () => {
      this.isSpeakingNow = false;
      this.currentSpokenText = '';
      this.speechEndedAt = Date.now();
      setGlobalSpeaking(false);
      if (this.isSystemActive && this.controlMode === 'autonomous') {
        this.setState('listening');
      } else {
        this.setState('idle');
      }
      if (onDone) onDone();
    };

    utterance.onerror = () => {
      this.isSpeakingNow = false;
      this.currentSpokenText = '';
      this.speechEndedAt = Date.now();
      setGlobalSpeaking(false);
      if (this.isSystemActive && this.controlMode === 'autonomous') {
        this.setState('listening');
      } else {
        this.setState('idle');
      }
      if (onDone) onDone();
    };

    window.speechSynthesis.speak(utterance);
  }

  // Backwards compatibility helper methods
  public stop() {
    this.stopSpeaking(false);
  }
  public playChime() {
    playJarvisChime('wake');
  }
  public playSuccess() {
    playJarvisSound('heal', true);
  }
  public playAlert() {
    playJarvisSound('sos', true);
  }
}

export const jarvisAudio = new JarvisAudioController();
