'use client';

import React, { useState } from 'react';
import { useTrip } from '@/lib/state/TripContext';
import {
  MapPin,
  Utensils,
  Footprints,
  CheckCircle2,
  Sparkles,
  CloudRain,
  Wand2,
  AlertTriangle,
  Plus,
} from 'lucide-react';

export default function ItineraryTimeline() {
  const {
    itinerary,
    conflicts,
    resolveConflict,
    weather,
    adaptWeatherIndoor,
    autoHealSchedule,
    setIsAddStopOpen,
    tripInfo,
  } = useTrip();
  const [selectedDay, setSelectedDay] = useState(1);

  const availableDays = Array.from(
    new Set([1, 2, 3, ...(tripInfo ? Array.from({ length: tripInfo.totalDays || 3 }, (_, i) => i + 1) : []), ...itinerary.map((i) => i.day)])
  ).sort((a, b) => a - b);

  const dayEvents = itinerary.filter((item) => item.day === selectedDay);
  const dayConflicts = conflicts.filter(
    (c) => !c.resolved && dayEvents.some((e) => e.id === c.eventId)
  );

  return (
    <div className="space-y-4">
      {/* Day Selector & Auto-Heal Quick Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#EBE7DF]">
        <div className="flex items-center gap-1.5 bg-[#F4F1EA] p-1.5 rounded-2xl border border-[#EBE7DF] shadow-2xs overflow-x-auto scrollbar-none max-w-full">
          {availableDays.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#D97746] ${
                selectedDay === d
                  ? 'bg-white text-[#1C1917] shadow-xs font-bold border border-[#EBE7DF]'
                  : 'text-[#78716C] hover:text-[#1C1917] hover:bg-white/50'
              }`}
            >
              Day {d} {d === 1 ? '· Arrival' : d === 2 ? '· Highlights' : '· Explorations'}
            </button>
          ))}
        </div>

        {/* Quick Auto-Healing & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsAddStopOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[38px] sm:min-h-[40px] bg-[#D97746] hover:bg-[#C26333] text-white rounded-xl text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 shadow-2xs hover:shadow-xs focus-visible:ring-2 focus-visible:ring-[#D97746]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Stop</span>
          </button>

          {weather === 'Rainy' && (
            <button
              onClick={() => adaptWeatherIndoor(selectedDay)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[38px] sm:min-h-[40px] bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 shadow-2xs hover:shadow-xs focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <CloudRain className="w-3.5 h-3.5" />
              <span>Swap Indoor</span>
            </button>
          )}

          <button
            onClick={() => autoHealSchedule(selectedDay)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[38px] sm:min-h-[40px] bg-[#2D2723] hover:bg-[#D97746] text-white rounded-xl text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 shadow-2xs hover:shadow-xs focus-visible:ring-2 focus-visible:ring-[#D97746]"
          >
            <Wand2 className="w-3.5 h-3.5 text-[#D97746]" />
            <span>Auto-Heal</span>
          </button>

          <span className="text-xs text-[#A8A29E] font-medium hidden sm:inline pl-1">
            {dayEvents.length} stops
          </span>
        </div>
      </div>

      {/* Events List or Empty State */}
      {dayEvents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EBE7DF] p-8 text-center shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF5EE] text-[#D97746] flex items-center justify-center mx-auto">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[#1C1917]">No stops scheduled for Day {selectedDay}</h3>
            <p className="text-xs text-[#78716C] max-w-sm mx-auto mt-1">
              Add your first sightseeing spot, authentic dining stop, or relaxed buffer for companions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddStopOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#D97746] hover:bg-[#C26333] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition active:scale-95 focus-visible:ring-2 focus-visible:ring-[#D97746]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Stop for Day {selectedDay}</span>
          </button>
        </div>
      ) : (
        <div className="divide-y divide-[#EBE7DF] bg-white rounded-2xl border border-[#EBE7DF] overflow-hidden shadow-2xs">

        {dayEvents.map((item) => {
          const itemConflicts = conflicts.filter((c) => c.eventId === item.id && !c.resolved);
          const hasConflict = itemConflicts.length > 0;
          const isPendingVote = item.status === 'pending_vote';

          return (
            <div
              key={item.id}
              className={`p-4 sm:p-5 flex items-start gap-4 transition-colors ${
                hasConflict
                  ? 'bg-[#FAF5EE]'
                  : 'hover:bg-[#FAF9F6]'
              }`}
            >
              {/* Time Column */}
              <div className="w-16 shrink-0 pt-0.5">
                <span className="text-xs font-bold text-[#1C1917] tracking-tight block">
                  {item.time}
                </span>
                <span className="text-[10px] uppercase font-bold text-[#A8A29E] tracking-wider block">
                  {item.category}
                </span>
              </div>

              {/* Event Details */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <h3 className="text-sm sm:text-base font-bold text-[#1C1917]">
                    {item.title}
                  </h3>

                  {isPendingVote && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-[#D97746] text-white px-2 py-0.2 rounded-full">
                      Vote Active
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#78716C] leading-relaxed">
                  {item.description}
                </p>

                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#A8A29E]">
                  <span className="flex items-center gap-1 text-[#78716C]">
                    <MapPin className="w-3 h-3 text-[#D97746]" /> {item.location}
                  </span>

                  {item.dietaryTags && item.dietaryTags.length > 0 && (
                    <span className="flex items-center gap-1 text-[#4D7C5F] font-medium">
                      <Utensils className="w-3 h-3" /> {item.dietaryTags.join(', ')}
                    </span>
                  )}

                  {item.walkingDistanceMeters !== undefined && (
                    <span className="flex items-center gap-1">
                      <Footprints className="w-3 h-3 text-[#A8A29E]" /> {item.walkingDistanceMeters}m
                    </span>
                  )}
                </div>

                {/* Inline 1-Click Fix if conflict */}
                {hasConflict && (
                  <div className="mt-3 pt-2.5 border-t border-[#E8DFC8] flex items-center justify-between gap-3">
                    <span className="text-xs text-[#8A631E] font-medium">
                      ⚠️ {itemConflicts[0].description}
                    </span>
                    <button
                      onClick={() => resolveConflict(itemConflicts[0].id)}
                      className="px-3 py-1 bg-[#D97746] hover:bg-[#C26333] text-white rounded-lg text-xs font-semibold shadow-2xs shrink-0"
                    >
                      Apply Fix
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}
