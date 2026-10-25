'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTrip } from '@/lib/state/TripContext';
import {
  X,
  UserPlus,
  Heart,
  Smile,
  Shield,
  Utensils,
  Footprints,
  Phone,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { PersonaType, UserRole } from '@/types';
import { createSvgAvatar } from '@/lib/state/mockData';

export default function AddCompanionModal() {
  const { isAddCompanionOpen, setIsAddCompanionOpen, addCompanion, users } = useTrip();

  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('companion');
  const [personaType, setPersonaType] = useState<PersonaType>('standard');
  const [relationship, setRelationship] = useState('Friend');
  const [age, setAge] = useState('28');
  const [phone, setPhone] = useState('+91 98000 00000');
  const [dietary, setDietary] = useState('Vegetarian');
  const [maxWalkingMeters, setMaxWalkingMeters] = useState('2000');
  const [needsRamp, setNeedsRamp] = useState(false);
  const [stairTolerance, setStairTolerance] = useState<'none' | 'few' | 'normal'>('normal');

  const modalRef = useRef<HTMLDivElement>(null);

  // Auto-adjust mobility defaults based on persona
  const handlePersonaChange = (newPersona: PersonaType) => {
    setPersonaType(newPersona);
    if (newPersona === 'elderly') {
      setAge('72');
      setMaxWalkingMeters('350');
      setNeedsRamp(true);
      setStairTolerance('none');
      setDietary('Low-Sodium');
      setRelationship('Grandparent / Parent');
    } else if (newPersona === 'kid') {
      setAge('9');
      setMaxWalkingMeters('2500');
      setNeedsRamp(false);
      setStairTolerance('normal');
      setRelationship('Child / Niece / Nephew');
    } else {
      setAge('28');
      setMaxWalkingMeters('3000');
      setNeedsRamp(false);
      setStairTolerance('normal');
    }
  };

  // Keyboard navigation & accessibility
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isAddCompanionOpen) {
        setIsAddCompanionOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddCompanionOpen, setIsAddCompanionOpen]);

  useEffect(() => {
    if (isAddCompanionOpen) {
      modalRef.current?.focus();
    }
  }, [isAddCompanionOpen]);

  if (!isAddCompanionOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const initials = name
      .trim()
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'TR';

    const bgColors: [string, string] =
      personaType === 'elderly'
        ? ['#059669', '#047857']
        : personaType === 'kid'
        ? ['#0284c7', '#0369a1']
        : ['#ea580c', '#c2410c'];

    const avatar = createSvgAvatar(initials, bgColors[0], bgColors[1]);

    addCompanion({
      id: `user-${Date.now()}`,
      name: name.trim(),
      role,
      personaType,
      relationship: relationship.trim() || 'Companion',
      age: parseInt(age, 10) || 28,
      avatar,
      phone: phone.trim() || '+91 98000 00000',
      batteryLevel: 85,
      voiceCredits: 100,
      preferences: {
        dietary: dietary ? [dietary] : ['Vegetarian'],
        medical: personaType === 'elderly' ? ['Blood Pressure Medication', 'Zero Stair Route'] : [],
        mobility: {
          maxWalkingMeters: parseInt(maxWalkingMeters, 10) || 2000,
          needsRampOrElevator: needsRamp,
          stairTolerance,
        },
        pacePreference: personaType === 'elderly' ? 'slow' : 'moderate',
      },
    });

    // Reset form
    setName('');
    setRelationship('Friend');
    setPersonaType('standard');
    setIsAddCompanionOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/20 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-companion-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#EBE7DF] overflow-hidden flex flex-col max-h-[92vh] focus-visible:outline-none"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#EBE7DF] bg-[#FAF9F6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D97746] flex items-center justify-center text-white shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 id="add-companion-title" className="font-serif-title text-lg sm:text-xl font-bold text-[#1C1917]">
                Add Travel Companion
              </h2>
              <p className="text-xs text-[#78716C]">
                Dynamically invite a companion with custom dietary and mobility safety
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddCompanionOpen(false)}
            aria-label="Close companion modal"
            className="p-2 rounded-xl text-[#78716C] hover:text-[#1C1917] hover:bg-white transition focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* Name & Relationship */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="comp-name" className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="comp-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Meera Sharma"
                className="w-full text-xs sm:text-sm px-3 py-2.5 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
              />
            </div>

            <div>
              <label htmlFor="comp-rel" className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
                Relationship
              </label>
              <input
                id="comp-rel"
                type="text"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="e.g. Sister / Mother / Friend"
                className="w-full text-xs sm:text-sm px-3 py-2.5 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
              />
            </div>
          </div>

          {/* Persona Mode Selector */}
          <div>
            <label className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1.5">
              Travel Persona &amp; Accessibility Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handlePersonaChange('standard')}
                className={`p-2.5 rounded-xl border text-center transition font-semibold text-xs flex flex-col items-center gap-1 focus-visible:ring-2 focus-visible:ring-[#D97746] ${
                  personaType === 'standard'
                    ? 'border-[#D97746] bg-[#FAF5EE] text-[#D97746] shadow-xs'
                    : 'border-[#EBE7DF] text-[#78716C] hover:bg-[#FAF9F6]'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Standard</span>
              </button>

              <button
                type="button"
                onClick={() => handlePersonaChange('elderly')}
                className={`p-2.5 rounded-xl border text-center transition font-semibold text-xs flex flex-col items-center gap-1 focus-visible:ring-2 focus-visible:ring-[#D97746] ${
                  personaType === 'elderly'
                    ? 'border-[#059669] bg-emerald-50 text-emerald-800 shadow-xs'
                    : 'border-[#EBE7DF] text-[#78716C] hover:bg-[#FAF9F6]'
                }`}
              >
                <Heart className="w-4 h-4 text-emerald-600" />
                <span>Senior / Elderly</span>
              </button>

              <button
                type="button"
                onClick={() => handlePersonaChange('kid')}
                className={`p-2.5 rounded-xl border text-center transition font-semibold text-xs flex flex-col items-center gap-1 focus-visible:ring-2 focus-visible:ring-[#D97746] ${
                  personaType === 'kid'
                    ? 'border-[#0284c7] bg-blue-50 text-blue-800 shadow-xs'
                    : 'border-[#EBE7DF] text-[#78716C] hover:bg-[#FAF9F6]'
                }`}
              >
                <Smile className="w-4 h-4 text-blue-600" />
                <span>Explorer Kid</span>
              </button>
            </div>
          </div>

          {/* Role & Age & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label htmlFor="comp-role" className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
                Trip Role
              </label>
              <select
                id="comp-role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full text-xs px-3 py-2.5 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
              >
                <option value="companion">Companion</option>
                <option value="planner">Co-Planner / Admin</option>
              </select>
            </div>

            <div>
              <label htmlFor="comp-age" className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
                Age
              </label>
              <input
                id="comp-age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full text-xs px-3 py-2.5 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
              />
            </div>

            <div>
              <label htmlFor="comp-phone" className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                id="comp-phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs px-3 py-2.5 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
              />
            </div>
          </div>

          {/* Dietary & Mobility Preferences */}
          <div className="p-3.5 bg-[#FAF9F6] rounded-2xl border border-[#EBE7DF] space-y-3">
            <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-[#D97746]" /> Health, Dietary &amp; Mobility Boundaries
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="comp-diet" className="block text-[10px] font-bold text-[#A8A29E] uppercase mb-1">
                  Dietary Restrictions
                </label>
                <select
                  id="comp-diet"
                  value={dietary}
                  onChange={(e) => setDietary(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#EBE7DF] rounded-lg focus-visible:ring-2 focus-visible:ring-[#D97746]"
                >
                  <option value="Vegetarian">Standard Vegetarian</option>
                  <option value="Jain Vegetarian">Strict Jain (No Root Veg/Garlic)</option>
                  <option value="Low-Sodium">Low-Sodium (Cardiac/Hypertension)</option>
                  <option value="Vegan">100% Vegan</option>
                  <option value="Gluten-Free">Gluten-Free / Celiac</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                </select>
              </div>

              <div>
                <label htmlFor="comp-walking" className="block text-[10px] font-bold text-[#A8A29E] uppercase mb-1">
                  Max Continuous Walking
                </label>
                <select
                  id="comp-walking"
                  value={maxWalkingMeters}
                  onChange={(e) => setMaxWalkingMeters(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#EBE7DF] rounded-lg focus-visible:ring-2 focus-visible:ring-[#D97746]"
                >
                  <option value="350">350 meters (Gentle pace / Senior)</option>
                  <option value="1000">1,000 meters (Leisure stroll)</option>
                  <option value="2500">2,500 meters (Moderate activity)</option>
                  <option value="5000">5,000+ meters (Active trekker)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <label className="flex items-center gap-2 text-xs text-[#1C1917] cursor-pointer">
                <input
                  type="checkbox"
                  checked={needsRamp}
                  onChange={(e) => setNeedsRamp(e.target.checked)}
                  className="rounded border-[#EBE7DF] text-[#D97746] focus:ring-[#D97746]"
                />
                <span>Requires Wheelchair Ramp or Elevator</span>
              </label>

              <div className="flex items-center gap-1.5 text-xs text-[#1C1917]">
                <span className="text-[11px] text-[#78716C]">Stairs:</span>
                <select
                  value={stairTolerance}
                  onChange={(e) => setStairTolerance(e.target.value as any)}
                  aria-label="Stairs tolerance"
                  className="text-xs px-2 py-1 bg-white border border-[#EBE7DF] rounded-lg"
                >
                  <option value="none">Zero Stairs</option>
                  <option value="few">Few (1-10)</option>
                  <option value="normal">Normal (Unlimited)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full py-3 bg-[#D97746] hover:bg-[#C26333] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition active:scale-98 disabled:opacity-40 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Companion to Trip</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
