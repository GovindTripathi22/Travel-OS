'use client';

import React, { useState } from 'react';
import { useTrip } from '@/lib/state/TripContext';
import {
  ShieldAlert,
  PhoneCall,
  HeartPulse,
  MapPin,
  X,
  Copy,
  Check,
  AlertTriangle,
  Hotel
} from 'lucide-react';

export default function JarvisSOSModal() {
  const { isSosModalOpen, setIsSosModalOpen, users } = useTrip();
  const [copied, setCopied] = useState(false);

  if (!isSosModalOpen) return null;

  const handleCopy = () => {
    const text = `🚨 SAHYATRI EMERGENCY SOS BEACON
Location: Jaipur, Rajasthan (Near City Palace / Rambagh Palace)
Local Emergency: 112 (Police) | 108 (Ambulance)
Nearest Hospital: SMS Medical College & Hospital (+91 141 256 0291)
Hotel Concierge: +91 141 221 1919
Travelers:
- Dadaji (72y): Blood O+ | Hypertension (Amlodipine 5mg)
- Kabir (9y): Blood A+ | Mild pediatric asthma (Inhaler with Meera)
- Priya (28y): Blood B+ | Strict Jain
- Rohan (Lead): +91 98201 11223`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/20 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#382828] border border-red-700/40 rounded-3xl shadow-2xl text-white flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-red-900/60 border-b border-red-700/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg tracking-tight text-red-100 flex items-center gap-2">
                <span>Emergency SOS Protocol</span>
                <span className="text-[10px] bg-red-500 text-white font-black px-1.5 py-0.5 rounded-full uppercase">
                  Active
                </span>
              </h2>
              <p className="text-xs text-red-300/80">
                Offline Emergency Telephony &amp; Companion Health Sentinel
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSosModalOpen(false)}
            className="p-2 rounded-xl text-red-300 hover:text-white hover:bg-red-900/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* 1. Quick Emergency Hotlines */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-red-400 mb-2">
              Instant Emergency Dialers
            </div>
            <div className="grid grid-cols-2 gap-2">
              <a
                href="tel:112"
                className="flex items-center justify-between p-3 rounded-2xl bg-red-900/40 hover:bg-red-900/60 border border-red-800/50 transition"
              >
                <div>
                  <div className="text-[10px] text-red-300 font-bold">National Police</div>
                  <div className="text-base font-extrabold text-white">112</div>
                </div>
                <div className="p-2 rounded-xl bg-red-600 text-white">
                  <PhoneCall className="w-4 h-4" />
                </div>
              </a>

              <a
                href="tel:108"
                className="flex items-center justify-between p-3 rounded-2xl bg-red-900/40 hover:bg-red-900/60 border border-red-800/50 transition"
              >
                <div>
                  <div className="text-[10px] text-red-300 font-bold">Ambulance / Medical</div>
                  <div className="text-base font-extrabold text-white">108</div>
                </div>
                <div className="p-2 rounded-xl bg-red-600 text-white">
                  <PhoneCall className="w-4 h-4" />
                </div>
              </a>
            </div>
          </div>

          {/* 2. Nearest Emergency Facility */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[10px] font-bold text-red-400 uppercase tracking-wide">
                  Nearest Tier-1 Trauma &amp; Emergency Hospital
                </div>
                <div className="text-sm font-bold text-white mt-0.5">
                  Sawai Man Singh (SMS) Medical College Hospital
                </div>
                <div className="text-xs text-[#A8A29E] flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-red-400" />
                  <span>JLN Marg, Ashok Nagar, Jaipur &bull; 4.2 km (8 mins)</span>
                </div>
              </div>

              <a
                href="tel:+911412560291"
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call</span>
              </a>
            </div>
          </div>

          {/* 3. Hotel Front Desk */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white/5 text-amber-400">
                <Hotel className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Rambagh Palace Jaipur Front Desk</div>
                <div className="text-[11px] text-[#A8A29E]">24/7 Group Accommodations &amp; Doctor-on-call</div>
              </div>
            </div>

            <a
              href="tel:+911412211919"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
            >
              Call Desk
            </a>
          </div>

          {/* 4. Companion Medical Tags */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#A8A29E] mb-2">
              Companion Medical Profile Quick-Reference
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white">Dada-ji (72y)</span>
                  <span className="text-[#A8A29E] ml-2">Blood: <strong className="text-red-400">O+</strong></span>
                  <p className="text-[11px] text-[#C4BCB3] mt-0.5">
                    Hypertension. Takes Amlodipine 5mg &amp; Telmisartan 40mg. Mild knee osteoarthritis.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white">Kabir (9y)</span>
                  <span className="text-[#A8A29E] ml-2">Blood: <strong className="text-red-400">A+</strong></span>
                  <p className="text-[11px] text-[#C4BCB3] mt-0.5">
                    Pediatric dust allergy / mild asthma. Inhaler stored in Meera&apos;s daypack.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white">Priya (28y)</span>
                  <span className="text-[#A8A29E] ml-2">Blood: <strong className="text-red-400">B+</strong></span>
                  <p className="text-[11px] text-[#C4BCB3] mt-0.5">Strict Jain. Emergency dietary alert.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-red-950/40 border-t border-red-900/40 flex items-center justify-between">
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-red-600/30"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Emergency SOS Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Emergency Beacon to SMS / WhatsApp</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
