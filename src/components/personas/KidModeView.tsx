'use client';

import React, { useState } from 'react';
import { useTrip } from '@/lib/state/TripContext';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Trophy,
  Compass,
  AlertOctagon,
  Clock,
  CheckCircle2,
  PhoneCall,
  X,
  Volume2,
  Camera
} from 'lucide-react';

export default function KidModeView() {
  const { currentUser, setIsAssistantOpen, users } = useTrip();
  const [xp, setXp] = useState(320);
  const [showLostModal, setShowLostModal] = useState(false);
  const [claimedQuests, setClaimedQuests] = useState<Record<string, boolean>>({
    'peacock': true,
    'sundial': false,
    'camel': false,
  });

  const planner = users.find((u) => u.role === 'planner') || users[0];

  const triggerQuestComplete = (questKey: string, questXp: number) => {
    if (claimedQuests[questKey]) return;

    setClaimedQuests((prev) => ({ ...prev, [questKey]: true }));
    setXp((prev) => prev + questXp);

    if (typeof window !== 'undefined') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  return (
    <div className="min-h-screen bg-amber-50/70 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Kid Header & XP Bar */}
      <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 rounded-3xl p-6 text-white shadow-lg mb-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
              />
              <span className="absolute -bottom-2 -right-1 text-2xl">🦁</span>
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/30 backdrop-blur-md text-xs font-black uppercase tracking-wider">
                  Level 3 Desert Scout
                </span>
              </div>
              <h1 className="text-3xl font-black tracking-tight mt-0.5">
                Captain Kabir! 🚀
              </h1>
              <p className="text-white/90 text-sm font-medium">
                Rajasthan Royal Explorer &bull; Quest Master
              </p>
            </div>
          </div>

          {/* XP Badge */}
          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30 text-center w-full sm:w-auto">
            <div className="flex items-center justify-center gap-1.5 text-amber-100 text-xs font-bold uppercase tracking-wider">
              <Trophy className="w-4 h-4 text-yellow-200" /> Total Explorer XP
            </div>
            <div className="text-3xl font-black">{xp} / 400 XP</div>
            <div className="w-44 bg-black/20 h-2.5 rounded-full mt-2 overflow-hidden mx-auto">
              <div
                className="bg-yellow-300 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (xp / 400) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Lost Beacon Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowLostModal(true)}
          className="w-full bg-rose-600 hover:bg-rose-700 text-white p-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-lg active:scale-95 transition"
        >
          <AlertOctagon className="w-7 h-7 animate-pulse" />
          <span>I'm Lost / Can't Find Family! Tap Here</span>
        </button>
      </div>

      {/* Fun Countdown Hero */}
      <div className="bg-white border-2 border-orange-200 rounded-3xl p-6 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center text-3xl shrink-0">
            🐪
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-orange-600">
              Next Exciting Adventure
            </span>
            <h2 className="text-2xl font-black text-slate-900">
              Chokhi Dhani Camel Ride!
            </h2>
            <p className="text-slate-600 text-sm">
              Live puppet theatre, magic show, and fresh mango kulfi tonight.
            </p>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 px-5 py-3 rounded-2xl text-center shrink-0">
          <div className="text-xs font-bold text-orange-800 uppercase tracking-wide">
            Starts In
          </div>
          <div className="text-2xl font-black text-orange-600">
            ~45 Mins
          </div>
        </div>
      </div>

      {/* Scavenger Hunt & Passport Stamps */}
      <div className="bg-white border-2 border-amber-200 rounded-3xl p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-amber-600" />
            <h2 className="text-xl font-black text-slate-900">
              Explorer Passport & Quests
            </h2>
          </div>
          <span className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
            Tap to Claim XP!
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Quest 1 */}
          <div
            onClick={() => triggerQuestComplete('peacock', 50)}
            className={`border-2 rounded-2xl p-4 text-center transition cursor-pointer ${
              claimedQuests['peacock']
                ? 'bg-emerald-50 border-emerald-300'
                : 'bg-white border-slate-200 hover:border-amber-400'
            }`}
          >
            <div className="text-4xl mb-2">🦚</div>
            <h3 className="font-bold text-slate-900 text-sm">Spot Royal Peacocks</h3>
            <p className="text-xs text-slate-500 mt-1">Look in Rambagh Palace Garden</p>
            <div className="mt-3">
              {claimedQuests['peacock'] ? (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Stamp Earned (+50 XP)
                </span>
              ) : (
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  Tap when Spotted (+50 XP)
                </span>
              )}
            </div>
          </div>

          {/* Quest 2 */}
          <div
            onClick={() => triggerQuestComplete('sundial', 60)}
            className={`border-2 rounded-2xl p-4 text-center transition cursor-pointer ${
              claimedQuests['sundial']
                ? 'bg-emerald-50 border-emerald-300'
                : 'bg-white border-slate-200 hover:border-amber-400'
            }`}
          >
            <div className="text-4xl mb-2">⌛</div>
            <h3 className="font-bold text-slate-900 text-sm">Read the Ancient Sundial</h3>
            <p className="text-xs text-slate-500 mt-1">At Jantar Mantar Observatory</p>
            <div className="mt-3">
              {claimedQuests['sundial'] ? (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Stamp Earned (+60 XP)
                </span>
              ) : (
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  Tap to Claim (+60 XP)
                </span>
              )}
            </div>
          </div>

          {/* Quest 3 */}
          <div
            onClick={() => triggerQuestComplete('camel', 80)}
            className={`border-2 rounded-2xl p-4 text-center transition cursor-pointer ${
              claimedQuests['camel']
                ? 'bg-emerald-50 border-emerald-300'
                : 'bg-white border-slate-200 hover:border-amber-400'
            }`}
          >
            <div className="text-4xl mb-2">🐪</div>
            <h3 className="font-bold text-slate-900 text-sm">Ride the Royal Camel</h3>
            <p className="text-xs text-slate-500 mt-1">Tonight at Chokhi Dhani</p>
            <div className="mt-3">
              {claimedQuests['camel'] ? (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Stamp Earned (+80 XP)
                </span>
              ) : (
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  Tap after Ride (+80 XP)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Kid Assistant Bubble */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-6 text-white text-center shadow-md">
        <Sparkles className="w-8 h-8 mx-auto mb-2 text-yellow-200" />
        <h3 className="text-2xl font-black">Ask Your Travel Buddy!</h3>
        <p className="text-orange-100 text-sm max-w-sm mx-auto mt-1 mb-4">
          Want to know when we get ice cream or what animals we will see next?
        </p>
        <button
          onClick={() => setIsAssistantOpen(true)}
          className="px-8 py-3.5 bg-white text-orange-600 hover:bg-orange-50 font-black text-lg rounded-2xl shadow-lg transition active:scale-95 inline-flex items-center gap-2"
        >
          <Sparkles className="w-5 h-5 text-orange-500" />
          Talk to Buddy AI
        </button>
      </div>

      {/* Emergency Beacon Modal */}
      {showLostModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center border-4 border-rose-500 shadow-2xl relative">
            <button
              onClick={() => setShowLostModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertOctagon className="w-10 h-10 animate-pulse" />
            </div>

            <h2 className="text-2xl font-black text-slate-900">
              Stay Right Where You Are!
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Show this screen to any security guard, hotel staff, or police officer.
            </p>

            <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 my-4 text-left">
              <div className="text-xs font-bold text-rose-800 uppercase tracking-wide">
                My Identification
              </div>
              <p className="text-lg font-black text-slate-900 mt-1">
                My name is Kabir Sharma (Age 9).
              </p>
              <p className="text-sm text-slate-700 mt-1">
                I am traveling with my family at Rambagh Palace / Jaipur.
              </p>
            </div>

            <div className="space-y-3">
              <a
                href={`tel:${planner.phone}`}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition"
              >
                <PhoneCall className="w-6 h-6" />
                <span>Call Uncle Rohan ({planner.phone})</span>
              </a>

              <button
                onClick={() => setShowLostModal(false)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm"
              >
                I Found My Family! Close This
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
