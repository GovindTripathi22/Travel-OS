'use client';

import React from 'react';
import { useTrip } from '@/lib/state/TripContext';
import {
  Volume2,
  VolumeX,
  PhoneCall,
  MapPin,
  Pill,
  Clock,
  ShieldCheck,
  Heart,
  Sparkles,
  Info,
  ChevronRight
} from 'lucide-react';

export default function ElderlyModeView() {
  const {
    currentUser,
    itinerary,
    isSpeaking,
    speakText,
    stopSpeaking,
    setIsAssistantOpen,
    users,
    tripInfo,
  } = useTrip();

  const planner = users.find((u) => u.role === 'planner') || users[0];
  const seniorFirstName = currentUser.name.split(' ')[0] || 'Elder';
  const plannerFirstName = planner?.name.split(' ')[0] || 'Trip Leader';
  const dest = tripInfo?.destination ? tripInfo.destination.split(',')[0] : 'Jaipur';

  const handleAudioBriefing = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      const summaryText = `Pranam ${seniorFirstName}. Today is Day ${tripInfo?.currentDay || 1} in ${dest}. Comfortable meals and restful, zero-stair routes are prepared for you. ${plannerFirstName} is with you. Have a wonderful and peaceful day!`;
      speakText(summaryText);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 elderly-theme max-w-4xl mx-auto">
      {/* Top Welcome Bar */}
      <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 mb-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400"
            />
            <div>
              <span className="text-amber-400 text-sm font-semibold tracking-wider uppercase flex items-center gap-1.5">
                <Heart className="w-4 h-4 fill-amber-400" /> Comfort & Care Mode
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">
                Namaste, {seniorFirstName}
              </h1>
              <p className="text-slate-300 text-base mt-1">
                Day {tripInfo?.currentDay || 1} in {dest} &bull; Everything is taken care of
              </p>
            </div>
          </div>

          {/* Quick Voice Briefing Button */}
          <button
            onClick={handleAudioBriefing}
            className={`w-full sm:w-auto px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 text-lg transition-all shadow-lg active:scale-95 ${
              isSpeaking
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold'
            }`}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-6 h-6" /> Stop Audio
              </>
            ) : (
              <>
                <Volume2 className="w-6 h-6" /> Listen to Today's Plan
              </>
            )}
          </button>
        </div>
      </div>

      {/* Emergency & Reassurance Quick Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <a
          href={`tel:${planner.phone}`}
          className="bg-emerald-950/80 border-2 border-emerald-500/50 hover:border-emerald-400 p-5 rounded-2xl flex items-center gap-4 transition active:scale-95"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-md">
            <PhoneCall className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
              One-Tap Direct Call
            </span>
            <h3 className="text-xl font-bold text-white">Call {plannerFirstName}</h3>
            <p className="text-sm text-emerald-200">{planner.phone}</p>
          </div>
        </a>

        <div className="bg-slate-900 border-2 border-slate-700 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-600/30 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <MapPin className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Hotel & Room Details
            </span>
            <h3 className="text-lg font-bold text-white">Rambagh Palace</h3>
            <p className="text-sm text-amber-300 font-medium">Suite 104 &bull; Ground Floor (No Stairs)</p>
          </div>
        </div>
      </div>

      {/* Medication Alarms Card */}
      <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-900/60 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Daily Medication Reminders</h2>
              <p className="text-sm text-slate-400">Coordinated with today's meal schedule</p>
            </div>
          </div>
          <span className="text-xs bg-purple-950 text-purple-300 border border-purple-800 px-3 py-1 rounded-full font-semibold">
            Tracked by Rohan
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-slate-950 border border-emerald-500/40 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-400 font-semibold">08:00 AM &bull; With Breakfast</span>
              <p className="text-base font-bold text-white">Morning BP & Sugar Tablet</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600 text-xs font-bold">
              ✓ Taken
            </span>
          </div>

          <div className="bg-slate-950 border border-amber-500/40 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs text-amber-400 font-semibold">08:00 PM (20:00) &bull; Evening Tea/Dinner</span>
              <p className="text-base font-bold text-white">Evening BP Tablet</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-600 text-xs font-bold">
              ⏰ Scheduled
            </span>
          </div>
        </div>
      </div>

      {/* Today's Schedule - Large Glanceable Format */}
      <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-amber-400" />
            <h2 className="text-2xl font-bold text-white">Today's Schedule</h2>
          </div>
          <span className="text-sm text-slate-400 font-medium">Gentle Pace</span>
        </div>

        <div className="space-y-4">
          {/* Item 1 */}
          <div className="bg-slate-950 border-2 border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-extrabold text-lg">01:00 PM</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                  Zero Stairs &bull; Ground Floor
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">Lunch at Surya Mahal</h3>
              <p className="text-base text-slate-300">
                Low-salt authentic vegetarian thali pre-ordered. Driver drops directly at verandah doors.
              </p>
            </div>
            <span className="shrink-0 text-emerald-400 text-sm font-semibold flex items-center gap-1">
              <ShieldCheck className="w-5 h-5" /> Food Approved
            </span>
          </div>

          {/* Rest Window */}
          <div className="bg-amber-950/30 border-2 border-amber-600/40 p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-600/30 flex items-center justify-center text-amber-300 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                Rest & Recovery Window
              </span>
              <h3 className="text-lg font-bold text-white">01:30 PM &ndash; 03:30 PM: Hotel Afternoon Rest</h3>
              <p className="text-sm text-amber-200/80">
                Quiet time in air-conditioned room. No activities scheduled for you.
              </p>
            </div>
          </div>

          {/* Item 2 */}
          <div className="bg-slate-950 border-2 border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-extrabold text-lg">07:30 PM</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 font-semibold">
                  Chokhi Dhani Cultural Show
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">Folk Dance & Puppet Show</h3>
              <p className="text-base text-slate-300">
                Front-row cushioned seating reserved for you so Kabir can watch the puppets with you.
              </p>
            </div>
            <span className="shrink-0 text-amber-400 text-sm font-semibold flex items-center gap-1">
              <ShieldCheck className="w-5 h-5" /> Armchair Reserved
            </span>
          </div>
        </div>
      </div>

      {/* Voice Assistant Trigger */}
      <div className="bg-gradient-to-r from-amber-600/20 via-orange-600/20 to-amber-600/20 border-2 border-amber-500/50 rounded-3xl p-6 text-center">
        <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-2" />
        <h3 className="text-2xl font-bold text-white">Have Any Question?</h3>
        <p className="text-slate-300 text-base max-w-md mx-auto mt-1 mb-5">
          Ask your personal assistant about food, stairs, medicines, or timing anytime.
        </p>
        <button
          onClick={() => setIsAssistantOpen(true)}
          className="w-full sm:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xl rounded-2xl shadow-xl transition-all active:scale-95 inline-flex items-center justify-center gap-3"
        >
          <Sparkles className="w-6 h-6 text-slate-950" />
          Talk with My Assistant
        </button>
      </div>
    </div>
  );
}
