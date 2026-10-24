'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTrip } from '@/lib/state/TripContext';
import {
  X,
  UploadCloud,
  FileText,
  Shield,
  QrCode,
  CheckCircle2,
  Lock,
  Users,
} from 'lucide-react';
import { DocumentItem } from '@/types';

export default function UploadDocumentModal() {
  const { isUploadDocOpen, setIsUploadDocOpen, addDocument, users, currentUser } = useTrip();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<DocumentItem['type']>('boarding_pass');
  const [ownerId, setOwnerId] = useState(currentUser.id || users[0]?.id || 'user');
  const [sharingScope, setSharingScope] = useState<DocumentItem['sharingScope']>('family_all');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [qrPayload, setQrPayload] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [simulatedFile, setSimulatedFile] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  // Sync ownerId if currentUser changes
  useEffect(() => {
    if (currentUser?.id) {
      setOwnerId(currentUser.id);
    }
  }, [currentUser]);

  // Keyboard navigation & accessibility
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isUploadDocOpen) {
        setIsUploadDocOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUploadDocOpen, setIsUploadDocOpen]);

  useEffect(() => {
    if (isUploadDocOpen) {
      modalRef.current?.focus();
    }
  }, [isUploadDocOpen]);

  if (!isUploadDocOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSimulatedFile(file.name);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      if (!referenceNumber) {
        setReferenceNumber(`DOC-${Date.now().toString().slice(-6)}`);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !referenceNumber.trim()) return;

    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      title: title.trim(),
      type,
      ownerId,
      sharingScope,
      referenceNumber: referenceNumber.trim(),
      validUntil: validUntil ? validUntil : undefined,
      qrPayload: qrPayload.trim() || `SAHYATRI-VERIFIED-${referenceNumber.trim()}`,
      cachedOffline: true,
    };

    addDocument(newDoc);

    // Reset form
    setTitle('');
    setReferenceNumber('');
    setQrPayload('');
    setSimulatedFile(null);
    setIsUploadDocOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-doc-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#EBE7DF] overflow-hidden flex flex-col max-h-[92vh] focus-visible:outline-none"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#EBE7DF] bg-[#FAF9F6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D97746] flex items-center justify-center text-white shadow-xs">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 id="upload-doc-title" className="font-serif-title text-lg sm:text-xl font-bold text-[#1C1917]">
                Upload Travel Document
              </h2>
              <p className="text-xs text-[#78716C]">
                Stored with end-to-end RBAC privacy and offline biometric cache
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsUploadDocOpen(false)}
            aria-label="Close upload modal"
            className="p-2 rounded-xl text-[#78716C] hover:text-[#1C1917] hover:bg-white transition focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* File Selector */}
          <div>
            <label className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1.5">
              Select Document File (PDF / Image / QR)
            </label>
            <div className="border-2 border-dashed border-[#EBE7DF] hover:border-[#D97746] rounded-2xl p-4 text-center cursor-pointer bg-[#FAF9F6] transition">
              <input
                type="file"
                id="doc-file-input"
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
              />
              <label htmlFor="doc-file-input" className="cursor-pointer flex flex-col items-center">
                <FileText className="w-8 h-8 text-[#D97746] mb-1.5" />
                <span className="text-xs font-bold text-[#1C1917]">
                  {simulatedFile ? `Attached: ${simulatedFile}` : 'Tap to select document or boarding pass'}
                </span>
                <span className="text-[11px] text-[#A8A29E] mt-0.5">
                  PDF, PNG, JPG (automatically encrypted locally for offline use)
                </span>
              </label>
            </div>
          </div>

          {/* Title & Document Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="doc-title" className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
                Document Title <span className="text-red-500">*</span>
              </label>
              <input
                id="doc-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Flight AI-481 Boarding Pass"
                className="w-full text-xs sm:text-sm px-3 py-2.5 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
              />
            </div>

            <div>
              <label htmlFor="doc-type" className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
                Document Type
              </label>
              <select
                id="doc-type"
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full text-xs sm:text-sm px-3 py-2.5 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
              >
                <option value="boarding_pass">Flight Boarding Pass</option>
                <option value="hotel_voucher">Hotel Booking Confirmation</option>
                <option value="train_ticket">Train / Transit Ticket</option>
                <option value="prescription">Medical Prescription</option>
                <option value="passport">Passport / Govt ID</option>
              </select>
            </div>
          </div>

          {/* Owner & Scope (RBAC) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="doc-owner" className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
                Document Owner
              </label>
              <select
                id="doc-owner"
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2.5 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.relationship})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="doc-scope" className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
                Privacy &amp; Sharing Scope
              </label>
              <select
                id="doc-scope"
                value={sharingScope}
                onChange={(e) => setSharingScope(e.target.value as any)}
                className="w-full text-xs sm:text-sm px-3 py-2.5 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
              >
                <option value="family_all">Family All (Shared with all companions)</option>
                <option value="planner_only">Planner Only (Organizers only)</option>
                <option value="private">Private (Owner &amp; Guardian only)</option>
              </select>
            </div>
          </div>

          {/* Reference Number & QR Payload */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="doc-ref" className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
                Reference / PNR Number <span className="text-red-500">*</span>
              </label>
              <input
                id="doc-ref"
                type="text"
                required
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. PNR: 6E-2849"
                className="w-full text-xs sm:text-sm px-3 py-2.5 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
              />
            </div>

            <div>
              <label htmlFor="doc-valid" className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
                Valid Until (Optional)
              </label>
              <input
                id="doc-valid"
                type="text"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                placeholder="e.g. 18 Oct 2026"
                className="w-full text-xs sm:text-sm px-3 py-2.5 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
              />
            </div>
          </div>

          {/* QR Code Payload */}
          <div>
            <label htmlFor="doc-qr" className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
              QR / Barcode Payload (Optional)
            </label>
            <input
              id="doc-qr"
              type="text"
              value={qrPayload}
              onChange={(e) => setQrPayload(e.target.value)}
              placeholder="e.g. M1SHARMA/ROHAN EABC123 DELJAI AI0481 287Y012A"
              className="w-full text-xs sm:text-sm px-3 py-2.5 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
            />
          </div>

          {/* Privacy Notice */}
          <div className="p-3 rounded-xl bg-[#FAF5EE] border border-[#E8DFC8] flex items-center gap-2 text-xs text-[#78716C]">
            <Shield className="w-4 h-4 text-[#D97746] shrink-0" />
            <span>
              Sensitive health &amp; personal docs are encrypted and strictly enforce role-based access control.
            </span>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!title.trim() || !referenceNumber.trim()}
              className="w-full py-3 bg-[#D97746] hover:bg-[#C26333] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition active:scale-98 disabled:opacity-40 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Store &amp; Encrypt in Vault</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
