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
  User as UserIcon,
  UserPlus,
  Compass,
  X,
} from 'lucide-react';
import { createSvgAvatar, AVATAR_PRESETS } from '@/lib/state/mockData';
import { getClientLiveData } from '@/lib/api/liveDataService';

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
    isDemoTrip,
    setIsSetupModalOpen,
    setIsAddCompanionOpen,
  } = useTrip();

  const {
    user,
    activeProfile,
    isAuthenticated,
    authHydrated,
    isAdmin,
    setIsAuthModalOpen,
    signOut,
    switchQuickCompanion,
  } = useAuth();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEnvOpen, setIsEnvOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [nameInput, setNameInput] = useState(currentUser.name);
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser.avatar);
  const [liveWeather, setLiveWeather] = useState<any>(null);
  const [liveForex, setLiveForex] = useState<any>(null);

  useEffect(() => {
    getClientLiveData()
      .then((d) => {
        if (d?.weather) setLiveWeather(d.weather);
        if (d?.forex) setLiveForex(d.forex);
      })
      .catch(() => {});
  }, []);


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

  // Sync active profile from Auth into TripContext
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
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#FCFAF6]/90 backdrop-blur-md border-b border-[#EBE6DE] transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* 1. Brand Logo & Clean Monograph */}
          <div className="flex items-center gap-3 shrink-0">
            <img
              src="/logo.jpg"
              alt="Sahyatri Logo"
              decoding="async"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-contain shadow-2xs border border-[#EBE6DE] transition-transform duration-300 hover:scale-105"
            />
            <div className="flex items-baseline gap-2">
              <span className="font-serif-title text-xl font-bold tracking-tight text-[#1C1917]">
                Sahyatri
              </span>
              <span className="text-[10px] font-bold tracking-wider text-[#D97746] uppercase px-2 py-0.5 rounded-full bg-[#F5F2EB] border border-[#EBE6DE] hidden sm:inline-flex">
                AI Travel OS
              </span>
            </div>
          </div>

          {/* 2. Center: Ambient Weather & Currency Pill */}
          <div className="relative" ref={envRef}>
            <button
              onClick={() => setIsEnvOpen(!isEnvOpen)}
              title="Click to view destination weather, switch currency, or toggle simulation"
              aria-expanded={isEnvOpen}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white hover:bg-[#F5F2EB] border border-[#EBE6DE] hover:border-[#D6CFBE] text-xs font-semibold text-[#1C1917] shadow-2xs hover:shadow-xs transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="truncate max-w-[90px] sm:max-w-none text-stone-700">
                {(liveWeather?.city || liveWeather?.destination || 'Jaipur').split(',')[0]}
              </span>
              <span className="text-[#9C948A]">&bull;</span>
              <span className="flex items-center gap-1 font-medium text-stone-600">
                {weather === 'Rainy' ? (
                  <CloudRain className="w-3.5 h-3.5 text-blue-500" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span>{liveWeather?.tempC ?? liveWeather?.temperatureC ?? 22}°C</span>
              </span>
              <span className="text-[#9C948A] hidden sm:inline">&bull;</span>
              <span className="font-mono text-[11px] font-bold text-[#D97746] hidden sm:inline">
                {currency}
              </span>
              <ChevronDown className="w-3 h-3 text-[#9C948A]" />
            </button>

            {/* Context Environment Popover */}
            {isEnvOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#EBE6DE] p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
                {/* Currency Switcher */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#9C948A] mb-1.5">
                    Settlement Currency
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {(['INR', 'USD', 'EUR', 'JPY'] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setCurrency(c);
                          setIsEnvOpen(false);
                        }}
                        className={`py-1 text-center rounded-lg font-mono text-xs font-bold transition ${
                          currency === c
                            ? 'bg-[#2D2723] text-white shadow-xs'
                            : 'bg-[#FAF8F5] text-stone-600 hover:text-[#1C1917] border border-[#EBE6DE]'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Weather Toggle */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#9C948A] mb-1.5">
                    Weather Simulator (Conflict Testing)
                  </div>
                  <button
                    onClick={() => {
                      toggleWeather();
                      setIsEnvOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border transition ${
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
                    <span className="text-[10px] font-bold underline">Click to Flip</span>
                  </button>
                </div>

                {/* Device Viewport Toggle */}
                <div className="pt-2 border-t border-[#EBE6DE]">
                  <button
                    onClick={() => {
                      setViewMode(viewMode === 'full' ? 'phone_preview' : 'full');
                      setIsEnvOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold text-stone-600 hover:text-[#1C1917] hover:bg-[#F5F2EB] transition"
                  >
                    <div className="flex items-center gap-2">
                      {viewMode === 'full' ? (
                        <Smartphone className="w-4 h-4 text-[#D97746]" />
                      ) : (
                        <Monitor className="w-4 h-4 text-[#D97746]" />
                      )}
                      <span>{viewMode === 'full' ? 'Mobile Phone Frame' : 'Full Screen View'}</span>
                    </div>
                    <span className="text-[10px] text-[#9C948A]">Toggle</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Right Section: Ask AI & Authenticated Profile Menu */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Ask AI Assistant Button */}
            <button
              onClick={() => setIsAssistantOpen(true)}
              className="px-3 py-1.5 bg-[#F5F2EB] hover:bg-[#EBE6DE] border border-[#EBE6DE] text-[#D97746] hover:text-[#C26333] rounded-full text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center gap-1.5 shadow-2xs hover:shadow-xs"
              title="Open Personal Assistant Drawer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>

            {/* Auth Session State */}
            {!authHydrated ? (
              <div className="w-20 h-7 rounded-full bg-[#EBE6DE]/50 animate-pulse" aria-hidden="true" />
            ) : !isAuthenticated ? (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3.5 py-1.5 bg-[#2D2723] hover:bg-[#3D352F] text-white rounded-full text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center gap-1.5 shadow-2xs hover:shadow-xs focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
                title="Sign In with Firebase or Switch Companion"
                aria-label="Sign In to Sahyatri"
              >
                <LogIn className="w-3.5 h-3.5 text-[#D97746]" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="menu"
                  aria-label={`User profile menu for ${currentUser.name}`}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white border border-[#EBE6DE] hover:border-[#D6CFBE] text-xs font-semibold text-[#1C1917] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 shadow-2xs hover:shadow-xs focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
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
                        : 'bg-stone-100 text-stone-600 border border-stone-200'
                    }`}
                  >
                    {isAdmin ? 'Admin' : 'Companion'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[#9C948A]" />
                </button>

                {/* Profile & Switcher Dropdown */}
                {isDropdownOpen && (
                  <div
                    role="menu"
                    aria-label="Account actions"
                    className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#EBE6DE] p-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2.5"
                  >
                    {/* Active Account Identity Card */}
                    <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EBE6DE]">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9C948A]">
                          Active Account
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                          <ShieldCheck className="w-3 h-3" /> Firebase Auth
                        </span>
                      </div>
                      <div className="text-xs font-bold text-[#1C1917] mt-1">
                        {currentUser.name}
                      </div>
                      <div className="text-[11px] text-stone-500 truncate">
                        {user?.email || `${currentUser.id}@traveler.sahyatri.ai`}
                      </div>
                    </div>

                    {/* Quick Companion Switchers */}
                    {users.length > 1 && (
                      <div>
                        <div className="px-1 py-1 text-[10px] font-bold uppercase tracking-wider text-[#9C948A]">
                          Switch Companion (RBAC)
                        </div>
                        <div className="space-y-1 max-h-44 overflow-y-auto">
                          {users.map((u) => {
                            const isSelected = u.id === currentUser.id;
                            return (
                              <button
                                key={u.id}
                                role="menuitem"
                                onClick={() => {
                                  switchQuickCompanion(u.id);
                                  setCurrentUser(u);
                                  setIsDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 focus-visible:ring-2 focus-visible:ring-[#D97746] ${
                                  isSelected
                                    ? 'bg-[#FAF8F5] text-[#1C1917] font-bold border border-[#EBE6DE] shadow-2xs'
                                    : 'text-stone-600 hover:text-[#1C1917] hover:bg-[#F5F2EB]'
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
                                    <div className="text-[10px] text-[#9C948A]">
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
                    )}

                    {/* Trip Actions */}
                    <div className="pt-2 border-t border-[#EBE6DE] space-y-1">
                      <button
                        role="menuitem"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          if (setIsAddCompanionOpen) setIsAddCompanionOpen(true);
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-[#F5F2EB] transition-colors focus-visible:ring-2 focus-visible:ring-[#D97746]"
                      >
                        <UserPlus className="w-4 h-4 text-[#D97746]" />
                        <span>Add / Invite Traveler</span>
                      </button>

                      <button
                        role="menuitem"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          if (setIsSetupModalOpen) setIsSetupModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-[#F5F2EB] transition-colors focus-visible:ring-2 focus-visible:ring-[#D97746]"
                      >
                        <Compass className="w-4 h-4 text-[#D97746]" />
                        <span>Create / Switch Trip</span>
                      </button>

                      <button
                        role="menuitem"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setNameInput(currentUser.name);
                          setSelectedAvatar(currentUser.avatar);
                          setIsProfileOpen(true);
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-[#F5F2EB] transition-colors focus-visible:ring-2 focus-visible:ring-[#D97746]"
                      >
                        <UserIcon className="w-4 h-4 text-[#D97746]" />
                        <span>Edit Profile &amp; Avatar</span>
                      </button>

                      <button
                        role="menuitem"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          signOut();
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors focus-visible:ring-2 focus-visible:ring-red-500"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile & Avatar Customizer Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px] flex items-center justify-center p-4">
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
            className="w-full max-w-md bg-white border border-[#EBE6DE] rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-[#EBE6DE] pb-3">
              <h3 className="text-base font-bold text-[#1C1917]">Traveler Profile &amp; Avatar</h3>
              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                className="p-1.5 rounded-xl bg-[#FAF8F5] text-stone-400 hover:text-[#1C1917]"
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
                  className="w-full bg-[#FAF8F5] border border-[#EBE6DE] rounded-xl px-3 py-2 text-sm text-[#1C1917] outline-none focus:border-[#D97746]"
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
                className="px-4 py-2 rounded-xl bg-[#FAF8F5] text-stone-600 text-xs font-semibold hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#2D2723] hover:bg-[#D97746] text-white text-xs font-bold flex items-center gap-1.5 transition"
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
