'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTrip } from '@/lib/state/TripContext';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  X,
  Compass,
  Calendar,
  MapPin,
  Users,
  Sparkles,
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Heart,
  Smile,
  UserCheck,
} from 'lucide-react';
import { PersonaType, UserRole } from '@/types';
import { createSvgAvatar } from '@/lib/state/mockData';

interface CompanionDraft {
  id: string;
  name: string;
  role: UserRole;
  personaType: PersonaType;
  relationship: string;
  dietary: string;
}

export default function TripSetupModal() {
  const {
    isSetupModalOpen,
    setIsSetupModalOpen,
    createCustomTrip,
    loadDemoTrip,
    tripInfo,
    isDemoTrip,
    users,
  } = useTrip();
  const { currentUser } = useTrip();

  const [mode, setMode] = useState<'create' | 'explore'>('create');
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [dates, setDates] = useState('');
  const [companions, setCompanions] = useState<CompanionDraft[]>([]);
  const [newCompName, setNewCompName] = useState('');
  const [newCompPersona, setNewCompPersona] = useState<PersonaType>('standard');
  const [newCompRelationship, setNewCompRelationship] = useState('Companion');
  const [newCompDiet, setNewCompDiet] = useState('Vegetarian');

  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isSetupModalOpen) {
        setIsSetupModalOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSetupModalOpen, setIsSetupModalOpen]);

  // Trap focus inside modal when opened
  useEffect(() => {
    if (isSetupModalOpen) {
      modalRef.current?.focus();
    }
  }, [isSetupModalOpen]);

  if (!isSetupModalOpen) return null;

  const handleAddCompanionDraft = () => {
    if (!newCompName.trim()) return;
    const draft: CompanionDraft = {
      id: `draft-${Date.now()}`,
      name: newCompName.trim(),
      role: 'companion',
      personaType: newCompPersona,
      relationship: newCompRelationship.trim() || 'Companion',
      dietary: newCompDiet,
    };
    setCompanions((prev) => [...prev, draft]);
    setNewCompName('');
    setNewCompPersona('standard');
    setNewCompRelationship('Companion');
  };

  const handleRemoveCompanionDraft = (id: string) => {
    setCompanions((prev) => prev.filter((c) => c.id !== id));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;

    createCustomTrip({
      title: title.trim() || `${destination.trim().split(',')[0]} Journey`,
      destination: destination.trim(),
      dates: dates.trim() || 'Upcoming Trip',
      companions: companions.map((c) => ({
        name: c.name,
        role: c.role,
        personaType: c.personaType,
        relationship: c.relationship,
        preferences: {
          dietary: c.dietary ? [c.dietary] : ['Vegetarian'],
          medical: [],
          mobility: {
            maxWalkingMeters: c.personaType === 'elderly' ? 400 : 3000,
            needsRampOrElevator: c.personaType === 'elderly',
            stairTolerance: c.personaType === 'elderly' ? 'none' : 'normal',
          },
          pacePreference: c.personaType === 'elderly' ? 'slow' : 'moderate',
        },
      })),
    });
  };

  const handleLoadDemo = () => {
    loadDemoTrip();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/20 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trip-setup-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#EBE7DF] overflow-hidden flex flex-col max-h-[92vh] focus-visible:outline-none"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#EBE7DF] bg-[#FAF9F6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D97746] flex items-center justify-center text-white shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 id="trip-setup-title" className="font-serif-title text-lg sm:text-xl font-bold text-[#1C1917]">
                Trip Setup &amp; Onboarding
              </h2>
              <p className="text-xs text-[#78716C]">
                Configure your real companions or explore the sample demo expedition
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSetupModalOpen(false)}
            aria-label="Close setup modal"
            className="p-2 rounded-xl text-[#78716C] hover:text-[#1C1917] hover:bg-white transition focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Switch: Create Custom Trip vs Explore Demo */}
        <div className="px-5 pt-4">
          <div className="flex items-center p-1 bg-[#F4F1EA] rounded-2xl border border-[#EBE7DF]">
            <button
              type="button"
              onClick={() => setMode('create')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-[#D97746] ${
                mode === 'create'
                  ? 'bg-white text-[#1C1917] shadow-xs'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-[#D97746]" />
              <span>Create New Clean Trip</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('explore')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-[#D97746] ${
                mode === 'explore'
                  ? 'bg-white text-[#1C1917] shadow-xs'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Explore Sample Demo Trip</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {mode === 'create' ? (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#FAF5EE] border border-[#E8DFC8] flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-[#D97746] shrink-0 mt-0.5" />
                <p className="text-xs text-[#78716C]">
                  Starting fresh with your own account: You are set as the <strong>Trip Leader</strong>. Add your real destination and companions below!
                </p>
              </div>

              {/* Destination & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="trip-destination" className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
                    Destination <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-[#A8A29E] absolute left-3 top-3.5" />
                    <input
                      id="trip-destination"
                      type="text"
                      required
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="e.g. Goa, India or Kyoto, Japan"
                      className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="trip-title" className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
                    Trip Name / Title
                  </label>
                  <input
                    id="trip-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Goa Beach Getaway 2026"
                    className="w-full text-xs sm:text-sm px-3 py-2.5 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
                  />
                </div>
              </div>

              {/* Dates */}
              <div>
                <label htmlFor="trip-dates" className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
                  Trip Dates
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[#A8A29E] absolute left-3 top-3.5" />
                  <input
                    id="trip-dates"
                    type="text"
                    value={dates}
                    onChange={(e) => setDates(e.target.value)}
                    placeholder="e.g. Nov 14 – Nov 18, 2026"
                    className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
                  />
                </div>
              </div>

              {/* Add Companions Section */}
              <div className="pt-2 border-t border-[#EBE7DF] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider block">
                      Add Real Travel Companions
                    </span>
                    <span className="text-[11px] text-[#A8A29E]">
                      Include family members, friends, seniors, or kids with distinct personas
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#D97746]">
                    {companions.length + 1} total travelers
                  </span>
                </div>

                {/* Companions Drafts List */}
                <div className="space-y-2">
                  {/* Current User Pill */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF9F6] border border-[#EBE7DF] text-xs">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div>
                        <strong className="text-[#1C1917]">{currentUser.name}</strong>
                        <span className="text-[#78716C] ml-2">(You &bull; Trip Planner)</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-[#D97746] border border-orange-200">
                      Leader
                    </span>
                  </div>

                  {companions.map((comp) => (
                    <div
                      key={comp.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#EBE7DF] text-xs shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#D97746]/10 text-[#D97746] font-bold flex items-center justify-center text-xs">
                          {comp.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <strong className="text-[#1C1917]">{comp.name}</strong>
                          <span className="text-[#78716C] ml-2">
                            ({comp.relationship} &bull; {comp.personaType === 'elderly' ? 'Senior Mode' : comp.personaType === 'kid' ? 'Kid Mode' : 'Standard'})
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCompanionDraft(comp.id)}
                        aria-label={`Remove companion ${comp.name}`}
                        className="p-1 text-[#A8A29E] hover:text-red-500 rounded-lg transition focus-visible:ring-2 focus-visible:ring-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Inline Companion Add Form */}
                <div className="p-3 bg-[#FAF9F6] rounded-2xl border border-[#EBE7DF] space-y-2.5">
                  <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider block">
                    + Quick Add Companion
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={newCompName}
                      onChange={(e) => setNewCompName(e.target.value)}
                      placeholder="Companion Name (e.g. Priya)"
                      className="text-xs px-3 py-2 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
                    />
                    <input
                      type="text"
                      value={newCompRelationship}
                      onChange={(e) => setNewCompRelationship(e.target.value)}
                      placeholder="Relationship (e.g. Spouse / Friend)"
                      className="text-xs px-3 py-2 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
                    />
                    <select
                      value={newCompPersona}
                      onChange={(e) => setNewCompPersona(e.target.value as PersonaType)}
                      aria-label="Companion Persona Mode"
                      className="text-xs px-3 py-2 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
                    >
                      <option value="standard">Standard Persona</option>
                      <option value="elderly">Senior / Elderly Mode (Large font, Voice)</option>
                      <option value="kid">Explorer Kid Mode (Quests, Badges)</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[11px] text-[#78716C]">Diet:</span>
                      <select
                        value={newCompDiet}
                        onChange={(e) => setNewCompDiet(e.target.value)}
                        aria-label="Dietary preference"
                        className="text-xs px-2 py-1 bg-white border border-[#EBE7DF] rounded-lg"
                      >
                        <option value="Vegetarian">Vegetarian</option>
                        <option value="Jain Vegetarian">Strict Jain</option>
                        <option value="Low-Sodium">Low-Sodium</option>
                        <option value="Non-Vegetarian">Non-Vegetarian</option>
                        <option value="Vegan">Vegan</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddCompanionDraft}
                      disabled={!newCompName.trim()}
                      className="px-3 py-1.5 bg-[#2D2723] hover:bg-[#D97746] disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#D97746]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to List</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={!destination.trim()}
                  className="w-full py-3 bg-[#D97746] hover:bg-[#C26333] text-white font-bold text-sm rounded-xl shadow-xs transition active:scale-98 disabled:opacity-40 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
                >
                  <Compass className="w-4 h-4" />
                  <span>Launch Clean Trip ({companions.length + 1} Travelers)</span>
                </button>
              </div>
            </form>
          ) : (
            /* Mode: Explore Sample Demo Trip */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                <div className="flex items-center gap-2 text-[#D97746] font-bold text-xs uppercase tracking-wider mb-1">
                  <Sparkles className="w-4 h-4" /> Recommended for Testing &amp; Evaluation
                </div>
                <h3 className="font-serif-title text-base sm:text-lg font-bold text-[#1C1917]">
                  Rajasthan Family Expedition (Sample Demo)
                </h3>
                <p className="text-xs text-[#78716C] mt-1 leading-relaxed">
                  Experience Sahyatri with full pre-loaded multi-generational data: 6 travelers (Rohan, Dadaji, Priya, Kabir, Vikram, Ananya), quadratic voting polls, weather-adapted timeline, and minimal debt settlements!
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-[#FAF9F6] border border-[#EBE7DF]">
                  <span className="text-[10px] uppercase font-bold text-[#A8A29E] block">Companions</span>
                  <strong className="text-[#1C1917]">6 Travelers</strong>
                  <span className="text-[11px] text-[#78716C] block">Senior, Kid &amp; Adult</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF9F6] border border-[#EBE7DF]">
                  <span className="text-[10px] uppercase font-bold text-[#A8A29E] block">Itinerary</span>
                  <strong className="text-[#1C1917]">5 Days &bull; 8 Stops</strong>
                  <span className="text-[11px] text-[#78716C] block">Weather Fallbacks</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF9F6] border border-[#EBE7DF]">
                  <span className="text-[10px] uppercase font-bold text-[#A8A29E] block">Mechanism</span>
                  <strong className="text-[#1C1917]">Quadratic Poll</strong>
                  <span className="text-[11px] text-[#78716C] block">Voice Credit Consensus</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLoadDemo}
                className="w-full py-3 bg-[#2D2723] hover:bg-[#3D352F] text-white font-bold text-sm rounded-xl shadow-xs transition active:scale-98 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
              >
                <Sparkles className="w-4 h-4 text-[#D97746]" />
                <span>Load Rajasthan Expedition Demo Data</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#FAF9F6] border-t border-[#EBE7DF] flex items-center justify-between text-[11px] text-[#A8A29E] px-6">
          <span>Sahyatri &bull; Group Travel Operating System</span>
          <span>Zero Lock-in &bull; Switch anytime</span>
        </div>
      </div>
    </div>
  );
}
