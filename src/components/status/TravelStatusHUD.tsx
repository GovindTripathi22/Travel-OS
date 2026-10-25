// src/components/status/TravelStatusHUD.tsx
'use client';

import React, { useEffect, useState } from 'react';
import {
  CloudSun,
  ArrowRightLeft,
  Radio,
  MapPin,
  Sparkles,
  Plane,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  Luggage,
  Users
} from 'lucide-react';
import { LiveWeatherTelemetry, LiveForexRates, getClientLiveData } from '@/lib/api/liveDataService';
import { useTrip } from '@/lib/state/TripContext';

export default function TravelStatusHUD() {
  const { travelStatus, users, updateTravelStatus, tripInfo } = useTrip();
  const [weather, setWeather] = useState<LiveWeatherTelemetry | null>(null);
  const [forex, setForex] = useState<LiveForexRates | null>(null);
  const [isLive, setIsLive] = useState(false);

  const rendezvousCompanions = users.filter((u) => travelStatus[u.id]?.currentStep === 'at_rendezvous');
  const gatheredCount = rendezvousCompanions.length;

  useEffect(() => {
    async function loadTelemetry() {
      try {
        const data = await getClientLiveData();
        if (data) {
          if (data.weather) setWeather(data.weather);
          if (data.forex) setForex(data.forex);
          setIsLive(true);
        }
      } catch {
        console.warn('Operating on fallback telemetry');
      }
    }
    loadTelemetry();
  }, []);

  return (
    <div className="space-y-6">
      {/* 1. Live Weather & Forex Real-Time Telemetry Banner */}
      <div className="w-full bg-white border border-[#EBE6DE] rounded-3xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Destination & Live Indicator */}
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#D97746] shrink-0 shadow-2xs">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#1C1917] text-sm sm:text-base">
                  {weather?.destination || tripInfo?.destination || 'Jaipur, Rajasthan'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                    isLive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                      : 'bg-stone-100 text-stone-600 border border-stone-200'
                  }`}
                >
                  <Radio className={`w-3 h-3 ${isLive ? 'animate-pulse text-emerald-600' : ''}`} />
                  {isLive ? 'LIVE DATA' : 'OFFLINE'}
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Expedition Coordinates: 35.0116° N, 135.7681° E • Updated {weather?.updatedAt || 'Recently'}
              </p>
            </div>
          </div>

          {/* Live Weather Widget */}
          <div className="flex items-center gap-3 bg-[#FAF8F5] border border-amber-200/80 px-4 py-2.5 rounded-2xl shadow-2xs">
            <CloudSun className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <div className="text-xs font-bold text-[#1C1917]">
                {weather ? `${weather.temperatureC}°C (${weather.condition})` : 'Loading Weather...'}
              </div>
              <div className="text-[10px] text-stone-500">
                Feels like {weather?.apparentTempC || '--'}°C • Wind: {weather?.windSpeedKmh || '--'} km/h • Humidity: {weather?.humidity || '--'}%
              </div>
            </div>
          </div>

          {/* Live Currency Forex Widget */}
          <div className="flex items-center gap-3 bg-[#FAF8F5] border border-emerald-200/80 px-4 py-2.5 rounded-2xl shadow-2xs">
            <ArrowRightLeft className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="text-xs font-bold text-[#1C1917]">
                {forex ? `1 INR = ¥${(forex.rates?.JPY ?? (forex as any).JPY ?? 1.82)} JPY` : 'Loading Exchange Rate...'}
              </div>
              <div className="text-[10px] text-stone-500">
                Interbank Rates: $1 USD = ₹{(1 / (forex?.rates?.USD ?? (forex as any)?.USD ?? 0.012)).toFixed(1)} • €1 EUR = ₹{(1 / (forex?.rates?.EUR ?? (forex as any)?.EUR ?? 0.011)).toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Airport Rendezvous Master Card */}
      <div className="bg-gradient-to-r from-[#344059] via-[#435273] to-[#344059] rounded-3xl p-6 text-white shadow-md border border-indigo-400/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/40 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
              <Navigation className="w-7 h-7 text-indigo-300 animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                Designated Group Rendezvous Point
              </span>
              <h2 className="text-xl sm:text-2xl font-bold mt-1">
                {tripInfo?.destination ? `${tripInfo.destination.split(',')[0]} Rendezvous` : 'Airport Arrival & Meeting Point'} &bull; Main Gate
              </h2>
              <p className="text-xs sm:text-sm text-indigo-200/80 mt-0.5">
                Central meeting point. Group vehicle and airport transfer rendezvous coordinates active.
              </p>
            </div>
          </div>

          <div className="bg-indigo-900/50 border border-indigo-600/50 px-4 py-3 rounded-2xl text-center shrink-0 w-full sm:w-auto">
            <span className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">
              Companions at Rendezvous
            </span>
            <div className="text-xl font-black text-white mt-0.5">
              {gatheredCount} of {users.length} Gathered
            </div>
          </div>
        </div>
      </div>

      {/* 3. Companions Travel Status Grid */}
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
                    loading="lazy"
                    decoding="async"
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
                  <span>ETA: {status?.eta || 'On Schedule'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
