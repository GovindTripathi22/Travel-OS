'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTrip } from '@/lib/state/TripContext';
import {
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  VolumeX,
  ShieldAlert,
  Radio,
  Headphones,
  Check
} from 'lucide-react';
import { playJarvisChime } from '@/lib/audio/jarvisAudio';

export default function JarvisOrb() {
  const {
    isJarvisOpen,
    setIsJarvisOpen,
    isSpeaking,
    stopSpeaking,
    executeJarvisCommand,
    setIsSosModalOpen,
    currentUser,
    voiceTriggerCount,
  } = useTrip();

  const [isListening, setIsListening] = useState(false);
  const [isHandsFree, setIsHandsFree] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [lastActionToast, setLastActionToast] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isHandsFreeRef = useRef(isHandsFree);
  isHandsFreeRef.current = isHandsFree;
  const isSpeakingRef = useRef(isSpeaking);
  isSpeakingRef.current = isSpeaking;
  const prevVoiceCountRef = useRef(voiceTriggerCount);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Indian English / Global English support

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        // Acoustic Mutex Guard: Ignore speech if JARVIS is actively speaking or cooling down
        if (isSpeakingRef.current) {
          return;
        }

        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const currentSpeech = final || interim;
        setLiveTranscript(currentSpeech);

        if (final && final.trim().length > 1) {
          // Play Iron Man Wake Chime
          playJarvisChime('wake');

          // Execute action autonomously!
          const result = executeJarvisCommand(final.trim());

          // Play confirmation chime
          setTimeout(() => {
            playJarvisChime('confirm');
          }, 200);

          setLastActionToast(result.summary);
          setLiveTranscript('');
          setTimeout(() => setLastActionToast(null), 4000);
        }
      };

      recognition.onerror = (e: any) => {
        if (e.error === 'not-allowed') {
          setIsHandsFree(false);
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // Autonomous Auto-Restart if Hands-Free Mode is Enabled!
        if (isHandsFreeRef.current) {
          setTimeout(() => {
            if (isHandsFreeRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch {
                // already running
              }
            }
          }, 350);
        }
      };

      recognitionRef.current = recognition;
    } catch {
      // Browser SpeechRecognition not permitted
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [executeJarvisCommand]);

  // Toggle Hands-Free Autonomous Mode
  const toggleHandsFree = () => {
    if (!recognitionRef.current) {
      setIsJarvisOpen(true);
      return;
    }

    if (isHandsFree) {
      setIsHandsFree(false);
      playJarvisChime('sleep');
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
      setLiveTranscript('');
    } else {
      setIsHandsFree(true);
      playJarvisChime('wake');
      try {
        recognitionRef.current.start();
      } catch {}
    }
  };

  // 1-Click Autonomous Voice Trigger from Header, Banner, or Anywhere in App
  useEffect(() => {
    if (voiceTriggerCount > prevVoiceCountRef.current) {
      prevVoiceCountRef.current = voiceTriggerCount;
      if (!isHandsFree) {
        toggleHandsFree();
      } else {
        playJarvisChime('wake');
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch {}
        }
      }
    }
  }, [voiceTriggerCount, isHandsFree]);

  // Keyboard shortcut (Alt + J) to toggle autonomous JARVIS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
        toggleHandsFree();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHandsFree]);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 pointer-events-auto">
      {/* 1. Real-Time Spoken Transcript Bubble (Appears as you speak) */}
      {liveTranscript && (
        <div className="bg-[#1C1917]/95 text-white text-xs font-semibold px-4 py-2 rounded-2xl shadow-2xl border border-[#D97746] flex items-center gap-2 max-w-sm backdrop-blur-md animate-in slide-in-from-bottom-2 duration-150">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D97746] animate-ping shrink-0" />
          <span className="truncate">&ldquo;{liveTranscript}&rdquo;</span>
        </div>
      )}

      {/* 2. Autonomous Action Toast (Appears when JARVIS executes in background) */}
      {lastActionToast && (
        <div className="bg-emerald-950/95 text-emerald-100 text-xs font-bold px-4 py-2.5 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-center gap-2 max-w-sm backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{lastActionToast}</span>
        </div>
      )}

      {/* 3. Hands-Free Indicator Pill */}
      {isHandsFree && !liveTranscript && !lastActionToast && (
        <div className="bg-[#1C1917]/90 text-white text-[11px] font-semibold px-3 py-1 rounded-full shadow-lg border border-cyan-500/40 flex items-center gap-2 backdrop-blur-sm animate-pulse">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>Autonomous Voice Listening &bull; Say &ldquo;Jarvis...&rdquo;</span>
        </div>
      )}

      {/* 4. Main JARVIS Arc Reactor HUD Orb */}
      <div className="relative group">
        {/* Holographic Glowing Rings */}
        <div
          className={`absolute -inset-1 rounded-full blur-md transition duration-500 ${
            isHandsFree
              ? 'bg-gradient-to-r from-cyan-500 to-[#D97746] opacity-90 animate-pulse'
              : isSpeaking
              ? 'bg-[#4D7C5F] opacity-80 animate-pulse'
              : 'bg-gradient-to-r from-[#D97746] to-[#E68A57] opacity-40 group-hover:opacity-75'
          }`}
        />

        <div className="relative flex items-center bg-[#141210]/95 backdrop-blur-md border border-[#2E2822] hover:border-[#D97746]/60 rounded-full p-1.5 shadow-2xl transition-all duration-300 hover:shadow-[0_8px_30px_rgba(217,119,70,0.25)] hover:-translate-y-0.5">
          {/* Hands-Free Toggle Button */}
          <button
            onClick={toggleHandsFree}
            title={
              isHandsFree
                ? 'Turn Off Hands-Free Autonomous Mode'
                : 'Turn ON Hands-Free Autonomous Mode (Alt + J)'
            }
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 ${
              isHandsFree
                ? 'bg-cyan-500 text-black font-extrabold shadow-lg shadow-cyan-500/30 scale-105'
                : 'text-[#A8A29E] hover:text-white hover:bg-white/10'
            }`}
          >
            {isHandsFree ? (
              <Radio className="w-4 h-4 animate-spin" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          {/* JARVIS Core Arc Display — Clicking immediately turns ON voice listening */}
          <button
            onClick={toggleHandsFree}
            title={isHandsFree ? 'JARVIS Listening — Click to Pause' : 'Click to Turn ON Voice Listening'}
            className="flex items-center gap-2.5 px-3 py-1.5 pr-2 text-white hover:opacity-95 transition-all duration-200 text-left hover:scale-[1.02] active:scale-98"
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-white shadow-2xs transition-all duration-300 ${
                isHandsFree ? 'bg-cyan-600 animate-pulse' : 'bg-[#D97746] hover:bg-[#C26333]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-black tracking-tight flex items-center gap-1.5">
                <span>JARVIS</span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border transition-colors ${
                    isHandsFree
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-700/50'
                      : 'bg-[#D97746]/20 text-[#E68A57] border-[#D97746]/30'
                  }`}
                >
                  {isHandsFree ? 'LISTENING' : 'VOICE OS'}
                </span>
              </div>
              <div className="text-[10px] text-[#A8A29E] font-medium leading-tight">
                {isSpeaking
                  ? 'Speaking response...'
                  : isHandsFree
                  ? 'Listening for voice... (Speak now)'
                  : 'Click to Turn On Voice'}
              </div>
            </div>
          </button>

          {/* Quick HUD Cheatsheet & Terminal Button */}
          <button
            onClick={() => setIsJarvisOpen(true)}
            title="Open JARVIS Command Cheatsheet & Manual Input HUD"
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-[#A8A29E] hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D97746]" />
          </button>

          {/* Quick Emergency SOS Trigger */}
          <button
            onClick={() => setIsSosModalOpen(true)}
            title="Emergency Hospital & Police SOS"
            className="w-8 h-8 rounded-full bg-red-950/70 hover:bg-red-900 border border-red-700/60 text-red-300 hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 ml-1"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
