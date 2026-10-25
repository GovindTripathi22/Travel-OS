'use client';

import React, { useState } from 'react';
import { useTrip } from '@/lib/state/TripContext';
import { DocumentItem } from '@/types';
import {
  FileText,
  Shield,
  QrCode,
  Eye,
  CheckCircle2,
  X,
  CheckSquare,
  Square,
  Languages,
  Luggage,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { LOCAL_PHRASES } from '@/lib/state/mockData';

export default function DocumentVault() {
  const { documents, users, packingList, togglePackingItem, setIsUploadDocOpen } = useTrip();
  const { canViewDocument } = useAuth();
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [vaultView, setVaultView] = useState<'passes' | 'packing' | 'phrases'>('passes');

  // Filter documents based on strict Firebase RBAC permissions
  const visibleDocuments = documents.filter((doc) => canViewDocument(doc));

  return (
    <div className="space-y-6">
      {/* Vault Info Bar */}
      <div className="bg-white border border-[#EBE7DF] rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FAF5EE] text-[#D97746] border border-[#E8DFC8] flex items-center gap-1">
              <Shield className="w-3 h-3 text-[#D97746]" /> Granular Vault Security
            </span>
            <span className="text-xs text-[#4D7C5F] font-bold bg-[#F3F9F5] px-2 py-0.5 rounded-full border border-[#D1E5D8]">
              ✓ Cached Offline
            </span>
          </div>
          <h3 className="font-serif-title text-xl font-bold text-[#1C1917] mt-1.5">
            Group Document Vault &amp; Offline Passes
          </h3>
          <p className="text-xs text-[#78716C] mt-0.5">
            Instant 1-tap retrieval for monument tickets, check-in desks, and medical emergencies.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button
            onClick={() => setIsUploadDocOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#D97746] hover:bg-[#C26333] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer"
            aria-label="Upload new travel document"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Upload Document</span>
          </button>

          {/* Sub-View Selector */}
          <div className="flex items-center gap-1 bg-[#F4F1EA] p-1.5 rounded-2xl border border-[#EBE7DF] shadow-2xs">
            <button
              onClick={() => setVaultView('passes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${
                vaultView === 'passes'
                  ? 'bg-white text-[#1C1917] shadow-xs font-bold border border-[#EBE7DF]'
                  : 'text-[#78716C] hover:text-[#1C1917] hover:bg-white/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Passes ({visibleDocuments.length})</span>
            </button>

            <button
              onClick={() => setVaultView('packing')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${
                vaultView === 'packing'
                  ? 'bg-white text-[#1C1917] shadow-xs font-bold border border-[#EBE7DF]'
                  : 'text-[#78716C] hover:text-[#1C1917] hover:bg-white/50'
              }`}
            >
              <Luggage className="w-3.5 h-3.5" />
              <span>Packing ({packingList.filter((p) => p.done).length}/{packingList.length})</span>
            </button>

            <button
              onClick={() => setVaultView('phrases')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${
                vaultView === 'phrases'
                  ? 'bg-white text-[#1C1917] shadow-xs font-bold border border-[#EBE7DF]'
                  : 'text-[#78716C] hover:text-[#1C1917] hover:bg-white/50'
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
        visibleDocuments.length === 0 ? (
          <div className="bg-white border border-dashed border-[#D6D0C5] rounded-2xl p-8 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF5EE] text-[#D97746] flex items-center justify-center border border-[#E8DFC8]">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-[#1C1917]">No travel documents uploaded yet</h4>
            <p className="text-xs text-[#78716C] max-w-sm mx-auto">
              Store flight tickets, train passes, hotel confirmations, and doctor prescriptions securely for instant offline access.
            </p>
            <button
              onClick={() => setIsUploadDocOpen(true)}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-[#D97746] hover:bg-[#C26333] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload First Document</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleDocuments.map((doc) => {
              const owner = users.find((u) => u.id === doc.ownerId);

              return (
                <div
                  key={doc.id}
                  className="bg-white border border-[#EBE7DF] rounded-2xl p-5 shadow-2xs hover:border-[#D97746]/40 hover:shadow-xs transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          doc.sharingScope === 'family_all'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-purple-50 text-purple-800 border border-purple-200'
                        }`}
                      >
                        {doc.sharingScope === 'family_all' ? 'Shared with All Family' : 'Restricted: Planner & Owner Only'}
                      </span>

                      <span className="text-[11px] font-semibold text-[#A8A29E]">
                        Ref: {doc.referenceNumber}
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FAF5EE] text-[#D97746] flex items-center justify-center shrink-0 border border-[#E8DFC8]">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-[#1C1917]">{doc.title}</h4>
                        <p className="text-xs text-[#78716C] mt-0.5">
                          Uploaded by <strong>{owner?.name}</strong> &bull; Valid: {doc.validUntil}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#EBE7DF] flex items-center justify-between">
                    <span className="text-xs text-[#4D7C5F] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Offline Ready
                    </span>

                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="px-3.5 py-1.5 bg-[#2D2723] hover:bg-[#D97746] text-white rounded-xl text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 shadow-2xs hover:shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Pass / QR</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* 2. Packing Checklist View */}
      {vaultView === 'packing' && (
        <div className="bg-white border border-[#EBE7DF] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EBE7DF]">
            <div>
              <h3 className="font-serif-title text-base sm:text-lg font-bold text-[#1C1917]">Essential Packing Checklist</h3>
              <p className="text-xs text-[#78716C]">Curated for Jaipur, monsoon rain guards, and multi-gen health needs</p>
            </div>
            <span className="text-xs font-bold bg-[#FAF5EE] text-[#D97746] border border-[#E8DFC8] px-3 py-1 rounded-full">
              {packingList.filter((p) => p.done).length} / {packingList.length} Packed
            </span>
          </div>

          <div className="space-y-2">
            {packingList.map((item) => (
              <div
                key={item.id}
                onClick={() => togglePackingItem(item.id)}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 cursor-pointer hover:-translate-y-0.5 ${
                  item.done
                    ? 'bg-[#F3F9F5] border-[#D1E5D8] text-[#78716C]'
                    : 'bg-white border-[#EBE7DF] hover:border-[#D97746]/40 text-[#1C1917]'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.done ? (
                    <CheckSquare className="w-5 h-5 text-[#4D7C5F] shrink-0" />
                  ) : (
                    <Square className="w-5 h-5 text-[#A8A29E] shrink-0" />
                  )}
                  <span className={`text-xs font-semibold ${item.done ? 'line-through text-[#A8A29E]' : ''}`}>
                    {item.text}
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FAF9F6] text-[#78716C] border border-[#EBE7DF] shrink-0">
                  {item.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Offline Travel Phrases View */}
      {vaultView === 'phrases' && (
        <div className="bg-white border border-[#EBE7DF] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="pb-3 border-b border-[#EBE7DF]">
            <h3 className="font-serif-title text-base sm:text-lg font-bold text-[#1C1917]">Local Travel Phrasebook (Offline English &rarr; Hindi)</h3>
            <p className="text-xs text-[#78716C]">Quick emergency and dietary phrases to show auto drivers, palace staff, and chefs</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {LOCAL_PHRASES.map((phrase) => (
              <div
                key={phrase.id}
                className="p-4 rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] hover:border-[#D97746]/40 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D97746] bg-[#FAF5EE] border border-[#E8DFC8] px-2 py-0.5 rounded-full">
                      {phrase.badge}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[#78716C]">{phrase.en}</p>
                  <p className="text-sm font-bold text-[#1C1917] mt-2 bg-white p-2.5 rounded-xl border border-[#EBE7DF]">
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative border border-[#EBE7DF] animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedDoc(null)}
              className="absolute top-4 right-4 text-[#A8A29E] hover:text-[#1C1917] p-1 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FAF5EE] text-[#D97746] border border-[#E8DFC8] px-2.5 py-0.5 rounded-full">
              High-Contrast Offline Pass
            </span>

            <h3 className="font-serif-title text-xl font-bold text-[#1C1917] mt-2 mb-0.5">
              {selectedDoc.title}
            </h3>
            <p className="text-xs text-[#78716C] mb-4">
              Ref: {selectedDoc.referenceNumber}
            </p>

            {/* QR Code Container */}
            <div className="bg-[#FAF9F6] border border-[#EBE7DF] rounded-2xl p-6 inline-block mx-auto mb-4 shadow-2xs">
              <QrCode className="w-40 h-40 text-[#1C1917] mx-auto" />
              <p className="text-[10px] font-mono text-[#78716C] mt-2 truncate max-w-[200px]">
                {selectedDoc.qrPayload || selectedDoc.referenceNumber}
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setSelectedDoc(null)}
                className="w-full py-2.5 bg-[#2D2723] hover:bg-[#D97746] text-white font-bold rounded-xl text-xs transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-xs"
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
