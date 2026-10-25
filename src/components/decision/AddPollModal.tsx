'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTrip } from '@/lib/state/TripContext';
import {
  X,
  Vote,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  Coins,
  Scale,
} from 'lucide-react';
import { MechanismPoll, PollOption } from '@/types';

export default function AddPollModal() {
  const { isAddPollOpen, setIsAddPollOpen, addPoll, currentUser } = useTrip();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mechanismType, setMechanismType] = useState<'quadratic' | 'borda' | 'approval'>('quadratic');
  const [deadline, setDeadline] = useState('Today, 7:00 PM');
  const [options, setOptions] = useState<Array<{ id: string; title: string; description: string; cost: string; location: string }>>([
    { id: 'opt-1', title: 'Sunset Catamaran Cruise', description: 'Scenic 2-hour coastal sail with light refreshments.', cost: '₹1,500/person', location: 'Marina Jetty' },
    { id: 'opt-2', title: 'Heritage Night Street Walk & Cafe', description: 'Explore colonial architecture and artisan bakeries with zero stairs.', cost: '₹600/person', location: 'Old Quarter' },
  ]);

  const modalRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation & accessibility
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isAddPollOpen) {
        setIsAddPollOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddPollOpen, setIsAddPollOpen]);

  useEffect(() => {
    if (isAddPollOpen) {
      modalRef.current?.focus();
    }
  }, [isAddPollOpen]);

  if (!isAddPollOpen) return null;

  const handleAddOption = () => {
    if (options.length >= 4) return;
    const newId = `opt-${Date.now()}`;
    setOptions((prev) => [
      ...prev,
      { id: newId, title: '', description: '', cost: '₹500/person', location: 'Local Venue' },
    ]);
  };

  const handleRemoveOption = (id: string) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((o) => o.id !== id));
  };

  const handleOptionChange = (id: string, field: 'title' | 'description' | 'cost' | 'location', value: string) => {
    setOptions((prev) =>
      prev.map((o) => (o.id === id ? { ...o, [field]: value } : o))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const validOptions: PollOption[] = options.map((opt, idx) => ({
      id: opt.id || `opt-${idx + 1}`,
      title: opt.title.trim() || `Option ${idx + 1}`,
      description: opt.description.trim() || 'Custom group activity suggestion.',
      costEstimate: opt.cost.trim() || '₹500/person',
      location: opt.location.trim() || 'Local Area',
      category: 'Activity',
      votes: 0,
    }));

    const newPoll: MechanismPoll = {
      id: `poll-${Date.now()}`,
      title: title.trim(),
      description:
        description.trim() ||
        (mechanismType === 'quadratic'
          ? 'Quadratic mechanism voting: each vote costs V² credits to balance loud voices.'
          : 'Consensus voting for group schedule alignment.'),
      mechanismType,
      status: 'active',
      deadline: deadline.trim() || 'Today, 8:00 PM',
      options: validOptions,
      userVotes: {},
    };

    addPoll(newPoll);

    // Reset form
    setTitle('');
    setDescription('');
    setIsAddPollOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-poll-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#EBE7DF] overflow-hidden flex flex-col max-h-[92vh] focus-visible:outline-none"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#EBE7DF] bg-[#FAF9F6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D97746] flex items-center justify-center text-white shadow-xs">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <h2 id="add-poll-title" className="font-serif-title text-lg sm:text-xl font-bold text-[#1C1917]">
                Create Mechanism Voting Poll
              </h2>
              <p className="text-xs text-[#78716C]">
                Empower your group to decide activities with Quadratic Voice Credits
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddPollOpen(false)}
            aria-label="Close poll modal"
            className="p-2 rounded-xl text-[#78716C] hover:text-[#1C1917] hover:bg-white transition focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* Poll Title */}
          <div>
            <label htmlFor="poll-title" className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
              Poll Decision Question <span className="text-red-500">*</span>
            </label>
            <input
              id="poll-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Day 3 Evening: Sunset Cruise vs Heritage Market Walk?"
              className="w-full text-xs sm:text-sm px-3 py-2.5 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
            />
          </div>

          {/* Mechanism & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="poll-mechanism" className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
                Voting Mechanism
              </label>
              <select
                id="poll-mechanism"
                value={mechanismType}
                onChange={(e) => setMechanismType(e.target.value as any)}
                className="w-full text-xs sm:text-sm px-3 py-2.5 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
              >
                <option value="quadratic">Quadratic Voting (V² Voice Credits)</option>
                <option value="borda">Borda Count (Ranked Preferences)</option>
                <option value="approval">Approval Voting (Yes/No)</option>
              </select>
            </div>

            <div>
              <label htmlFor="poll-deadline" className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
                Voting Deadline
              </label>
              <input
                id="poll-deadline"
                type="text"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                placeholder="e.g. Today, 6:00 PM"
                className="w-full text-xs sm:text-sm px-3 py-2.5 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="poll-desc" className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
              Context &amp; Group Instructions
            </label>
            <textarea
              id="poll-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain why this decision matters or special constraints..."
              className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
            />
          </div>

          {/* Options List */}
          <div className="space-y-3 pt-2 border-t border-[#EBE7DF]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider block">
                  Competing Options ({options.length}/4)
                </span>
                <span className="text-[11px] text-[#A8A29E]">
                  Companions will allocate voice credits across these alternatives
                </span>
              </div>
              {options.length < 4 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="px-2.5 py-1 text-xs font-bold bg-[#FAF5EE] text-[#D97746] rounded-lg border border-[#E8DFC8] flex items-center gap-1 hover:bg-[#F4ECE0] transition focus-visible:ring-2 focus-visible:ring-[#D97746]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Option</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              {options.map((opt, idx) => (
                <div
                  key={opt.id}
                  className="p-3 bg-[#FAF9F6] border border-[#EBE7DF] rounded-2xl space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1C1917]">
                      Option {idx + 1}
                    </span>
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(opt.id)}
                        aria-label={`Remove option ${idx + 1}`}
                        className="text-[#A8A29E] hover:text-red-500 p-1 rounded-md transition focus-visible:ring-2 focus-visible:ring-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={opt.title}
                      onChange={(e) => handleOptionChange(opt.id, 'title', e.target.value)}
                      placeholder="Option Name (e.g. Sunset Jeep Safari)"
                      className="text-xs px-2.5 py-2 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
                    />
                    <input
                      type="text"
                      value={opt.cost}
                      onChange={(e) => handleOptionChange(opt.id, 'cost', e.target.value)}
                      placeholder="Cost Estimate (e.g. ₹1,200/person)"
                      className="text-xs px-2.5 py-2 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
                    />
                  </div>

                  <input
                    type="text"
                    value={opt.description}
                    onChange={(e) => handleOptionChange(opt.id, 'description', e.target.value)}
                    placeholder="Brief description or highlight..."
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!title.trim() || options.some((o) => !o.title.trim())}
              className="w-full py-3 bg-[#D97746] hover:bg-[#C26333] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition active:scale-98 disabled:opacity-40 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-[#D97746] focus-visible:outline-none"
            >
              <Vote className="w-4 h-4" />
              <span>Launch Group Mechanism Poll</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
