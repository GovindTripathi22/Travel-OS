'use client';

import React from 'react';
import { useTrip } from '@/lib/state/TripContext';
import {
  Plane,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  Luggage,
  Users
} from 'lucide-react';

export default function TravelStatusHUD() {
  const { travelStatus, users, updateTravelStatus } = useTrip();

  return (
    <div className="space-y-6">
      {/* Airport Rendezvous Point Master Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-md border border-indigo-800/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/40 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
              <MapPin className="w-7 h-7 text-indigo-300 animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                Designated Group Rendezvous Point
              </span>
              <h2 className="text-xl sm:text-2xl font-bold mt-1">
                Jaipur Airport T2 &bull; Arrival Gate 4 (Pillar 12)
              </h2>
              <p className="text-xs sm:text-sm text-indigo-200/80 mt-0.5">
                Next to Costa Coffee. Chartered Tempo Traveler (RJ-14-PA-8821) parked in lane 2.
              </p>
            </div>
          </div>

          <div className="bg-indigo-900/60 border border-indigo-700/60 px-4 py-3 rounded-2xl text-center shrink-0 w-full sm:w-auto">
            <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
              Companions at Rendezvous
            </span>
            <div className="text-xl font-black text-white mt-0.5">
              4 of 6 Gathered
            </div>
          </div>
        </div>
      </div>

      {/* Companions Travel Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((u) => {
          const status = travelStatus[u.id];
          const isLanded = status?.currentStep === 'landed';
          const isAtRendezvous = status?.currentStep === 'at_rendezvous';
          const isInFlight = status?.currentStep === 'in_flight';

          return (
            <div
              key={u.id}
              className={`bg-white border-2 rounded-2xl p-5 shadow-xs transition-all ${
                isAtRendezvous
                  ? 'border-emerald-300 ring-2 ring-emerald-400/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={u.avatar}
                    alt={u.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{u.name}</h4>
                    <span className="text-[11px] text-slate-500">{u.relationship}</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isAtRendezvous
                      ? 'bg-emerald-100 text-emerald-800'
                      : isLanded
                      ? 'bg-blue-100 text-blue-800'
                      : isInFlight
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {isAtRendezvous ? 'At Rendezvous' : isLanded ? 'Landed' : isInFlight ? 'In Flight' : status?.currentStep}
                </span>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-700 space-y-1">
                <p className="font-semibold text-slate-900">{status?.statusText}</p>
                <div className="flex items-center justify-between text-slate-500 pt-1 text-[11px]">
                  <span>Flight: {status?.flightNumber || 'N/A'}</span>
                  <span>{status?.eta ? `ETA: ${status.eta}` : status?.lastUpdated}</span>
                </div>
              </div>

              {/* Status Update Quick Stepper */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-medium text-slate-400">
                  Updated: {status?.lastUpdated}
                </span>

                {!isAtRendezvous && (
                  <button
                    onClick={() => updateTravelStatus(u.id, 'at_rendezvous', 'Arrived at Gate 4 rendezvous point with group.')}
                    className="text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline"
                  >
                    Mark at Rendezvous
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
