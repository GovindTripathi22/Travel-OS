'use client';

/**
 * Natural British J.A.R.V.I.S. Audio Engine + Code-Synthesized Acoustic Sound Engine.
 * Features:
 * - Selects authentic British neural voices (Ryan / Thomas / Daniel / Arthur / Google UK English Male).
 * - Real-time hard-stop interrupt (stopJarvisSpeech).
 * - Scrubs symbols, markdown, and emojis before speaking.
 * - Native Web Audio API oscillators for wake, confirmation, healing, and SOS chimes.
 */

let speechListener: ((speaking: boolean) => void) | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const load = () => {
    cachedVoices = window.speechSynthesis.getVoices() || [];
  };
  load();
  window.speechSynthesis.onvoiceschanged = load;
}

export function onJarvisSpeechStateChange(cb: (speaking: boolean) => void) {
  speechListener = cb;
}

function setSpeaking(state: boolean) {
  if (speechListener) speechListener(state);
}

export function stopJarvisSpeech() {
  if (typeof window === 'undefined') return;
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch {}
  setSpeaking(false);
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

export function speakWithJarvisVoice(text: string, lang = 'en-GB', enabled = true) {
  if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const clean = cleanTextForJarvisSpeech(text);
  if (!clean) return;

  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    const voice = pickBestJarvisVoice(lang);
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    } else {
      u.lang = lang;
    }
    u.rate = lang.startsWith('ja') ? 0.94 : 0.99;
    u.pitch = lang.startsWith('ja') ? 1.0 : 0.93;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  } catch {
    setSpeaking(false);
  }
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

export const jarvisAudio = {
  speak: (text: string) => speakWithJarvisVoice(text, 'en-GB', true),
  stop: () => stopJarvisSpeech(),
  playChime: () => playJarvisSound('chime', true),
  playSuccess: () => playJarvisSound('heal', true),
  playAlert: () => playJarvisSound('sos', true),
};
