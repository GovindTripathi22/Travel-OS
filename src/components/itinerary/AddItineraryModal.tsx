'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTrip } from '@/lib/state/TripContext';
import {
  X,
  CalendarPlus,
  MapPin,
  Clock,
  Footprints,
  CloudRain,
  Utensils,
  Sparkles,
  Accessibility,
} from 'lucide-react';
import { ItineraryItem } from '@/types';

export default function AddItineraryModal() {
  const { isAddStopOpen, setIsAddStopOpen, addItineraryItem, tripInfo, itinerary, currency } = useTrip();

  const [title, setTitle] = useState('');
  const [day, setDay] = useState(1);
  const [time, setTime] = useState('14:00');
  const [endTime, setEndTime] = useState('16:00');
  const [category, setCategory] = useState<'activity' | 'dining' | 'transit' | 'rest'>('activity');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [costPerPerson, setCostPerPerson] = useState('250');
  const [walkingDistance, setWalkingDistance] = useState('200');
  const [stairsCount, setStairsCount] = useState('0');
  const [isOutdoor, setIsOutdoor] = useState(false);
  const [indoorFallback, setIndoorFallback] = useState('');
  const [wheelchairAccessible, setWheelchairAccessible] = useState(true);
  const [kidQuest, setKidQuest] = useState('');
  const [dietaryTags, setDietaryTags] = useState('Vegetarian');

  const modalRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation & accessibility
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isAddStopOpen) {
        setIsAddStopOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddStopOpen, setIsAddStopOpen]);

  useEffect(() => {
    if (isAddStopOpen) {
      modalRef.current?.focus();
    }
  }, [isAddStopOpen]);

  if (!isAddStopOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim()) return;

    const newItem: ItineraryItem = {
      id: `itin-${Date.now()}`,
      day,
      date: `Day ${day}`,
      time,
      endTime,
      title: title.trim(),
      description: description.trim() || `${category.toUpperCase()} stop in ${location.trim()}.`,
      category,
      location: location.trim(),
      walkingDistanceMeters: parseInt(walkingDistance, 10) || 150,
      stairsCount: parseInt(stairsCount, 10) || 0,
      costPerPerson: parseFloat(costPerPerson) || 0,
      cost: parseFloat(costPerPerson) || 0,
      isOutdoor,
      indoorFallback: isOutdoor && indoorFallback.trim() ? indoorFallback.trim() : undefined,
      wheelchairAccessible,
      kidQuest: kidQuest.trim() || undefined,
      dietaryTags: category === 'dining' && dietaryTags ? [dietaryTags] : undefined,
      status: 'confirmed',
    };

    addItineraryItem(newItem);

    // Reset form
    setTitle('');
    setLocation('');
    setDescription('');
    setIndoorFallback('');
    setKidQuest('');
    setIsAddStopOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-stop-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#EBE7DF] overflow-hidden flex flex-col max-h-[92vh] focus-visible:outline-none"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#EBE7DF] bg-[#FAF9F6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D97746] flex items-center justify-center text-white shadow-xs">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 id="add-stop-title" className="font-serif-title text-lg sm:text-xl font-bold text-[#1C1917]">
                Add Itinerary Stop
              </h2>
              <p className="text-xs text-[#78716C]">
                Schedule an activity, meal, or transit stop with weather-fallback protection
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddStopOpen(false)}
            aria-label="Close add stop modal"
            className="p-2 rounded-xl text-[#78716C] hover:text-[#1C1917] hover:bg-white transition focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* Title & Day */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="stop-title" className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
                Stop Title <span className="text-red-500">*</span>
              </label>
              <input
                id="stop-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sunset Boat Cruise or Heritage Cafe"
                className="w-full text-xs sm:text-sm px-3 py-2.5 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
              />
            </div>

            <div>
              <label htmlFor="stop-day" className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
                Day
              </label>
              <select
                id="stop-day"
                value={day}
                onChange={(e) => setDay(parseInt(e.target.value, 10))}
                className="w-full text-xs sm:text-sm px-3 py-2.5 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <option key={d} value={d}>
                    Day {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Time & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="stop-start" className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
                Start Time
              </label>
              <input
                id="stop-start"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2.5 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
              />
            </div>

            <div>
              <label htmlFor="stop-end" className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
                End Time
              </label>
              <input
                id="stop-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2.5 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
              />
            </div>

            <div>
              <label htmlFor="stop-category" className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                id="stop-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full text-xs sm:text-sm px-3 py-2.5 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
              >
                <option value="activity">Activity / Sightseeing</option>
                <option value="dining">Dining / Food</option>
                <option value="transit">Transit / Transfer</option>
                <option value="rest">Rest / Recharge</option>
              </select>
            </div>
          </div>

          {/* Location & Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="stop-location" className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
                Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#A8A29E] absolute left-3 top-3.5" />
                <input
                  id="stop-location"
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Mandovi River Jetty, Panaji"
                  className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="stop-cost" className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
                Cost Per Person ({currency})
              </label>
              <input
                id="stop-cost"
                type="number"
                value={costPerPerson}
                onChange={(e) => setCostPerPerson(e.target.value)}
                placeholder="250"
                className="w-full text-xs sm:text-sm px-3 py-2.5 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="stop-desc" className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
              Description / Notes
            </label>
            <textarea
              id="stop-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key highlights, dress codes, or rendezvous instructions..."
              className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
            />
          </div>

          {/* Accessibility & Weather Adaptation Shield */}
          <div className="p-3.5 bg-[#FAF9F6] rounded-2xl border border-[#EBE7DF] space-y-3">
            <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D97746]" /> Smart SLM &amp; Accessibility Settings
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-[#1C1917] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOutdoor}
                    onChange={(e) => setIsOutdoor(e.target.checked)}
                    className="rounded border-[#EBE7DF] text-[#D97746] focus:ring-[#D97746]"
                  />
                  <span>Outdoor Venue (Rain Risk)</span>
                </label>
                {isOutdoor && (
                  <div className="mt-1.5">
                    <input
                      type="text"
                      value={indoorFallback}
                      onChange={(e) => setIndoorFallback(e.target.value)}
                      placeholder="Indoor fallback name (for rain swap)"
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-blue-900 placeholder:text-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-[#1C1917] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wheelchairAccessible}
                    onChange={(e) => setWheelchairAccessible(e.target.checked)}
                    className="rounded border-[#EBE7DF] text-[#D97746] focus:ring-[#D97746]"
                  />
                  <span>Wheelchair &amp; Senior Friendly</span>
                </label>
              </div>
            </div>

            {/* Kid Quest Option */}
            <div>
              <label htmlFor="stop-kidquest" className="block text-[10px] font-bold text-[#A8A29E] uppercase mb-1">
                Optional Explorer Kid Quest (+150 XP)
              </label>
              <input
                id="stop-kidquest"
                type="text"
                value={kidQuest}
                onChange={(e) => setKidQuest(e.target.value)}
                placeholder="e.g. Spot 3 sea shells or find the captain's bell!"
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#EBE7DF] rounded-lg focus-visible:ring-2 focus-visible:ring-[#D97746]"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!title.trim() || !location.trim()}
              className="w-full py-3 bg-[#D97746] hover:bg-[#C26333] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition active:scale-98 disabled:opacity-40 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Add Stop to Itinerary</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
