'use client';

import React from 'react';
import { useTrip } from '@/lib/state/TripContext';
import { Volume2, Gamepad2 } from 'lucide-react';

export default function ModeBanner() {
  const { currentUser } = useTrip();

  if (currentUser.personaType === 'elderly') {
    return (
      <div className="bg-[#FAF5EE] border-b border-[#E8DFC8] px-4 py-2 text-center text-xs text-[#8A631E] font-medium flex items-center justify-center gap-2">
        <Volume2 className="w-3.5 h-3.5" />
        <span>
          <strong>Elderly Mode:</strong> 22px high-contrast text, voice briefings, and low-walking routes active.
        </span>
      </div>
    );
  }

  if (currentUser.personaType === 'kid') {
    return (
      <div className="bg-[#FAF4ED] border-b border-[#EADCCB] px-4 py-2 text-center text-xs text-[#A85122] font-medium flex items-center justify-center gap-2">
        <Gamepad2 className="w-3.5 h-3.5" />
        <span>
          <strong>Kid Mode:</strong> Explorer Quests, countdowns, and Family Emergency Beacon active.
        </span>
      </div>
    );
  }

  // In standard mode, render nothing so the UI is completely clean!
  return null;
}
