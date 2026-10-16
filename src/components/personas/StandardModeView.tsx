'use client';

import React, { useEffect } from 'react';
import { useTrip } from '@/lib/state/TripContext';
import ItineraryTimeline from '../itinerary/ItineraryTimeline';
import MechanismPollCard from '../decision/MechanismPollCard';
import ExpenseLedger from '../expenses/ExpenseLedger';
import TravelStatusHUD from '../status/TravelStatusHUD';
import DocumentVault from '../vault/DocumentVault';
import PreTripRadar from '../alignment/PreTripRadar';
import PhotoStream from '../memories/PhotoStream';
import {
  Calendar,
  Vote,
  CreditCard,
  FolderLock,
  Plane,
  Compass,
  Camera,
  Sparkles,
  CheckCircle2,
  MapPin,
} from 'lucide-react';

type Tab = 'timeline' | 'decisions' | 'expenses' | 'vault';
type Sub = 'passes' | 'rendezvous' | 'alignment' | 'photos';

interface NavItem {
  id: string;
  label: string;
  desc: string;
  group: string;
  icon: React.ElementType;
  tab: Tab;
  sub?: Sub;
}

// Every section is now one tap away (the vault sub-tabs used to be buried).
const NAV: NavItem[] = [
  { id: 'timeline', label: 'Timeline', group: 'Plan', icon: Calendar, tab: 'timeline', desc: 'Your day-by-day plan, adapted to how everyone is feeling.' },
  { id: 'decisions', label: 'Decisions', group: 'Plan', icon: Vote, tab: 'decisions', desc: 'Spend voice credits on what matters most. No deadlocks.' },
  { id: 'expenses', label: 'Expenses', group: 'Plan', icon: CreditCard, tab: 'expenses', desc: 'Shared costs settled in the fewest possible transfers.' },
  { id: 'passes', label: 'Passes', group: 'Travel', icon: FolderLock, tab: 'vault', sub: 'passes', desc: 'Boarding passes and QR codes, available offline.' },
  { id: 'rendezvous', label: 'Rendezvous', group: 'Travel', icon: Plane, tab: 'vault', sub: 'rendezvous', desc: 'Where everyone is, and where to meet at the airport.' },
  { id: 'alignment', label: 'Alignment', group: 'Together', icon: Compass, tab: 'vault', sub: 'alignment', desc: 'Pace, diet and energy: see where the group differs.' },
  { id: 'photos', label: 'Photos', group: 'Together', icon: Camera, tab: 'vault', sub: 'photos', desc: 'A shared stream that becomes your trip story.' },
];

export default function StandardModeView() {
  const { conflicts, resolveConflict, users, activeTab, setActiveTab, vaultSubTab, setVaultSubTab } = useTrip();

  const topConflict = conflicts.filter((c) => !c.resolved)[0];
  const current = NAV.find((n) => n.tab === activeTab && (!n.sub || n.sub === vaultSubTab)) ?? NAV[0];

  const go = (n: NavItem) => {
    setActiveTab(n.tab);
    if (n.sub) setVaultSubTab(n.sub);
  };

  // Keep the active pill visible on small screens
  useEffect(() => {
    document
      .querySelector('[data-nav-active="true"]')
      ?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [current.id]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      {/* Trip hero */}
      <section className="hero-card fade-up">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-5">
          <div>
            <span className="chip-glass">
              <MapPin className="w-3.5 h-3.5" /> Jaipur, Rajasthan &bull; Day 1 of 5
            </span>
            <h1 className="font-serif-title text-3xl sm:text-5xl font-bold mt-3 leading-[1.05] tracking-tight">
              Rajasthan Family Expedition
            </h1>
            <p className="mt-2 text-sm text-white/80">Oct 14 &ndash; 18 &bull; {users.length} companions</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {users.map((u) => (
                <img
                  key={u.id}
                  src={u.avatar}
                  alt={u.name}
                  title={u.name}
                  className="w-9 h-9 rounded-full object-cover border-2 border-white/90 hover:scale-110 hover:z-10 transition-transform"
                />
              ))}
            </div>
            <span className="chip-glass">
              <CheckCircle2 className="w-3.5 h-3.5" /> {users.length} aligned
            </span>
          </div>
        </div>
        <div className="relative z-10 mt-6">
          <div className="flex justify-between text-[11px] font-semibold text-white/80 mb-1.5">
            <span>Trip progress</span>
            <span>Day 1 / 5</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/25">
            <div className="h-full w-1/5 rounded-full bg-white" />
          </div>
        </div>
      </section>

      {/* Proactive suggestion */}
      {topConflict && (
        <section className="fade-up flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-[var(--shadow-soft)]">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-white text-[#D97746] flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">Suggested schedule change</p>
              <p className="text-xs text-amber-900/80 mt-0.5 leading-relaxed">
                {topConflict.description} &bull; <em>{topConflict.suggestedAction.details}</em>
              </p>
            </div>
          </div>
          <button
            onClick={() => resolveConflict(topConflict.id)}
            className="btn-hover-lift shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#D97746] px-4 py-2 text-xs font-bold text-white hover:bg-[#C26333]"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Apply 1-click fix
          </button>
        </section>
      )}

      {/* One flat navigation: every section, grouped */}
      <nav aria-label="Trip sections" className="nav-rail scrollbar-none">
        {NAV.map((n, i) => {
          const Icon = n.icon;
          const active = n.id === current.id;
          return (
            <React.Fragment key={n.id}>
              {i > 0 && NAV[i - 1].group !== n.group && <span className="nav-divider" aria-hidden />}
              <button
                onClick={() => go(n)}
                data-nav-active={active}
                aria-current={active ? 'page' : undefined}
                className={`nav-pill ${active ? 'is-active' : ''}`}
              >
                <Icon className="w-4 h-4" />
                <span>{n.label}</span>
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      {/* Section heading + content */}
      <main key={current.id} className="fade-up space-y-5 pt-1">
        <header>
          <p className="eyebrow">{current.group}</p>
          <h2 className="font-serif-title text-2xl sm:text-3xl font-bold tracking-tight">{current.label}</h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{current.desc}</p>
        </header>

        {current.id === 'timeline' && <ItineraryTimeline />}
        {current.id === 'decisions' && <MechanismPollCard />}
        {current.id === 'expenses' && <ExpenseLedger />}
        {current.id === 'passes' && <DocumentVault />}
        {current.id === 'rendezvous' && <TravelStatusHUD />}
        {current.id === 'alignment' && <PreTripRadar />}
        {current.id === 'photos' && <PhotoStream />}
      </main>
    </div>
  );
}
