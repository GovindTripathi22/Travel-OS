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
  UserCheck
} from 'lucide-react';

export default function Header() {
  const {
    currentUser,
    setCurrentUser,
    users,
    setIsAssistantOpen,
    setIsJarvisOpen,
    viewMode,
    setViewMode,
    triggerJarvisVoice,
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
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#EBE7DF]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.jpg"
              alt="Sahyatri Logo"
              className="w-8 h-8 rounded-xl object-contain shadow-2xs border border-[#EBE7DF]"
            />
            <div className="flex items-baseline gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-[#1C1917]">
                Sahyatri
              </span>
              <span className="text-[11px] font-semibold text-[#D97746] tracking-wider uppercase hidden sm:inline">
                AI Travel OS
              </span>
            </div>
          </div>

          {/* Traveler Switcher & Actions */}
          <div className="flex items-center gap-2.5">
            {/* Authenticated Traveler Profile Pill */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white border border-[#EBE7DF] hover:border-[#D6D0C5] text-xs font-semibold text-[#1C1917] transition shadow-2xs"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="max-w-[90px] truncate sm:max-w-none">
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
                <ChevronDown className="w-3.5 h-3.5 text-[#78716C]" />
              </button>

              {/* Authenticated Account & RBAC Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#EBE7DF] p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2">
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
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition ${
                              isSelected
                                ? 'bg-[#FAF9F6] text-[#1C1917] font-bold border border-[#EBE7DF]'
                                : 'text-[#78716C] hover:text-[#1C1917] hover:bg-[#F4F1EA]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <img
                                src={u.avatar}
                                alt={u.name}
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

                  {/* Auth Actions: Switch Account & Sign Out */}
                  <div className="pt-1 border-t border-[#EBE7DF] space-y-1">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsAuthModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-[#1C1917] hover:bg-[#F4F1EA] transition"
                    >
                      <LogIn className="w-4 h-4 text-[#D97746]" />
                      <span>Sign In / Create Account</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        signOut();
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Viewport Toggle */}
            <button
              onClick={() => setViewMode(viewMode === 'full' ? 'phone_preview' : 'full')}
              title={viewMode === 'full' ? 'Simulate Mobile Frame' : 'Full Screen'}
              className="p-2 rounded-full text-[#78716C] hover:text-[#1C1917] hover:bg-[#F4F1EA] transition"
            >
              {viewMode === 'full' ? (
                <Smartphone className="w-4 h-4" />
              ) : (
                <Monitor className="w-4 h-4 text-[#D97746]" />
              )}
            </button>

            {/* JARVIS Voice Button */}
            <button
              onClick={() => triggerJarvisVoice()}
              title="Activate JARVIS Autonomous Voice Control"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1917] hover:bg-[#2C2724] text-white rounded-full text-xs font-semibold shadow-xs border border-[#3E3832] transition active:scale-95 group"
            >
              <span className="w-2 h-2 rounded-full bg-[#D97746] group-hover:animate-ping" />
              <span>JARVIS</span>
            </button>

            {/* AI Assistant Button */}
            <button
              onClick={() => setIsAssistantOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D97746] hover:bg-[#C26333] text-white rounded-full text-xs font-semibold shadow-xs transition active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
