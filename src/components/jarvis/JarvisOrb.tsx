'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Sparkles,
  Radio,
  Hand,
  Terminal,
  ShieldAlert,
  Check,
} from 'lucide-react';
import { useTrip } from '@/lib/state/TripContext';
import { jarvisAudio, playJarvisChime } from '@/lib/audio/jarvisAudio';
import { JarvisControlMode, JarvisVoiceState } from '@/types';

export default function JarvisOrb() {
  const {
    isJarvisOpen,
    setIsJarvisOpen,
    isSpeaking,
    stopSpeaking,
    executeJarvisCommand,
    isSosModalOpen,
    setIsSosModalOpen,
    currentUser,
    voiceTriggerCount,
    jarvisControlMode,
    setJarvisControlMode,
    jarvisVoiceState,
    setJarvisVoiceState,
    setIsHUDModalOpen,
  } = useTrip();

  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [lastActionToast, setLastActionToast] = useState<string | null>(null);
  const [isSystemActive, setIsSystemActive] = useState<boolean>(false);

  // Guard ref so Jarvis NEVER repeats its greeting in a loop!
  const hasGreetedRef = useRef<boolean>(false);
  const executeCmdRef = useRef(executeJarvisCommand);
  executeCmdRef.current = executeJarvisCommand;

  // Bind audio controller callbacks
  useEffect(() => {
    jarvisAudio.configure(
      async (transcript, isFinal) => {
        if (!isFinal) {
          setLiveTranscript(transcript);
          return;
        }

        setLiveTranscript('');
        setJarvisVoiceState('processing');

        // Play wake chime
        playJarvisChime('wake');

        // Execute command
        const result = executeCmdRef.current(transcript);

        // Play confirmation chime
        setTimeout(() => {
          playJarvisChime('confirm');
        }, 150);

        if (result && result.summary) {
          setLastActionToast(result.summary);
          setTimeout(() => setLastActionToast(null), 4000);
        }
      },
      (newState: JarvisVoiceState) => {
        setJarvisVoiceState(newState);
      }
    );
  }, [setJarvisVoiceState]);

  // Global Keyboard Shortcuts: Alt+J to toggle Mic / Interrupt Jarvis, Escape to stop voice
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if ((e.altKey && (e.key === 'j' || e.key === 'J')) || (e.ctrlKey && e.code === 'Space')) {
        e.preventDefault();
        if (!isSystemActive) {
          setIsSystemActive(true);
          jarvisAudio.startSystem(jarvisControlMode);
        }
        jarvisAudio.toggleManualMic();
      } else if (e.key === 'Escape' && (isSpeaking || jarvisVoiceState === 'speaking')) {
        e.preventDefault();
        jarvisAudio.stopSpeaking(true);
        if (stopSpeaking) stopSpeaking();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSystemActive, jarvisControlMode, isSpeaking, jarvisVoiceState, stopSpeaking]);

  // Master Power Toggle
  const handleTogglePower = () => {
    if (isSystemActive) {
      setIsSystemActive(false);
      hasGreetedRef.current = false;
      jarvisAudio.stopSystem();
      playJarvisChime('sleep');
    } else {
      setIsSystemActive(true);
      jarvisAudio.startSystem(jarvisControlMode);
      playJarvisChime('wake');

      // Speak startup greeting ONLY ONCE per power-on
      if (!hasGreetedRef.current) {
        hasGreetedRef.current = true;
        const greeting =
          jarvisControlMode === 'autonomous'
            ? `Jarvis online in Autonomous Mode for ${currentUser.name.split(' ')[0]}. Standing by.`
            : `Jarvis online in Manual Mode. Press the microphone button or Alt+J to speak.`;
        jarvisAudio.speak(greeting);
      }
    }
  };

  // Switch between Autonomous and Manual modes
  const handleSwitchMode = (nextMode: JarvisControlMode) => {
    setJarvisControlMode(nextMode);
    jarvisAudio.setControlMode(nextMode);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2.5 pointer-events-auto">
      {/* 1. Live Transcript / Barge-In Banner */}
      {(liveTranscript || jarvisVoiceState === 'speaking' || isSpeaking || jarvisVoiceState === 'interrupted') && (
        <div className="max-w-xs sm:max-w-sm bg-[#141210]/95 border border-[#D97746]/50 backdrop-blur-xl px-4 py-2.5 rounded-2xl shadow-2xl text-xs text-[#FAF9F6] flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2 truncate">
            <span className="h-2 w-2 rounded-full bg-[#D97746] animate-ping shrink-0" />
            <span className="truncate">
              {jarvisVoiceState === 'interrupted'
                ? 'Speech interrupted — listening to you...'
                : liveTranscript
                ? `"${liveTranscript}..."`
                : 'Jarvis speaking (say "Stop" or press Esc)...'}
            </span>
          </div>
          {(jarvisVoiceState === 'speaking' || isSpeaking) && (
            <button
              onClick={() => {
                jarvisAudio.stopSpeaking(true);
                if (stopSpeaking) stopSpeaking();
              }}
              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-semibold shrink-0 flex items-center gap-1 transition active:scale-95"
              title="Interrupt Jarvis Speech (Esc)"
            >
              <Square className="w-3 h-3 fill-current" /> Stop
            </button>
          )}
        </div>
      )}

      {/* 2. Autonomous Action Toast */}
      {lastActionToast && (
        <div className="bg-emerald-950/95 text-emerald-100 text-xs font-bold px-4 py-2.5 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-center gap-2 max-w-sm backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{lastActionToast}</span>
        </div>
      )}

      {/* 3. Main Floating Jarvis Control Dock */}
      <div className="flex items-center gap-1.5 bg-[#141210]/95 border border-[#2E2822] hover:border-[#D97746]/60 backdrop-blur-2xl p-1.5 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.65)] transition-all duration-300">
        {/* Autonomous vs Manual Mode Segmented Switch */}
        <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => handleSwitchMode('autonomous')}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
              jarvisControlMode === 'autonomous'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
            title="Full Autonomous Mode: Continuous listening + acoustic echo suppression & barge-in"
          >
            <Radio className="w-3 h-3" />
            <span>Auto</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('manual')}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
              jarvisControlMode === 'manual'
                ? 'bg-[#D97746]/20 text-[#E68A57] border border-[#D97746]/40 shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
            title="Manual Mode: Push-to-Talk Mic button or Alt+J shortcut"
          >
            <Hand className="w-3 h-3" />
            <span>Manual</span>
          </button>
        </div>

        {/* Dedicated Push-to-Talk / Mic Control Button */}
        <button
          type="button"
          onClick={() => {
            if (!isSystemActive) {
              setIsSystemActive(true);
              jarvisAudio.startSystem(jarvisControlMode);
            }
            jarvisAudio.toggleManualMic();
          }}
          className={`p-2 rounded-xl border font-medium text-xs flex items-center gap-1.5 transition-all ${
            jarvisVoiceState === 'listening'
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 animate-pulse'
              : jarvisVoiceState === 'speaking' || isSpeaking
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
              : 'bg-white/5 hover:bg-white/10 border-white/10 text-stone-300'
          }`}
          title="Toggle Microphone / Interrupt Speech (Shortcut: Alt + J)"
        >
          {jarvisVoiceState === 'listening' ? (
            <Mic className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <MicOff className="w-3.5 h-3.5 text-stone-400" />
          )}
          <span className="hidden md:inline text-[11px]">
            {jarvisVoiceState === 'listening'
              ? 'Listening'
              : jarvisVoiceState === 'speaking' || isSpeaking
              ? 'Interrupt'
              : 'Mic'}
          </span>
        </button>

        {/* Open Jarvis Command HUD Modal */}
        <button
          type="button"
          onClick={() => {
            setIsHUDModalOpen(true);
            setIsJarvisOpen(true);
          }}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 transition-all hover:scale-105 active:scale-95"
          title="Open Jarvis Command HUD"
        >
          <Terminal className="w-3.5 h-3.5" />
        </button>

        {/* Quick Emergency SOS Trigger */}
        <button
          type="button"
          onClick={() => setIsSosModalOpen(true)}
          className="p-2 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-300 transition-all hover:scale-105 active:scale-95"
          title="Emergency SOS Broadcast"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
        </button>

        {/* Master Jarvis Orb Power Button */}
        <button
          type="button"
          onClick={handleTogglePower}
          className={`relative h-9 px-3 rounded-xl font-bold text-[11px] tracking-wider uppercase flex items-center gap-1.5 transition-all hover:scale-102 active:scale-98 ${
            isSystemActive
              ? 'bg-gradient-to-r from-cyan-500 to-[#D97746] text-white shadow-[0_0_20px_rgba(217,119,70,0.4)]'
              : 'bg-white/10 hover:bg-white/15 text-stone-300 border border-white/10'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isSystemActive ? 'JARVIS ON' : 'JARVIS'}</span>
        </button>
      </div>
    </div>
  );
}
