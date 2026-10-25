'use client';

import React, { useState } from 'react';
import { useTrip } from '@/lib/state/TripContext';
import {
  Compass,
  BatteryCharging,
  BatteryMedium,
  Heart,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Sliders
} from 'lucide-react';

export default function PreTripRadar() {
  const { users, currentUser, updateWellbeing, addItineraryRestBuffer } = useTrip();
  const [restAdded, setRestAdded] = useState(false);

  const user1 = users[0] || { name: 'Traveler' };
  const user2 = users[1] || user1;
  const hasMultiple = users.length > 1;

  const radarMetrics = [
    {
      axis: 'Pace & Density',
      groupScore: hasMultiple ? 'Balanced (3.6 / 5)' : `${user1.name.split(' ')[0]} (${user1.preferences?.pacePreference || 'moderate'})`,
      mismatch: hasMultiple ? `${user1.name.split(' ')[0]} prefers ${user1.preferences?.pacePreference || 'moderate'}; ${user2.name.split(' ')[0]} pacing active.` : 'Single traveler preference configured.',
      alignment: hasMultiple ? 82 : 100,
    },
    {
      axis: 'Budget Flexibility',
      groupScore: 'Generous (4.2 / 5)',
      mismatch: hasMultiple ? `Unanimous agreement across ${users.length} companions.` : 'Individual budget preference active.',
      alignment: 95,
    },
    {
      axis: 'Spontaneity vs Structure',
      groupScore: 'Semi-Structured (3.8 / 5)',
      mismatch: hasMultiple ? `${user1.name.split(' ')[0]} handles schedule checkpoints.` : 'Flexible individual schedule.',
      alignment: 85,
    },
    {
      axis: 'Dietary Alignment',
      groupScore: 'Coordinated (4.0 / 5)',
      mismatch: users.some(u => u.preferences?.dietary?.length) ? `Special boundaries tracked: ${users.flatMap(u => u.preferences?.dietary || []).slice(0, 2).join(', ')}.` : 'Dining preferences aligned.',
      alignment: 90,
    },
    {
      axis: 'Daily Energy & Rhythm',
      groupScore: 'Synchronized (4.1 / 5)',
      mismatch: hasMultiple ? `Mobility tolerance balanced across ${users.length} companions.` : 'Individual walking rhythm active.',
      alignment: 88,
    },
  ];

  const handleInjectBuffer = () => {
    addItineraryRestBuffer('event-7', 45);
    setRestAdded(true);
  };

  return (
    <div className="space-y-6">
      {/* Pre-Trip Alignment Protocol Hero */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 flex items-center gap-1">
                <Compass className="w-3 h-3" /> Pre-Trip Alignment Protocol
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Psychometric Expectation Mapping
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mt-1">
              Group Alignment Spectrum (5 Dimensions)
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Surfaces friction points before luggage is packed to eliminate the 40% quiet disappointment trap.
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
              Overall Trip Alignment
            </span>
            <div className="text-xl font-black text-emerald-600">81% Cohesive</div>
          </div>
        </div>

        {/* 5-Axis Breakdown Bars */}
        <div className="space-y-4 my-6">
          {radarMetrics.map((m, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 mb-1.5">
                <span>{m.axis}</span>
                <span className="text-slate-600">{m.groupScore} &bull; <strong className="text-orange-600">{m.alignment}% Aligned</strong></span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-[width] duration-500 will-change-[width]"
                  style={{ width: `${m.alignment}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">
                <strong>Dynamic Insight:</strong> {m.mismatch}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Wellbeing Check-In & Battery Gauge */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 flex items-center gap-1">
                <Heart className="w-3 h-3" /> Private Wellbeing Monitor
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Wearable / Pulse Integration
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              Mid-Trip Energy & Fatigue Gauge
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Dynamically adapts daily schedule density when companions run low on energy.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!restAdded ? (
              <button
                onClick={handleInjectBuffer}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 active:scale-95"
              >
                <Coffee className="w-4 h-4" /> Inject 45m Chai Rest Buffer
              </button>
            ) : (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Chai Buffer Injected into Itinerary
              </span>
            )}
          </div>
        </div>

        {/* Companions Battery Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {users.map((u) => {
            const battery = u.batteryLevel ?? 75;
            const isLow = battery < 65;

            return (
              <div
                key={u.id}
                className={`p-4 rounded-2xl border text-center transition-all ${
                  isLow
                    ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/20'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <img
                  src={u.avatar}
                  alt={u.name}
                  className="w-12 h-12 rounded-full object-cover mx-auto mb-2 border border-slate-200"
                />
                <h4 className="text-xs font-bold text-slate-900 truncate">{u.name.split(' ')[0]}</h4>
                <div className="flex items-center justify-center gap-1 text-xs font-black mt-1">
                  <BatteryMedium className={`w-4 h-4 ${isLow ? 'text-amber-600' : 'text-emerald-600'}`} />
                  <span className={isLow ? 'text-amber-800' : 'text-emerald-700'}>{battery}%</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {isLow ? 'Needs rest soon' : 'Good stamina'}
                </span>

                {/* Battery adjustment slider for demo testing */}
                {u.id === currentUser.id && (
                  <div className="mt-3 pt-2 border-t border-slate-200">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">
                      My Battery
                    </span>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => updateWellbeing(u.id, Math.max(10, battery - 15))}
                        className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-[10px] font-bold"
                      >
                        -15%
                      </button>
                      <button
                        onClick={() => updateWellbeing(u.id, Math.min(100, battery + 15))}
                        className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-[10px] font-bold"
                      >
                        +15%
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
