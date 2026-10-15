'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTrip } from '@/lib/state/TripContext';
import {
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Send,
  ShieldAlert,
  CreditCard,
  HeartPulse,
  Coffee,
  QrCode,
  Vote,
  Activity,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  Smartphone
} from 'lucide-react';
import { playJarvisChime } from '@/lib/audio/jarvisAudio';

export default function JarvisHUDModal() {
  const {
    isJarvisOpen,
    setIsJarvisOpen,
    isHUDModalOpen,
    setIsHUDModalOpen,
    isSpeaking,
    speakText,
    stopSpeaking,
    lastJarvisResult,
    executeJarvisCommand,
    setIsSosModalOpen,
    currentUser,
    jarvisControlMode,
    setJarvisControlMode,
  } = useTrip();

  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [transcriptPreview, setTranscriptPreview] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isOpen = isJarvisOpen || isHUDModalOpen;

  const handleClose = () => {
    setIsJarvisOpen(false);
    if (setIsHUDModalOpen) setIsHUDModalOpen(false);
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExecute = (textToRun?: string) => {
    const cmd = textToRun || input;
    if (!cmd.trim()) return;
    playJarvisChime('wake');
    executeJarvisCommand(cmd);
    setTimeout(() => playJarvisChime('confirm'), 200);
    setInput('');
    setTranscriptPreview('');
  };

  const startVoiceInput = () => {
    stopSpeaking();
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = 'en-IN';

          recognition.onstart = () => {
            setIsListening(true);
            setTranscriptPreview('Listening to your speech...');
          };

          recognition.onresult = (event: any) => {
            const current = event.results[0][0].transcript;
            setTranscriptPreview(current);
            if (event.results[0].isFinal) {
              setIsListening(false);
              handleExecute(current);
            }
          };

          recognition.onerror = () => {
            setIsListening(false);
          };

          recognition.onend = () => {
            setIsListening(false);
          };

          recognition.start();
        } catch {
          setIsListening(false);
        }
      }
    }
  };

  const QUICK_COMMANDS = [
    {
      label: 'Add ₹1,200 Surya Mahal Lunch',
      cmd: 'Add 1200 for Surya Mahal lunch paid by Rohan',
      icon: CreditCard,
      color: 'text-amber-400',
    },
    {
      label: 'Show Expense & Debt Ledger',
      cmd: 'Show expenses',
      icon: CreditCard,
      color: 'text-emerald-400',
    },
    {
      label: "Check Dadaji's BP Meds & Route",
      cmd: "When is Dadaji's medicine and check stairs",
      icon: HeartPulse,
      color: 'text-rose-400',
    },
    {
      label: 'Group Tired: Add 30m Rest Buffer',
      cmd: 'Group is tired, add a rest break',
      icon: Coffee,
      color: 'text-orange-400',
    },
    {
      label: 'Show Boarding Pass & QR Pass',
      cmd: 'Show my boarding pass and ticket QR',
      icon: QrCode,
      color: 'text-sky-400',
    },
    {
      label: 'Vote for Puppet Workshop',
      cmd: 'Vote for Puppet Workshop poll',
      icon: Vote,
      color: 'text-purple-400',
    },
    {
      label: 'Finalize Consensus Poll',
      cmd: 'Finalize the poll',
      icon: CheckCircle2,
      color: 'text-teal-400',
    },
    {
      label: 'Show Airport Rendezvous HUD',
      cmd: 'Show airport rendezvous',
      icon: Activity,
      color: 'text-indigo-400',
    },
    {
      label: 'Switch to Dadaji (Senior Mode)',
      cmd: 'Switch to Dadaji mode',
      icon: UserCheck,
      color: 'text-yellow-400',
    },
    {
      label: 'Simulate Mobile Frame',
      cmd: 'Switch to mobile view',
      icon: Smartphone,
      color: 'text-cyan-400',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#141210] border border-[#2E2822] rounded-3xl shadow-2xl text-white flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Arc Reactor Header */}
        <div className="p-4 sm:p-5 border-b border-[#2E2822] flex items-center justify-between bg-[#191613]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-[#D97746] flex items-center justify-center text-white shadow-lg shadow-[#D97746]/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#141210]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg tracking-tight">
                  JARVIS Travel Copilot
                </h2>
                <span className="text-[10px] uppercase font-bold bg-[#D97746]/20 text-[#E68A57] border border-[#D97746]/30 px-2 py-0.5 rounded-full">
                  100% Offline AI OS
                </span>
              </div>
              <p className="text-xs text-[#A8A29E]">
                Autonomous Voice &amp; Action Engine &bull; Zero External API Latency
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const next = jarvisControlMode === 'autonomous' ? 'manual' : 'autonomous';
                setJarvisControlMode(next);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-semibold text-cyan-300 flex items-center gap-1.5 transition"
              title="Toggle Autonomous / Manual Mode"
            >
              {jarvisControlMode === 'autonomous' ? 'Auto Mode' : 'Manual (Alt+J)'}
            </button>

            {isSpeaking ? (
              <button
                onClick={stopSpeaking}
                title="Stop Speaking"
                className="p-2 rounded-xl bg-rose-600 text-white hover:bg-rose-500 transition animate-pulse"
              >
                <VolumeX className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() =>
                  lastJarvisResult && speakText(lastJarvisResult.spokenResponse)
                }
                title="Replay Voice Briefing"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#E68A57] transition"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleClose}
              className="p-2 rounded-xl text-[#A8A29E] hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Holographic Wave Visualizer & Status */}
        <div className="px-5 py-4 bg-gradient-to-b from-[#1C1814] to-[#141210] border-b border-[#2E2822] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Audio Wave Bars */}
            <div className="flex items-end gap-1 h-6">
              {[0.4, 0.9, 0.6, 1.0, 0.5, 0.8, 0.3].map((height, i) => (
                <div
                  key={i}
                  style={{ height: isSpeaking || isListening ? `${height * 24}px` : '6px' }}
                  className={`w-1 rounded-full transition-all duration-200 ${
                    isListening
                      ? 'bg-amber-400 animate-pulse'
                      : isSpeaking
                      ? 'bg-[#D97746] animate-pulse'
                      : 'bg-[#4A423A]'
                  }`}
                />
              ))}
            </div>

            <div className="text-xs font-semibold">
              {isListening ? (
                <span className="text-amber-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  {transcriptPreview || 'Listening for travel command...'}
                </span>
              ) : isSpeaking ? (
                <span className="text-[#E68A57]">JARVIS Voice Feedback Streaming...</span>
              ) : (
                <span className="text-[#A8A29E]">
                  Active Traveler: <strong className="text-white">{currentUser.name}</strong> &bull; Ready for Action
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              setIsJarvisOpen(false);
              setIsSosModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1 bg-red-950/60 hover:bg-red-900 border border-red-700/60 text-red-300 rounded-full text-xs font-bold transition"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Emergency SOS</span>
          </button>
        </div>

        {/* Content Area: Action Results & Prompt Library */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Active Result Card if triggered */}
          {lastJarvisResult && (
            <div className="bg-[#1C1814] border border-[#3E352B] rounded-2xl p-4 sm:p-5 shadow-inner space-y-3 animate-in zoom-in-95 duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-emerald-400 tracking-wide uppercase">
                    Action Executed in OS
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-[#8C847A] bg-white/5 px-2 py-0.5 rounded-md">
                  {lastJarvisResult.intent}
                </span>
              </div>

              <div className="text-sm sm:text-base font-bold text-[#FAF8F5]">
                {lastJarvisResult.summary}
              </div>

              <p className="text-xs sm:text-sm text-[#C4BCB3] leading-relaxed bg-[#141210] p-3 rounded-xl border border-[#2E2822]">
                &ldquo;{lastJarvisResult.spokenResponse}&rdquo;
              </p>

              {/* Specific Visual Card Data */}
              {lastJarvisResult.cardType === 'expense' && lastJarvisResult.cardData && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <span className="text-[10px] text-[#8C847A] block">Total Amount</span>
                    <strong className="text-sm text-[#D97746]">
                      ₹{lastJarvisResult.cardData.amount}
                    </strong>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <span className="text-[10px] text-[#8C847A] block">Paid By</span>
                    <strong className="text-sm text-white">
                      {lastJarvisResult.cardData.paidByName}
                    </strong>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <span className="text-[10px] text-[#8C847A] block">Per Person</span>
                    <strong className="text-sm text-white">
                      ₹{lastJarvisResult.cardData.perPerson}
                    </strong>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <span className="text-[10px] text-[#8C847A] block">Settlement</span>
                    <strong className="text-sm text-emerald-400">Auto-Minimized</strong>
                  </div>
                </div>
              )}

              {lastJarvisResult.cardType === 'health' && lastJarvisResult.cardData && (
                <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-xs space-y-1.5">
                  <div className="flex justify-between text-[#E68A57] font-bold">
                    <span>{lastJarvisResult.cardData.patient}</span>
                    <span>{lastJarvisResult.cardData.condition}</span>
                  </div>
                  <div className="text-[#C4BCB3]">
                    • Morning: {lastJarvisResult.cardData.morningDose}
                  </div>
                  <div className="text-[#C4BCB3]">
                    • Evening: {lastJarvisResult.cardData.eveningDose}
                  </div>
                  <div className="text-emerald-400 font-semibold pt-1">
                    ✓ {lastJarvisResult.cardData.mobilitySafeguard}
                  </div>
                </div>
              )}

              {lastJarvisResult.cardType === 'ticket' && lastJarvisResult.cardData && (
                <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
                  <div className="w-16 h-16 bg-white rounded-lg p-1.5 shrink-0 flex items-center justify-center">
                    <QrCode className="w-12 h-12 text-[#1C1917]" />
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-sm text-white">
                      {lastJarvisResult.cardData.title}
                    </div>
                    <div className="text-[#8C847A]">
                      Ref: <span className="font-mono text-white">{lastJarvisResult.cardData.referenceNumber}</span>
                    </div>
                    <div className="text-emerald-400 font-medium">✓ Cached for Offline Gate Scanning</div>
                  </div>
                </div>
              )}

              {lastJarvisResult.cardType === 'rest' && lastJarvisResult.cardData && (
                <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-xs space-y-1">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Coffee className="w-4 h-4" />
                    <span>{lastJarvisResult.cardData.title} ({lastJarvisResult.cardData.durationMinutes} mins)</span>
                  </div>
                  <div className="text-[#8C847A]">Location: {lastJarvisResult.cardData.location}</div>
                  <div className="text-[#C4BCB3]">{lastJarvisResult.cardData.benefit}</div>
                </div>
              )}

              {/* Quick follow-ups */}
              {lastJarvisResult.quickReplies && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {lastJarvisResult.quickReplies.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => handleExecute(r)}
                      className="text-[11px] font-semibold bg-white/10 hover:bg-[#D97746] hover:text-white px-2.5 py-1 rounded-full text-[#E68A57] border border-white/10 transition"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Real-World Travel Commands */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#8C847A] mb-2.5">
              Instant Real-World Travel Scenarios (Click or Say)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {QUICK_COMMANDS.map((item, i) => {
                const Icon = item.icon;
                return (
                  <button
                    key={i}
                    onClick={() => handleExecute(item.cmd)}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-[#191613] hover:bg-[#24201C] border border-[#2E2822] hover:border-[#D97746]/50 text-left transition group"
                  >
                    <div className={`p-2 rounded-xl bg-white/5 group-hover:scale-105 transition ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[#FAF8F5] truncate group-hover:text-[#E68A57] transition">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-[#8C847A] truncate">
                        &ldquo;{item.cmd}&rdquo;
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#5E564E] group-hover:text-white transition shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Input & Voice Controls Footer */}
        <div className="p-4 bg-[#191613] border-t border-[#2E2822]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleExecute();
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={startVoiceInput}
              title="Hold to Speak"
              className={`p-3 rounded-2xl transition flex items-center justify-center shrink-0 ${
                isListening
                  ? 'bg-amber-500 text-black animate-pulse font-bold'
                  : 'bg-white/10 hover:bg-white/20 text-[#E68A57]'
              }`}
            >
              {isListening ? <Mic className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
            </button>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Speak or type: 'Add ₹800 taxi', 'Dadaji meds', 'Add rest buffer'..."
              className="flex-1 bg-[#141210] border border-[#2E2822] focus:border-[#D97746] text-xs sm:text-sm text-white px-4 py-3 rounded-2xl focus:outline-none placeholder-[#6E665E]"
            />

            <button
              type="submit"
              disabled={!input.trim()}
              className="p-3 bg-[#D97746] hover:bg-[#C26333] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-bold shadow-md transition active:scale-95 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
