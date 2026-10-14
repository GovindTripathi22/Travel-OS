'use client';

import React, { useState } from 'react';
import { useTrip } from '@/lib/state/TripContext';
import { DocumentItem } from '@/types';
import {
  FileText,
  Shield,
  QrCode,
  Download,
  Eye,
  Lock,
  Users,
  CheckCircle2,
  X,
  CheckSquare,
  Square,
  Languages,
  Luggage,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { LOCAL_PHRASES } from '@/lib/state/mockData';

export default function DocumentVault() {
  const { documents, users, currentUser, packingList, togglePackingItem } = useTrip();
  const { canViewDocument, isAdmin } = useAuth();
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [vaultView, setVaultView] = useState<'passes' | 'packing' | 'phrases'>('passes');

  // Filter documents based on strict Firebase RBAC permissions
  const visibleDocuments = documents.filter((doc) => canViewDocument(doc));

  return (
    <div className="space-y-6">
      {/* Vault Info Bar */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-600" /> Granular Vault Security
            </span>
            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
              ✓ Cached for Offline Access
            </span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mt-1">
            Group Document Vault & Offline Passes
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Instant 1-tap retrieval for gate agents, check-in desks, and medical emergencies.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Sub-View Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setVaultView('passes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                vaultView === 'passes'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Passes ({visibleDocuments.length})</span>
            </button>

            <button
              onClick={() => setVaultView('packing')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                vaultView === 'packing'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Luggage className="w-3.5 h-3.5" />
              <span>Packing ({packingList.filter((p) => p.done).length}/{packingList.length})</span>
            </button>

            <button
              onClick={() => setVaultView('phrases')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                vaultView === 'phrases'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Languages className="w-3.5 h-3.5" />
              <span>Phrases ({LOCAL_PHRASES.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. Passes Grid View */}
      {vaultView === 'passes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleDocuments.map((doc) => {
          const owner = users.find((u) => u.id === doc.ownerId);

          return (
            <div
              key={doc.id}
              className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      doc.sharingScope === 'family_all'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {doc.sharingScope === 'family_all' ? 'Shared with All Family' : 'Restricted: Planner & Owner Only'}
                  </span>

                  <span className="text-[11px] font-semibold text-slate-400">
                    Ref: {doc.referenceNumber}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{doc.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Uploaded by <strong>{owner?.name}</strong> &bull; Valid: {doc.validUntil}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Offline Ready
                </span>

                <button
                  onClick={() => setSelectedDoc(doc)}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5" /> View Pass / QR
                </button>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* 2. Packing Checklist View */}
      {vaultView === 'packing' && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Essential Packing Checklist</h3>
              <p className="text-xs text-slate-500">Curated for Jaipur, monsoon rain guards, and multi-gen health needs</p>
            </div>
            <span className="text-xs font-bold bg-orange-100 text-[#D97746] px-3 py-1 rounded-full">
              {packingList.filter((p) => p.done).length} / {packingList.length} Packed
            </span>
          </div>

          <div className="space-y-2">
            {packingList.map((item) => (
              <div
                key={item.id}
                onClick={() => togglePackingItem(item.id)}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition cursor-pointer ${
                  item.done
                    ? 'bg-emerald-50/60 border-emerald-200 text-slate-500'
                    : 'bg-white border-slate-200 hover:border-orange-300 text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.done ? (
                    <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                  <span className={`text-xs font-semibold ${item.done ? 'line-through text-slate-400' : ''}`}>
                    {item.text}
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                  {item.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Offline Travel Phrases View */}
      {vaultView === 'phrases' && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Local Travel Phrasebook (Offline English &rarr; Hindi)</h3>
            <p className="text-xs text-slate-500">Quick emergency and dietary phrases to show auto drivers, palace staff, and chefs</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {LOCAL_PHRASES.map((phrase) => (
              <div
                key={phrase.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D97746] bg-orange-100 px-2 py-0.5 rounded-full">
                      {phrase.badge}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-600">{phrase.en}</p>
                  <p className="text-sm font-bold text-slate-900 mt-2 font-hindi bg-white p-2.5 rounded-xl border border-slate-200">
                    &ldquo;{phrase.hi}&rdquo;
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Quick View / QR Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setSelectedDoc(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded-full">
              High-Contrast Offline Pass
            </span>

            <h3 className="text-lg font-bold text-slate-900 mt-2 mb-1">
              {selectedDoc.title}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Ref: {selectedDoc.referenceNumber}
            </p>

            {/* QR Code Container */}
            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-6 inline-block mx-auto mb-4">
              <QrCode className="w-40 h-40 text-slate-900 mx-auto" />
              <p className="text-[10px] font-mono text-slate-500 mt-2 truncate max-w-[200px]">
                {selectedDoc.qrPayload || selectedDoc.referenceNumber}
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setSelectedDoc(null)}
                className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs"
              >
                Close Pass
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
