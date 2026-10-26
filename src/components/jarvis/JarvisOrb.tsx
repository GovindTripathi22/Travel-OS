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
import { jarvisAudio, playJarvisChime, unlockAudio } from '@/lib/audio/jarvisAudio';
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

        const isStop = /^(?:stop|ruko|chup|quiet|pause|cancel|bas|silence|mute|band karo)\b/i.test(transcript.trim());
        setLiveTranscript('');

        if (isStop) {
          executeCmdRef.current(transcript);
          setJarvisVoiceState('idle');
          return;
        }

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
            ? `Namaste! Sahayak aapki seva mein hazir hai, ${currentUser.name.split(' ')[0]}. Boliye, main kya madad karu?`
            : `Namaste! Sahayak Manual Mode mein hai. Microphone dabayein ya Alt+J se bole.`;
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
        <div className="max-w-xs sm:max-w-sm bg-[#26221E]/95 border border-[#D97746]/50 backdrop-blur-xl px-4 py-2.5 rounded-2xl shadow-2xl text-xs text-[#FAF9F6] flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2 truncate">
            <span className="h-2 w-2 rounded-full bg-[#D97746] animate-ping shrink-0" />
            <span className="truncate">
              {jarvisVoiceState === 'interrupted'
                ? 'Speech interrupted — listening to you...'
                : liveTranscript
                ? `"${liveTranscript}..."`
                : 'Sahayak bol raha hai (say "Stop", "Ruko" or press Esc)...'}
            </span>
          </div>
          {(jarvisVoiceState === 'speaking' || isSpeaking) && (
            <button
              onClick={() => {
                jarvisAudio.stopSpeaking(true);
                if (stopSpeaking) stopSpeaking();
              }}
              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-semibold shrink-0 flex items-center gap-1 transition active:scale-95"
              title="Interrupt Sahayak Speech (Esc)"
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

      {/* 3. Main Floating Sahayak Luxury Capsule Dock */}
      <div className="flex items-center gap-1.5 sm:gap-2 bg-[#38322B]/90 hover:bg-[#433B32] border border-white/20 hover:border-[#D97746]/50 backdrop-blur-xl px-2 sm:px-2.5 py-1.5 rounded-full shadow-[0_10px_35px_rgba(28,25,23,0.30)] transition-all duration-300 max-w-[calc(100vw-24px)] overflow-x-auto scrollbar-none">
        {/* Master Power & Brand Capsule */}
        <button
          type="button"
          onClick={handleTogglePower}
          className={`group flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
            isSystemActive
              ? 'bg-[#D97746] text-white shadow-xs'
              : 'text-[#FAF8F5]/80 hover:text-white hover:bg-white/10'
          }`}
          title={isSystemActive ? 'Sahayak Voice Active — Click to turn off' : 'Click to activate Sahayak Voice Assistant'}
        >
          <span className="relative flex h-2 w-2">
            {isSystemActive && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isSystemActive ? 'bg-emerald-400' : 'bg-stone-500'
              }`}
            />
          </span>
          <span className="tracking-tight">
            {isSystemActive ? 'Sahayak On' : 'Sahayak'}
          </span>
          <span className="text-[10px] opacity-60 font-serif italic hidden sm:inline">
            सहायक
          </span>
        </button>

        {/* Mode Toggle (Auto / Manual) */}
        <div className="flex items-center bg-white/5 p-0.5 rounded-full border border-white/5">
          <button
            type="button"
            onClick={() => handleSwitchMode('autonomous')}
            className={`px-2 py-1 rounded-full text-[10px] font-semibold transition-all ${
              jarvisControlMode === 'autonomous'
                ? 'bg-white/20 text-white'
                : 'text-stone-400 hover:text-stone-200'
            }`}
            title="Auto: Continuous speech recognition"
          >
            Auto
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('manual')}
            className={`px-2 py-1 rounded-full text-[10px] font-semibold transition-all ${
              jarvisControlMode === 'manual'
                ? 'bg-white/20 text-white'
                : 'text-stone-400 hover:text-stone-200'
            }`}
            title="Manual: Push-to-Talk"
          >
            Manual
          </button>
        </div>

        {/* Dedicated Push-to-Talk Mic Button */}
        <button
          type="button"
          onClick={() => {
            if (!isSystemActive) {
              setIsSystemActive(true);
              jarvisAudio.startSystem(jarvisControlMode);
            }
            jarvisAudio.toggleManualMic();
          }}
          className={`p-2 rounded-full transition-all duration-200 ${
            jarvisVoiceState === 'listening'
              ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-105'
              : jarvisVoiceState === 'speaking' || isSpeaking
              ? 'bg-amber-500 text-white animate-pulse'
              : 'text-stone-300 hover:text-white hover:bg-white/10'
          }`}
          title="Toggle Mic / Speak (Alt + J)"
          aria-label="Microphone"
        >
          {jarvisVoiceState === 'listening' ? (
            <Mic className="w-4 h-4" />
          ) : (
            <MicOff className="w-4 h-4" />
          )}
        </button>

        {/* Divider */}
        <div className="w-[1px] h-4 bg-white/10" />

        {/* Command HUD Modal Trigger */}
        <button
          type="button"
          onClick={() => {
            setIsHUDModalOpen(true);
            setIsJarvisOpen(true);
          }}
          className="p-1.5 text-stone-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          title="Open Sahayak Command HUD"
          aria-label="Open Command HUD"
        >
          <Terminal className="w-3.5 h-3.5" />
        </button>

        {/* Emergency SOS Button */}
        <button
          type="button"
          onClick={() => setIsSosModalOpen(true)}
          className="p-1.5 text-rose-400 hover:text-rose-300 rounded-full hover:bg-rose-500/20 transition-colors"
          title="Emergency SOS Broadcast"
          aria-label="Emergency SOS"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
