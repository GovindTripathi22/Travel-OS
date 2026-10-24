'use client';

import React from 'react';
import { TripProvider, useTrip } from '@/lib/state/TripContext';
import Header from '@/components/layout/Header';
import ModeBanner from '@/components/layout/ModeBanner';
import ElderlyModeView from '@/components/personas/ElderlyModeView';
import KidModeView from '@/components/personas/KidModeView';
import StandardModeView from '@/components/personas/StandardModeView';
import PersonalAssistantDrawer from '@/components/ai/PersonalAssistantDrawer';
import JarvisOrb from '@/components/jarvis/JarvisOrb';
import JarvisHUDModal from '@/components/jarvis/JarvisHUDModal';
import JarvisSOSModal from '@/components/jarvis/JarvisSOSModal';
import AuthModal from '@/components/auth/AuthModal';
import TripSetupModal from '@/components/trip/TripSetupModal';
import AddCompanionModal from '@/components/trip/AddCompanionModal';
import AddItineraryModal from '@/components/itinerary/AddItineraryModal';
import AddPollModal from '@/components/decision/AddPollModal';
import UploadDocumentModal from '@/components/vault/UploadDocumentModal';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { Smartphone, Monitor } from 'lucide-react';

function TripOSApp() {
  const { currentUser, viewMode, setViewMode } = useTrip();

  const renderActivePersonaView = () => {
    switch (currentUser.personaType) {
      case 'elderly':
        return <ElderlyModeView />;
      case 'kid':
        return <KidModeView />;
      case 'standard':
      default:
        return <StandardModeView />;
    }
  };

  if (viewMode === 'phone_preview') {
    return (
      <div className="min-h-screen bg-slate-900 py-8 px-4 flex flex-col items-center justify-center">
        {/* Device Switcher Header */}
        <div className="mb-4 flex items-center justify-between w-full max-w-sm px-2 text-white">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Smartphone className="w-4 h-4 text-orange-400" />
            <span>Mobile Device Simulation</span>
          </div>
          <button
            onClick={() => setViewMode('full')}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg transition border border-slate-700 flex items-center gap-1.5"
          >
            <Monitor className="w-3.5 h-3.5" /> Full Width View
          </button>
        </div>

        {/* Realistic Smartphone Frame */}
        <div className="w-full max-w-[410px] h-[860px] bg-slate-950 rounded-[48px] p-3 shadow-2xl border-4 border-slate-700 relative flex flex-col">
          {/* Dynamic Island / Speaker Pill */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-50 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 ml-auto mr-2" />
          </div>

          {/* Screen Content */}
          <div className="w-full h-full bg-slate-50 rounded-[38px] overflow-hidden flex flex-col relative pt-5">
            <Header />
            <ModeBanner />
            <div className="flex-1 overflow-y-auto">
              {renderActivePersonaView()}
            </div>
            <PersonalAssistantDrawer />
            <JarvisOrb />
            <JarvisHUDModal />
            <JarvisSOSModal />
          </div>

          {/* Home Indicator Bar */}
          <div className="w-32 h-1 bg-slate-600 rounded-full mx-auto mt-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Header />
      <ModeBanner />
      <main className="flex-1">
        {renderActivePersonaView()}
      </main>
      <PersonalAssistantDrawer />
      <JarvisOrb />
      <JarvisHUDModal />
      <JarvisSOSModal />

      {/* Footer */}
      <footer className="border-t border-[#EBE7DF] py-6 text-center text-xs text-[#A8A29E]">
        Sahyatri &mdash; AI Group Travel OS &bull; Built for effortless group travel
      </footer>
    </div>
  );
}

export default function Page() {
  return (
    <AuthProvider>
      <TripProvider>
        <TripOSApp />
        <AuthModal />
        <TripSetupModal />
        <AddCompanionModal />
        <AddItineraryModal />
        <AddPollModal />
        <UploadDocumentModal />
      </TripProvider>
    </AuthProvider>
  );
}
