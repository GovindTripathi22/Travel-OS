'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTrip } from '@/lib/state/TripContext';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  Smartphone,
  Monitor,
  Sparkles,
  ChevronDown,
  Check,
  ShieldCheck,
  LogOut,
  LogIn,
  CloudRain,
  Sun,
  Mic,
  MicOff,
  Square,
  Wand2,
  Bot,
  SlidersHorizontal,
  ArrowRight,
  Zap,
  User as UserIcon,
  X,
} from 'lucide-react';
import { createSvgAvatar, AVATAR_PRESETS } from '@/lib/state/mockData';

export default function Header() {
  const {
    currentUser,
    setCurrentUser,
    updateCurrentUser,
    users,
    setIsAssistantOpen,
    viewMode,
    setViewMode,
    weather,
    toggleWeather,
    currency,
    setCurrency,
    isSpeaking,
    isJarvisSpeaking,
    stopSpeaking,
    stopJarvisVoiceNow,
    executeJarvisCommand,
    executeAutonomousJarvis,
  } = useTrip();

  const {
    user,
    activeProfile,
    isAdmin,
    setIsAuthModalOpen,
    signOut,
    switchQuickCompanion,
  } = useAuth();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEnvOpen, setIsEnvOpen] = useState(false);
  const [showQuickChips, setShowQuickChips] = useState(false);
  const [quickCmd, setQuickCmd] = useState('');
  const [listening, setListening] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [nameInput, setNameInput] = useState(currentUser.name);
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser.avatar);

  const safeAvatarSrc = (u: { name: string; avatar?: string }) => {
    if (u.avatar && u.avatar.startsWith('data:image/svg+xml')) return u.avatar;
    const initials = (u.name || 'TR')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'TR';
    return u.avatar || createSvgAvatar(initials, '#ea580c', '#c2410c');
  };

  const dropdownRef = useRef<HTMLDivElement>(null);
  const envRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Sync active profile from Auth into TripContext only when activeProfile genuinely changes
  const prevActiveProfileIdRef = useRef(activeProfile?.id);
  useEffect(() => {
    if (activeProfile && activeProfile.id !== prevActiveProfileIdRef.current) {
      prevActiveProfileIdRef.current = activeProfile.id;
      if (activeProfile.id !== currentUser.id) {
        setCurrentUser(activeProfile);
      }
    }
  }, [activeProfile, currentUser.id, setCurrentUser]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
      if (envRef.current && !envRef.current.contains(target)) {
        setIsEnvOpen(false);
      }
      if (chipsRef.current && !chipsRef.current.contains(target)) {
        setShowQuickChips(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleVoiceInput = () => {
    if (stopJarvisVoiceNow) stopJarvisVoiceNow();
    else if (stopSpeaking) stopSpeaking();

    if (listening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setListening(false);
      return;
    }

    if (typeof window === 'undefined') return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setListening(true);
      setTimeout(() => {
        setListening(false);
        const demoCmd = 'Jarvis, fix all schedule conflicts';
        setQuickCmd(demoCmd);
        if (executeAutonomousJarvis) executeAutonomousJarvis(demoCmd);
        else executeJarvisCommand(demoCmd);
      }, 1000);
      return;
    }

    try {
      const rec = new SpeechRec();
      recognitionRef.current = rec;
      rec.lang = 'en-US';
      rec.continuous = false; // Single-shot prevents browser hanging
      rec.interimResults = false;
      setListening(true);

      rec.onresult = (e: any) => {
        const transcript = e.results?.[0]?.[0]?.transcript || '';
        setListening(false);
        if (transcript.trim()) {
          setQuickCmd(transcript);
          if (executeAutonomousJarvis) executeAutonomousJarvis(transcript);
          else executeJarvisCommand(transcript);
        }
      };
      rec.onerror = () => {
        setListening(false);
      };
      rec.onend = () => {
        setListening(false);
      };
      rec.start();
    } catch {
      setListening(false);
    }
  };

  const handleCommandSubmit = () => {
    if (!quickCmd.trim()) return;
    if (executeAutonomousJarvis) executeAutonomousJarvis(quickCmd);
    else executeJarvisCommand(quickCmd);
    setQuickCmd('');
    setShowQuickChips(false);
  };

  const handleChipClick = (cmd: string) => {
    if (executeAutonomousJarvis) executeAutonomousJarvis(cmd);
    else executeJarvisCommand(cmd);
    setShowQuickChips(false);
  };

  const QUICK_ACTION_CHIPS = [
    { label: '⚡ Fix Overlaps', cmd: 'Jarvis, fix all schedule conflicts' },
    { label: '🕒 Move Amber Fort → 10:00', cmd: 'Jarvis, move Amber Fort to 10:00' },
    { label: '🌧️ Rain Swap', cmd: 'Jarvis, it is raining, swap outdoor stops to indoor' },
    { label: '👴 Switch to Dadaji', cmd: 'Jarvis, switch to Dadaji' },
    { label: '💴 Currency → JPY', cmd: 'Jarvis, change currency to JPY' },
    { label: '🗳️ Lock Poll Winner', cmd: 'Jarvis, commit poll winner to itinerary' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-[#EBE7DF] transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo & Editorial Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <img
              src="/logo.jpg"
              alt="Sahyatri Logo"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-contain shadow-2xs border border-[#EBE7DF] transition-transform duration-300 hover:scale-105"
            />
            <div className="flex items-baseline gap-2">
              <span className="font-serif-title text-lg sm:text-xl font-bold tracking-tight text-[#1C1917]">
                Sahyatri
              </span>
              <span className="text-[10px] font-bold tracking-widest text-[#D97746] uppercase hidden sm:inline px-2 py-0.5 rounded-full bg-[#FAF5EE] border border-[#E8DFC8]/60">
                AI Travel OS
              </span>
            </div>
          </div>

          {/* Center: Autonomous Omni-Voice & Command Capsule */}
          <div className="relative flex-1 max-w-lg hidden md:block" ref={chipsRef}>
            <div className="bg-white hover:bg-[#FAF9F6]/60 focus-within:bg-white border border-[#EBE7DF] hover:border-[#D6D0C5] focus-within:border-[#D97746] rounded-full px-3.5 py-1.5 shadow-2xs hover:shadow-xs transition-all duration-300 flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#D97746] shrink-0" />
              <input
                type="text"
                value={quickCmd}
                onChange={(e) => setQuickCmd(e.target.value)}
                onFocus={() => setShowQuickChips(true)}
                onKeyDown={(e) => e.key === 'Enter' && handleCommandSubmit()}
                placeholder='Ask JARVIS or type: "switch to Dadaji", "fix overlaps"...'
                className="w-full bg-transparent text-xs text-[#1C1917] placeholder-[#A8A29E] focus:outline-none"
              />

              {/* Quick Actions Trigger Button */}
              <button
                type="button"
                onClick={() => setShowQuickChips(!showQuickChips)}
                title="View quick autonomous voice prompts"
                className={`p-1.5 rounded-full text-xs transition-all duration-200 ${
                  showQuickChips
                    ? 'bg-[#FAF5EE] text-[#D97746]'
                    : 'text-[#A8A29E] hover:text-[#1C1917] hover:bg-[#F4F1EA]'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
              </button>

              {/* Microphone Voice Button */}
              <button
                type="button"
                onClick={handleVoiceInput}
                title={listening ? 'Stop voice recognition' : 'Speak voice command to JARVIS'}
                className={`p-1.5 rounded-full text-xs font-semibold flex items-center justify-center transition-all duration-200 ${
                  listening
                    ? 'bg-rose-500 text-white animate-pulse scale-110 shadow-sm'
                    : 'bg-[#F4F1EA] hover:bg-[#EBE7DF] text-[#1C1917] hover:scale-105 active:scale-95'
                }`}
              >
                {listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>

              {/* Execute Arrow Button */}
              {quickCmd.trim() && (
                <button
                  type="button"
                  onClick={handleCommandSubmit}
                  className="p-1.5 rounded-full bg-[#1C1917] hover:bg-[#D97746] text-white hover:scale-105 active:scale-95 transition-all duration-200 shadow-2xs"
                  title="Execute command"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Action Suggestion Chips Popover (Appears gracefully on focus/toggle) */}
            {showQuickChips && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-[#EBE7DF] p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#A8A29E]">
                    ⚡ Quick Autonomous Actions
                  </span>
                  <span className="text-[10px] text-[#78716C]">Sub-5ms Edge SLM</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_ACTION_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleChipClick(chip.cmd)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#FAF9F6] hover:bg-[#FAF5EE] text-[#44403C] hover:text-[#D97746] border border-[#EBE7DF] hover:border-[#E8DFC8] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Section: Minimum, High-Value Relevant Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Hard-Stop Voice Button (Only appears when JARVIS is actively speaking) */}
            {(isSpeaking || isJarvisSpeaking) && (
              <button
                onClick={() => {
                  if (stopJarvisVoiceNow) stopJarvisVoiceNow();
                  else if (stopSpeaking) stopSpeaking();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 animate-pulse hover:scale-105 active:scale-95 transition-all duration-200"
                title="Hard interrupt JARVIS speech immediately"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>Stop Voice</span>
              </button>
            )}

            {/* Contextual Trip Environment Pill (Weather · Currency · Viewport) */}
            <div className="relative" ref={envRef}>
              <button
                onClick={() => setIsEnvOpen(!isEnvOpen)}
                title="Trip Simulator & Settings (Currency, Weather, Viewport)"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#F5F2EB] border border-[#EBE7DF] hover:border-[#D6D0C5] text-xs font-semibold text-[#1C1917] shadow-2xs hover:shadow-xs transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
              >
                {weather === 'Rainy' ? (
                  <CloudRain className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span className="hidden sm:inline">{weather}</span>
                <span className="text-[#A8A29E]">·</span>
                <span className="font-mono text-[11px] font-bold text-[#D97746]">{currency}</span>
                <ChevronDown className="w-3 h-3 text-[#A8A29E]" />
              </button>

              {/* Environment Popover Menu */}
              {isEnvOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-[#EBE7DF] p-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
                  {/* Currency Selector */}
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#A8A29E] mb-1.5 px-1">
                      Active Currency
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {(['INR', 'USD', 'EUR', 'JPY'] as const).map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            setCurrency(c);
                            setIsEnvOpen(false);
                          }}
                          className={`py-1 text-center rounded-lg font-mono text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${
                            currency === c
                              ? 'bg-[#1C1917] text-white shadow-xs'
                              : 'bg-[#FAF9F6] text-[#78716C] hover:text-[#1C1917] border border-[#EBE7DF]'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Weather Simulator */}
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#A8A29E] mb-1.5 px-1">
                      Weather Simulator
                    </div>
                    <button
                      onClick={() => {
                        toggleWeather();
                        setIsEnvOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 hover:scale-[1.02] active:scale-95 ${
                        weather === 'Rainy'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {weather === 'Rainy' ? (
                          <CloudRain className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Sun className="w-4 h-4 text-amber-500" />
                        )}
                        <span>{weather === 'Rainy' ? 'Rainy Mode (Sim)' : 'Sunny Mode (Sim)'}</span>
                      </div>
                      <span className="text-[10px] text-[#A8A29E]">Toggle</span>
                    </button>
                  </div>

                  {/* Viewport Frame Toggle */}
                  <div className="pt-2 border-t border-[#EBE7DF]">
                    <button
                      onClick={() => {
                        setViewMode(viewMode === 'full' ? 'phone_preview' : 'full');
                        setIsEnvOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#78716C] hover:text-[#1C1917] hover:bg-[#F4F1EA] transition"
                    >
                      <div className="flex items-center gap-2">
                        {viewMode === 'full' ? (
                          <Smartphone className="w-4 h-4 text-[#D97746]" />
                        ) : (
                          <Monitor className="w-4 h-4 text-[#D97746]" />
                        )}
                        <span>{viewMode === 'full' ? 'Simulate Mobile Frame' : 'Full Screen View'}</span>
                      </div>
                      <span className="text-[10px] text-[#A8A29E]">Switch</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Ask AI Assistant Button */}
            <button
              onClick={() => setIsAssistantOpen(true)}
              className="px-3 py-1.5 bg-[#FAF5EE] hover:bg-[#F4ECE0] border border-[#E8DFC8] text-[#D97746] hover:text-[#C26333] rounded-full text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center gap-1.5 shadow-2xs hover:shadow-xs"
              title="Open Personal Assistant Drawer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>

            {/* Authenticated Traveler Profile Pill & Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white border border-[#EBE7DF] hover:border-[#D6D0C5] text-xs font-semibold text-[#1C1917] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 shadow-2xs hover:shadow-xs"
              >
                <img
                  src={safeAvatarSrc(currentUser)}
                  alt={currentUser.name}
                  onError={(e) => {
                    const initials = (currentUser.name || 'TR').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'TR';
                    (e.target as HTMLImageElement).src = createSvgAvatar(initials, '#ea580c', '#c2410c');
                  }}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="max-w-[70px] sm:max-w-none truncate font-semibold">
                  {currentUser.name.split(' ')[0]}
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider hidden sm:inline ${
                    isAdmin
                      ? 'bg-orange-100 text-[#D97746] border border-orange-200'
                      : 'bg-stone-100 text-[#78716C] border border-stone-200'
                  }`}
                >
                  {isAdmin ? 'Admin' : 'Companion'}
                </span>
                <ChevronDown className="w-3 h-3 text-[#A8A29E]" />
              </button>

              {/* Authenticated Account & RBAC Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-[#EBE7DF] p-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2.5">
                  {/* Active Account Identity Card */}
                  <div className="p-2.5 rounded-xl bg-[#FAF9F6] border border-[#EBE7DF]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#A8A29E]">
                        Active Account
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                        <ShieldCheck className="w-3 h-3" /> Firebase Auth
                      </span>
                    </div>
                    <div className="text-xs font-bold text-[#1C1917] mt-1">
                      {currentUser.name}
                    </div>
                    <div className="text-[11px] text-[#78716C] truncate">
                      {user?.email || `${currentUser.id}@traveler.sahyatri.ai`}
                    </div>
                  </div>

                  {/* Quick Companion Switchers for Live Evaluation */}
                  <div>
                    <div className="px-1 py-1 text-[10px] font-bold uppercase tracking-wider text-[#A8A29E]">
                      Switch Companion (RBAC)
                    </div>
                    <div className="space-y-1">
                      {users.map((u) => {
                        const isSelected = u.id === currentUser.id;
                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              switchQuickCompanion(u.id);
                              setCurrentUser(u);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 ${
                              isSelected
                                ? 'bg-[#FAF9F6] text-[#1C1917] font-bold border border-[#EBE7DF] shadow-2xs'
                                : 'text-[#78716C] hover:text-[#1C1917] hover:bg-[#F4F1EA]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <img
                                src={safeAvatarSrc(u)}
                                alt={u.name}
                                onError={(e) => {
                                  const initials = (u.name || 'TR').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'TR';
                                  (e.target as HTMLImageElement).src = createSvgAvatar(initials, '#0284c7', '#1d4ed8');
                                }}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                              <div>
                                <div className="font-semibold">{u.name}</div>
                                <div className="text-[10px] text-[#A8A29E]">
                                  {u.role === 'planner'
                                    ? 'Trip Admin'
                                    : u.personaType === 'elderly'
                                    ? 'Senior Mode'
                                    : u.personaType === 'kid'
                                    ? 'Kid Mode'
                                    : 'Companion'}
                                </div>
                              </div>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#D97746]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Auth Actions: Profile Editor, Switch Account & Sign Out */}
                  <div className="pt-2 border-t border-[#EBE7DF] space-y-1">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setNameInput(currentUser.name);
                        setSelectedAvatar(currentUser.avatar);
                        setIsProfileOpen(true);
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-[#1C1917] hover:bg-[#F4F1EA] transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-[#D97746]" />
                      <span>Edit Profile &amp; Avatar</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsAuthModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-[#1C1917] hover:bg-[#F4F1EA] transition-colors"
                    >
                      <LogIn className="w-4 h-4 text-[#D97746]" />
                      <span>Sign In / Create Account</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        signOut();
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Omni-Search Bar (Only visible on small screens so mobile users also get JARVIS) */}
        <div className="block md:hidden pb-2.5">
          <div className="bg-white border border-[#EBE7DF] focus-within:border-[#D97746] rounded-full px-3 py-1.5 shadow-2xs flex items-center gap-2">
            <Bot className="w-4 h-4 text-[#D97746] shrink-0" />
            <input
              type="text"
              value={quickCmd}
              onChange={(e) => setQuickCmd(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCommandSubmit()}
              placeholder='Command JARVIS: "switch to Dadaji"...'
              className="w-full bg-transparent text-xs text-[#1C1917] placeholder-[#A8A29E] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleVoiceInput}
              className={`p-1.5 rounded-full text-xs font-semibold flex items-center justify-center transition-all ${
                listening ? 'bg-rose-500 text-white animate-pulse' : 'bg-[#F4F1EA] text-[#1C1917]'
              }`}
            >
              {listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
            {quickCmd.trim() && (
              <button
                type="button"
                onClick={handleCommandSubmit}
                className="p-1.5 rounded-full bg-[#1C1917] text-white"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile & Avatar Customizer Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (updateCurrentUser) {
                updateCurrentUser({
                  name: nameInput.trim() || currentUser.name,
                  avatar: selectedAvatar,
                });
              }
              setIsProfileOpen(false);
            }}
            className="w-full max-w-md bg-white border border-[#EBE7DF] rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-[#EBE7DF] pb-3">
              <h3 className="text-base font-bold text-[#1C1917]">Traveler Profile &amp; Avatar</h3>
              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                className="p-1.5 rounded-xl bg-[#FAF9F6] text-stone-400 hover:text-[#1C1917]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <img
                src={selectedAvatar}
                alt="Selected Avatar"
                className="h-16 w-16 rounded-full ring-2 ring-[#D97746] object-cover"
              />
              <div className="flex-1">
                <label className="block text-xs font-bold text-stone-500 mb-1">Display Name</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-[#FAF9F6] border border-[#EBE7DF] rounded-xl px-3 py-2 text-sm text-[#1C1917] outline-none focus:border-[#D97746]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-500 mb-2">
                Select Offline-Safe Vector Avatar
              </label>
              <div className="flex items-center gap-3">
                {AVATAR_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setSelectedAvatar(preset.url)}
                    className={`relative h-11 w-11 rounded-full overflow-hidden transition ${
                      selectedAvatar === preset.url
                        ? 'ring-2 ring-[#D97746] scale-105'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    title={preset.label}
                  >
                    <img src={preset.url} alt={preset.label} className="h-full w-full" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#FAF9F6] text-stone-600 text-xs font-semibold hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#1C1917] hover:bg-[#D97746] text-white text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Check className="w-3.5 h-3.5" /> Save Profile
              </button>
            </div>
          </form>
        </div>
      )}
    </header>
  );
}
