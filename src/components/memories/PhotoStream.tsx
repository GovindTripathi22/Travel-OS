'use client';

import React, { useState } from 'react';
import { useTrip } from '@/lib/state/TripContext';
import {
  Camera,
  Sparkles,
  Heart,
  Share2,
  Calendar,
  MapPin,
  Users,
  BookOpen,
  Award
} from 'lucide-react';

export default function PhotoStream() {
  const { memories, users } = useTrip();
  const [activeTab, setActiveTab] = useState<'photos' | 'story'>('photos');
  const [generatingStory, setGeneratingStory] = useState(false);
  const [storyGenerated, setStoryGenerated] = useState(true);

  const triggerGenerateStory = () => {
    setGeneratingStory(true);
    setTimeout(() => {
      setGeneratingStory(false);
      setStoryGenerated(true);
      setActiveTab('story');
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header & Tab Selector */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 flex items-center gap-1">
              <Camera className="w-3 h-3" /> Auto-Aggregated Memory Loop
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Multi-Companion Photo Ingestion
            </span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mt-1">
            Trip Stories & Living Memory Bank
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Auto-synthesizes photos from everyone into an enduring family storybook.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('photos')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === 'photos'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Photos ({memories.length})
          </button>
          <button
            onClick={() => setActiveTab('story')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'story'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-orange-500" /> AI Story Recap
          </button>
        </div>
      </div>

      {/* Photo Grid View */}
      {activeTab === 'photos' && (
        memories.length === 0 ? (
          <div className="bg-white border border-dashed border-[#D6D0C5] rounded-3xl p-8 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF5EE] text-[#D97746] flex items-center justify-center border border-[#E8DFC8]">
              <Camera className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-[#1C1917]">No shared photos uploaded yet</h4>
            <p className="text-xs text-[#78716C] max-w-sm mx-auto">
              Capture moments during your journey. Shared companion photos are auto-synthesized into your living family travel chronicle.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {memories.map((mem) => {
            const uploader = users.find((u) => u.id === mem.uploaderId);

            return (
              <div
                key={mem.id}
                className="bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                    <img
                      src={mem.imageUrl}
                      alt={mem.caption}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 bg-black/25 backdrop-blur-[2px] text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-orange-400" /> {mem.location}
                    </div>
                  </div>

                  <div className="p-5">
                    <p className="text-sm font-semibold text-slate-900">
                      "{mem.caption}"
                    </p>

                    {mem.aiStorySnippet && (
                      <p className="text-xs text-slate-500 mt-2 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        ✨ <strong>AI Memory Note:</strong> {mem.aiStorySnippet}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-slate-100 flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={uploader?.avatar}
                      alt={uploader?.name}
                      className="w-6 h-6 rounded-full object-cover border border-slate-200"
                    />
                    <span className="text-[11px] text-slate-600 font-medium">
                      By {uploader?.name.split(' ')[0]}
                    </span>
                  </div>

                  <div className="flex items-center -space-x-1.5">
                    {mem.taggedUserIds.map((uid) => {
                      const tu = users.find((u) => u.id === uid);
                      return (
                        <img
                          key={uid}
                          src={tu?.avatar}
                          alt={tu?.name}
                          title={tu?.name}
                          className="w-5 h-5 rounded-full object-cover border-2 border-white ring-1 ring-slate-200"
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )
      )}

      {/* AI Story Recap View */}
      {activeTab === 'story' && (
        <div className="bg-gradient-to-br from-amber-50/60 via-white to-orange-50/60 border-2 border-orange-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <span className="text-xs font-black uppercase tracking-wider text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                AI Narrative Memory Chronicle
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                Day 1 Chronicles: Harmony in the Pink City
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Generated across 6 companion perspectives &bull; Oct 14, 2026
              </p>
            </div>

            <div className="prose prose-slate max-w-none text-slate-700 text-sm sm:text-base leading-relaxed space-y-4">
              <p>
                From the moment the wheels touched down at Jaipur International Airport, the trip unfolded like a classic Marwari painting. With airport rendezvous logistics effortlessly aligned, the family gathered at Rambagh Palace under the shade of blooming bougainvillea.
              </p>
              <p>
                Dadaji beamed as Kabir chased royal peacocks across the marble courtyards, while Priya enjoyed the authentic Marwari thali at Surya Mahal without a single dietary worry. By evening, as folk music echoed across the courtyard, the deepest truth was realized: this wasn't just a vacation, but a trip where the planner wasn't exhausted, and every single traveler felt seen.
              </p>
            </div>

            {/* Highlights Box */}
            <div className="bg-white border-2 border-orange-200/80 rounded-2xl p-5 my-6 shadow-xs">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-orange-500" /> Curated Moments of Connection
              </h4>
              <ul className="text-xs sm:text-sm text-slate-700 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                  Rohan experienced zero planner burnout through proactive automated assistant briefings.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                  Dadaji comfortably observed the folk dance with zero stair climbing or fatigue.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                  Priya's strict Jain dietary preferences were 100% pre-vetted at all venues.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                  Kabir unlocked Level 3 Desert Explorer status with Dadaji watching his puppet dance.
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => alert('Trip memory link copied to clipboard! Shared with family WhatsApp group.')}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-sm active:scale-95"
              >
                <Share2 className="w-4 h-4" /> Share Memory Book with Family
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
