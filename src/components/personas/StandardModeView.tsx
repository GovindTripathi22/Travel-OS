'use client';

import React, { useState } from 'react';
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
  Sparkles,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Plane,
  Camera,
  Compass,
  Mic,
} from 'lucide-react';

export default function StandardModeView() {
  const {
    currentUser,
    conflicts,
    resolveConflict,
    users,
    setIsJarvisOpen,
    activeTab,
    setActiveTab,
    vaultSubTab,
    setVaultSubTab,
    triggerJarvisVoice,
  } = useTrip();

  const unresolvedConflicts = conflicts.filter((c) => !c.resolved);
  const topConflict = unresolvedConflicts[0];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* 1. Trip Hero — Architectural Newsreader Editorial Aesthetic */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#EBE7DF]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#D97746] tracking-wide mb-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span className="uppercase tracking-widest text-[10px] font-bold">Jaipur, Rajasthan &bull; Day 1 of 5</span>
          </div>
          <h1 className="font-serif-title text-3xl sm:text-4xl font-bold text-[#1C1917] tracking-tight">
            Rajasthan Family Expedition
          </h1>
          <p className="text-xs sm:text-sm text-[#78716C] mt-1.5 font-normal">
            Oct 14 &ndash; 18 &bull; 6 companions &bull; Autonomous group travel intelligence &amp; consensus
          </p>
        </div>

        {/* Companion Avatars Group */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center -space-x-2">
            {users.map((u) => (
              <img
                key={u.id}
                src={u.avatar}
                alt={u.name}
                title={`${u.name} (${u.role === 'planner' ? 'Trip Leader' : u.personaType === 'elderly' ? 'Senior Mode' : u.personaType === 'kid' ? 'Kid Mode' : 'Companion'})`}
                className="w-8 h-8 rounded-full object-cover border-2 border-white ring-1 ring-[#EBE7DF] hover:scale-110 hover:z-10 transition-transform duration-200"
              />
            ))}
          </div>
          <span className="text-[11px] font-bold text-[#4D7C5F] bg-[#F3F9F5] px-2.5 py-1 rounded-full border border-[#D1E5D8] shadow-2xs">
            ✓ 6 Aligned
          </span>
        </div>
      </section>

      {/* 2. Proactive Alert — Only Reassuring Card if Unresolved */}
      {topConflict && (
        <section className="bg-[#FAF5EE] border border-[#E8DFC8] rounded-2xl p-4 text-[#8A631E] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs transition-all hover:border-[#D97746]/40">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#EFE3C7] text-[#D97746] flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#8A631E] flex items-center gap-1.5">
                <span>Proactive Schedule Adaptation</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#EFE3C7] text-[#8A631E] font-semibold">Recommended</span>
              </div>
              <p className="text-xs text-[#735213] mt-0.5 leading-relaxed">
                {topConflict.description} &bull; <em>AI Recommendation: {topConflict.suggestedAction.details}</em>
              </p>
            </div>
          </div>

          <button
            onClick={() => resolveConflict(topConflict.id)}
            className="w-full sm:w-auto px-4 py-2 bg-[#D97746] hover:bg-[#C26333] text-white rounded-xl text-xs font-bold shadow-xs shrink-0 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Apply 1-Click Fix</span>
          </button>
        </section>
      )}

      {/* 3. Primary Segmented Tabs — Minimalist, Tactile & Intuitive */}
      <nav className="flex items-center gap-1.5 bg-[#F4F1EA] p-1.5 rounded-2xl border border-[#EBE7DF] overflow-x-auto scrollbar-none shadow-2xs">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 min-w-[100px] py-2 px-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 text-center flex items-center justify-center gap-1.5 ${
            activeTab === 'timeline'
              ? 'bg-white text-[#1C1917] shadow-xs font-bold border border-[#EBE7DF]'
              : 'text-[#78716C] hover:text-[#1C1917] hover:bg-white/50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Timeline</span>
        </button>

        <button
          onClick={() => setActiveTab('decisions')}
          className={`flex-1 min-w-[110px] py-2 px-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 text-center flex items-center justify-center gap-1.5 ${
            activeTab === 'decisions'
              ? 'bg-white text-[#1C1917] shadow-xs font-bold border border-[#EBE7DF]'
              : 'text-[#78716C] hover:text-[#1C1917] hover:bg-white/50'
          }`}
        >
          <Vote className="w-3.5 h-3.5" />
          <span>Decisions</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#D97746]" />
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex-1 min-w-[100px] py-2 px-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 text-center flex items-center justify-center gap-1.5 ${
            activeTab === 'expenses'
              ? 'bg-white text-[#1C1917] shadow-xs font-bold border border-[#EBE7DF]'
              : 'text-[#78716C] hover:text-[#1C1917] hover:bg-white/50'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Expenses</span>
        </button>

        <button
          onClick={() => setActiveTab('vault')}
          className={`flex-1 min-w-[110px] py-2 px-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 text-center flex items-center justify-center gap-1.5 ${
            activeTab === 'vault'
              ? 'bg-white text-[#1C1917] shadow-xs font-bold border border-[#EBE7DF]'
              : 'text-[#78716C] hover:text-[#1C1917] hover:bg-white/50'
          }`}
        >
          <FolderLock className="w-3.5 h-3.5" />
          <span>Vault &amp; Info</span>
        </button>
      </nav>

      {/* 4. Tab Content View */}
      <main className="pt-1">
        {activeTab === 'timeline' && <ItineraryTimeline />}
        {activeTab === 'decisions' && <MechanismPollCard />}
        {activeTab === 'expenses' && <ExpenseLedger />}
        {activeTab === 'vault' && (
          <div className="space-y-6">
            {/* Vault Sub-Tabs */}
            <div className="flex items-center gap-2 border-b border-[#EBE7DF] pb-3 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setVaultSubTab('passes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  vaultSubTab === 'passes'
                    ? 'bg-[#1C1917] text-white'
                    : 'text-[#78716C] hover:text-[#1C1917] bg-white border border-[#EBE7DF]'
                }`}
              >
                Boarding Passes &amp; QR
              </button>
              <button
                onClick={() => setVaultSubTab('rendezvous')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  vaultSubTab === 'rendezvous'
                    ? 'bg-[#1C1917] text-white'
                    : 'text-[#78716C] hover:text-[#1C1917] bg-white border border-[#EBE7DF]'
                }`}
              >
                Airport Rendezvous HUD
              </button>
              <button
                onClick={() => setVaultSubTab('alignment')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  vaultSubTab === 'alignment'
                    ? 'bg-[#1C1917] text-white'
                    : 'text-[#78716C] hover:text-[#1C1917] bg-white border border-[#EBE7DF]'
                }`}
              >
                Alignment Radar &amp; Energy
              </button>
              <button
                onClick={() => setVaultSubTab('photos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  vaultSubTab === 'photos'
                    ? 'bg-[#1C1917] text-white'
                    : 'text-[#78716C] hover:text-[#1C1917] bg-white border border-[#EBE7DF]'
                }`}
              >
                Shared Photos &amp; Story
              </button>
            </div>

            {/* Sub-tab view */}
            {vaultSubTab === 'passes' && <DocumentVault />}
            {vaultSubTab === 'rendezvous' && <TravelStatusHUD />}
            {vaultSubTab === 'alignment' && <PreTripRadar />}
            {vaultSubTab === 'photos' && <PhotoStream />}
          </div>
        )}
      </main>
    </div>
  );
}
