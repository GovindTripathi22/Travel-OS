'use client';

import React from 'react';
import { useTrip } from '@/lib/state/TripContext';
import ItineraryTimeline from '../itinerary/ItineraryTimeline';
import MechanismPollCard from '../decision/MechanismPollCard';
import ExpenseLedger from '../expenses/ExpenseLedger';
import TravelStatusHUD from '../status/TravelStatusHUD';
import DocumentVault from '../vault/DocumentVault';
import PreTripRadar from '../alignment/PreTripRadar';
import PhotoStream from '../memories/PhotoStream';
import {
  Calendar,
  Vote,
  CreditCard,
  FolderLock,
  Plane,
  Camera,
  Sparkles,
  CheckCircle2,
  MapPin,
  UserPlus,
  Compass,
  ArrowRight,
  Shield,
} from 'lucide-react';

export default function StandardModeView() {
  const {
    conflicts,
    resolveConflict,
    users,
    activeTab,
    setActiveTab,
    vaultSubTab,
    setVaultSubTab,
    tripInfo,
    isDemoTrip,
    loadDemoTrip,
    setIsSetupModalOpen,
    setIsAddCompanionOpen,
  } = useTrip();

  const topConflict = conflicts.filter((c) => !c.resolved)[0];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* 1. Atelier Magazine Hero Card */}
      <section className="hero-card fade-up">
        {/* Subtle Trip Mode Header */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-white/20">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-md border border-white/25">
              {isDemoTrip ? '⭐ Sample Demo Expedition' : '✨ Custom Group Journey'}
            </span>
            <span className="text-xs text-white/80 hidden sm:inline">
              {isDemoTrip ? 'Interactive Rajasthan family expedition' : 'Your private companion group'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isDemoTrip ? (
              <button
                type="button"
                onClick={() => setIsSetupModalOpen(true)}
                className="text-xs font-bold px-3 py-1 bg-white hover:bg-amber-50 text-[#1C1917] rounded-xl shadow-xs transition hover:scale-105 active:scale-95 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-white"
              >
                <Compass className="w-3.5 h-3.5 text-[#D97746]" />
                <span>Plan Clean Trip</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={loadDemoTrip}
                className="text-xs font-bold px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-xl transition hover:scale-105 active:scale-95 flex items-center gap-1.5 border border-white/30 focus-visible:ring-2 focus-visible:ring-white"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Load Demo Trip</span>
              </button>
            )}
          </div>
        </div>

        {/* Hero Title & Companion Avatars */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-5">
          <div>
            <span className="chip-glass">
              <MapPin className="w-3.5 h-3.5" /> {tripInfo.destination || 'Jaipur, Rajasthan'} &bull; Day {tripInfo.currentDay} of {tripInfo.totalDays}
            </span>
            <h1 className="font-serif-title text-2xl sm:text-4xl md:text-5xl font-bold mt-2.5 leading-[1.08] tracking-tight">
              {tripInfo.title}
            </h1>
            <p className="mt-2 text-sm text-white/85">
              {tripInfo.dates ? `${tripInfo.dates} • ` : ''}{users.length} {users.length === 1 ? 'traveler' : 'companions'} aligned
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex -space-x-2">
              {users.map((u) => (
                <img
                  key={u.id}
                  src={u.avatar}
                  alt={u.name}
                  loading="lazy"
                  decoding="async"
                  title={`${u.name} (${u.role})`}
                  className="w-9 h-9 rounded-full object-cover border-2 border-white/90 hover:scale-110 hover:z-10 transition-transform shadow-xs"
                />
              ))}
            </div>

            {/* Quick Add Companion Button */}
            <button
              type="button"
              onClick={() => setIsAddCompanionOpen(true)}
              title="Add companion to this trip"
              aria-label="Add companion to this trip"
              className="w-9 h-9 rounded-full bg-white/25 hover:bg-white text-white hover:text-[#1C1917] border border-white/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95 focus-visible:ring-2 focus-visible:ring-white shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative z-10 mt-6">
          <div className="flex justify-between text-[11px] font-semibold text-white/80 mb-1.5">
            <span>Trip timeline progress</span>
            <span>Day {tripInfo.currentDay} of {tripInfo.totalDays}</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/25 overflow-hidden">
            <div
              className="h-full rounded-full bg-white transition-all duration-300"
              style={{ width: `${Math.min(100, (tripInfo.currentDay / tripInfo.totalDays) * 100)}%` }}
            />
          </div>
        </div>
      </section>

      {/* 2. Proactive Alert: Only Shown if There's an Actionable Conflict */}
      {topConflict && (
        <section className="fade-up flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-white text-[#D97746] flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-950">Proactive Schedule Adaptation</p>
              <p className="text-xs text-amber-900/80 mt-0.5 leading-relaxed">
                {topConflict.description} &bull; <em>{topConflict.suggestedAction.details}</em>
              </p>
            </div>
          </div>
          <button
            onClick={() => resolveConflict(topConflict.id)}
            className="btn-hover-lift shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#D97746] hover:bg-[#C26333] px-4 py-2 text-xs font-bold text-white shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Apply 1-Click Fix
          </button>
        </section>
      )}

      {/* 3. Ultra-Simple 3-Pillar Navigator */}
      <div className="flex justify-center max-w-full overflow-hidden">
        <nav aria-label="Trip Main Sections" className="nav-pillar-bar">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`nav-pillar-item ${activeTab === 'timeline' ? 'is-active' : ''}`}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span><span className="hidden sm:inline">Day Plan &amp; </span>Timeline</span>
          </button>

          <button
            onClick={() => setActiveTab('decisions')}
            className={`nav-pillar-item ${activeTab === 'decisions' ? 'is-active' : ''}`}
          >
            <Vote className="w-4 h-4 shrink-0" />
            <span><span className="hidden sm:inline">Group </span>Decisions</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`nav-pillar-item ${activeTab === 'expenses' ? 'is-active' : ''}`}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>Expenses<span className="hidden sm:inline"> &amp; Splits</span></span>
          </button>
        </nav>
      </div>

      {/* 4. Active Primary View */}
      <main className="fade-up pt-1">
        {activeTab === 'timeline' && <ItineraryTimeline />}
        {activeTab === 'decisions' && <MechanismPollCard />}
        {activeTab === 'expenses' && <ExpenseLedger />}
      </main>

      {/* 5. Clean Quick-Access Drawer Cards (Passes, Rendezvous & Memories) */}
      <section className="pt-4 border-t border-[#EBE6DE]">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Quick Travel Utilities &bull; Offline Ready
          </span>
          <span className="text-[11px] text-[#D97746] font-medium">1-Tap Access</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card A: Boarding Passes & Tickets */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('vault');
              setVaultSubTab('passes');
            }}
            className={`p-4 rounded-2xl border text-left transition card-hover-tactile flex items-start gap-3 ${
              activeTab === 'vault' && vaultSubTab === 'passes'
                ? 'bg-white border-[#D97746] ring-1 ring-[#D97746]'
                : 'bg-white border-[#EBE6DE]'
            }`}
          >
            <div className="p-2.5 rounded-xl bg-orange-50 text-[#D97746] shrink-0">
              <FolderLock className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-[#1C1917] truncate">Boarding Passes &amp; QR</h4>
              <p className="text-[11px] text-stone-500 mt-0.5 leading-tight">Cached offline gate scanning</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-stone-400 shrink-0 self-center" />
          </button>

          {/* Card B: Airport Rendezvous HUD */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('vault');
              setVaultSubTab('rendezvous');
            }}
            className={`p-4 rounded-2xl border text-left transition card-hover-tactile flex items-start gap-3 ${
              activeTab === 'vault' && vaultSubTab === 'rendezvous'
                ? 'bg-white border-[#D97746] ring-1 ring-[#D97746]'
                : 'bg-white border-[#EBE6DE]'
            }`}
          >
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
              <Plane className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-[#1C1917] truncate">Airport Rendezvous</h4>
              <p className="text-[11px] text-stone-500 mt-0.5 leading-tight">Live checkpoints &amp; gate meeting</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-stone-400 shrink-0 self-center" />
          </button>

          {/* Card C: Shared Photos & Story */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('vault');
              setVaultSubTab('photos');
            }}
            className={`p-4 rounded-2xl border text-left transition card-hover-tactile flex items-start gap-3 ${
              activeTab === 'vault' && vaultSubTab === 'photos'
                ? 'bg-white border-[#D97746] ring-1 ring-[#D97746]'
                : 'bg-white border-[#EBE6DE]'
            }`}
          >
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-[#1C1917] truncate">Photos &amp; Story</h4>
              <p className="text-[11px] text-stone-500 mt-0.5 leading-tight">AI synthesized trip diary</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-stone-400 shrink-0 self-center" />
          </button>
        </div>

        {/* Selected Drawer View when clicking any utility card */}
        {activeTab === 'vault' && (
          <div className="mt-4 p-5 rounded-3xl bg-white border border-[#EBE6DE] shadow-xs fade-up">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#EBE6DE]">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D97746]">
                  Active Utility View
                </span>
                <span className="text-xs text-stone-400">&bull;</span>
                <span className="text-xs font-bold text-[#1C1917]">
                  {vaultSubTab === 'passes' ? 'Document Vault & Passes' : vaultSubTab === 'rendezvous' ? 'Airport Rendezvous HUD' : 'Shared Photo Stream'}
                </span>
              </div>
              <button
                onClick={() => setActiveTab('timeline')}
                className="text-xs font-semibold text-stone-500 hover:text-[#1C1917] px-2.5 py-1 rounded-lg bg-[#FAF8F5] hover:bg-[#F5F2EB] border border-[#EBE6DE]"
              >
                Close View &times;
              </button>
            </div>

            {vaultSubTab === 'passes' && <DocumentVault />}
            {vaultSubTab === 'rendezvous' && <TravelStatusHUD />}
            {vaultSubTab === 'alignment' && <PreTripRadar />}
            {vaultSubTab === 'photos' && <PhotoStream />}
          </div>
        )}
      </section>
    </div>
  );
}
