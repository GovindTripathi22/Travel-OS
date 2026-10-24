'use client';

import React from 'react';
import { useTrip } from '@/lib/state/TripContext';
import {
  Sparkles,
  Award,
  Coins
} from 'lucide-react';

export default function MechanismPollCard() {
  const {
    polls,
    currentUser,
    submitQuadraticVote,
    finalizePoll,
    users,
    setIsAddPollOpen,
  } = useTrip();

  const [selectedPollIndex, setSelectedPollIndex] = React.useState(0);

  if (!polls || polls.length === 0) {
    return (
      <div className="bg-white border border-dashed border-[#D6D0C5] rounded-2xl p-6 sm:p-8 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF5EE] text-[#D97746] flex items-center justify-center border border-[#E8DFC8]">
          <Coins className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#D97746] bg-[#FAF5EE] px-2 py-0.5 rounded-full">
            Fair Group Decision Making
          </span>
          <h2 className="text-lg font-bold text-[#1C1917] mt-1.5">No Active Consensus Polls</h2>
          <p className="text-xs text-[#78716C] max-w-md mx-auto mt-1 leading-relaxed">
            Avoid endless group chat arguments! Use Quadratic Voting where every traveler receives 100 voice credits to express preference intensity fairly.
          </p>
        </div>
        <button
          onClick={() => setIsAddPollOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#D97746] hover:bg-[#C26333] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
          aria-label="Create your first consensus poll"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>+ Create First Consensus Poll</span>
        </button>
      </div>
    );
  }

  const pollIndex = Math.min(selectedPollIndex, polls.length - 1);
  const poll = polls[pollIndex] || polls[0];

  const userVotesMap = poll.userVotes[currentUser.id] || {};

  let totalCreditsSpent = 0;
  for (const [, votes] of Object.entries(userVotesMap)) {
    const v = typeof votes === 'number' ? votes : 0;
    totalCreditsSpent += v * v;
  }
  const remainingCredits = Math.max(0, 100 - totalCreditsSpent);

  const optionScores: Record<string, number> = {};
  poll.options.forEach((opt) => {
    optionScores[opt.id] = 0;
  });
  for (const [, votesMap] of Object.entries(poll.userVotes || {})) {
    if (!votesMap || typeof votesMap !== 'object') continue;
    for (const [optId, v] of Object.entries(votesMap)) {
      if (typeof v === 'number') {
        optionScores[optId] = (optionScores[optId] || 0) + v;
      }
    }
  }

  return (
    <div className="bg-white border border-[#EBE7DF] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
      {/* Poll Multi-Tab Switcher if multiple polls exist */}
      {polls.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#EBE7DF]">
          {polls.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setSelectedPollIndex(idx)}
              className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                idx === pollIndex
                  ? 'bg-[#1C1917] text-white shadow-2xs'
                  : 'bg-[#F4F1EA] text-[#78716C] hover:bg-[#EBE7DF]'
              }`}
              aria-label={`Switch to poll: ${p.title}`}
            >
              Poll {idx + 1}: {p.title.length > 20 ? p.title.substring(0, 20) + '...' : p.title}
            </button>
          ))}
        </div>
      )}

      {/* Poll Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EBE7DF]">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#D97746] bg-[#FAF5EE] px-2 py-0.5 rounded-full">
            {poll.mechanismType === 'quadratic' ? 'Quadratic Group Poll' : `${poll.mechanismType.toUpperCase()} Poll`}
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-[#1C1917] mt-1">
            {poll.title}
          </h2>
          <p className="text-xs text-[#78716C] mt-0.5">
            {poll.description || 'Vote cost is quadratic (V² credits) to balance intense preferences without loud voices dominating.'}
          </p>
        </div>

        {/* Credit Bank & New Poll CTA */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#F4F1EA] px-3.5 py-2 rounded-xl shrink-0">
            <Coins className="w-4 h-4 text-[#D97746]" />
            <div className="text-xs">
              <span className="text-[#78716C]">Voice Credits: </span>
              <strong className="text-[#1C1917]">{remainingCredits} / 100</strong>
            </div>
          </div>

          <button
            onClick={() => setIsAddPollOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#FAF5EE] hover:bg-[#F4F1EA] text-[#D97746] border border-[#E8DFC8] rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
            aria-label="Create new group consensus poll"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ New Poll</span>
          </button>
        </div>
      </div>

      {/* Consensus Resolution Banner */}
      {poll.status === 'resolved' && poll.consensusExplanation && (
        <div className="p-3.5 rounded-xl bg-[#F3F9F5] border border-[#D1E5D8] flex items-start gap-2.5 text-xs text-[#1C1917]">
          <Award className="w-4 h-4 text-[#4D7C5F] shrink-0 mt-0.5" />
          <div>
            <strong className="text-[#4D7C5F]">Consensus Decided: </strong>
            {poll.consensusExplanation}
          </div>
        </div>
      )}

      {/* Poll Options List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {poll.options.map((opt) => {
          const myVotes = userVotesMap[opt.id] || 0;
          const myCost = myVotes * myVotes;
          const nextCost = (myVotes + 1) * (myVotes + 1) - myCost;
          const totalGroupVotes = optionScores[opt.id] || 0;
          const isWinner = poll.winningOptionId === opt.id;

          return (
            <div
              key={opt.id}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                isWinner
                  ? 'bg-[#FAF5EE] border-[#D97746]'
                  : 'bg-[#FAF9F6] border-[#EBE7DF]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[10px] font-semibold text-[#78716C] uppercase">
                    {opt.category}
                  </span>
                  <span className="font-bold text-[#1C1917]">
                    {totalGroupVotes} pts
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#1C1917]">
                  {opt.title}
                </h3>
                <p className="text-xs text-[#78716C] mt-1 line-clamp-2 leading-relaxed">
                  {opt.description}
                </p>

                <div className="text-[11px] text-[#A8A29E] mt-2">
                  {opt.costEstimate}
                </div>
              </div>

              {/* Stepper */}
              <div className="mt-4 pt-3 border-t border-[#EBE7DF] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#78716C] block">My Votes</span>
                  <span className="text-xs font-bold text-[#1C1917]">
                    {myVotes} <span className="font-normal text-[#A8A29E]">({myCost} cr)</span>
                  </span>
                </div>

                {poll.status === 'active' && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => submitQuadraticVote(poll.id, opt.id, -1)}
                      disabled={myVotes <= 0}
                      aria-label={`Decrease vote for ${opt.title}`}
                      className="w-7 h-7 rounded-lg bg-white border border-[#EBE7DF] hover:bg-[#F4F1EA] hover:border-[#D6D0C5] hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 font-bold text-xs transition-all duration-150 shadow-2xs"
                    >
                      &minus;
                    </button>
                    <button
                      onClick={() => submitQuadraticVote(poll.id, opt.id, 1)}
                      disabled={remainingCredits < nextCost}
                      aria-label={`Increase vote for ${opt.title}`}
                      className="w-7 h-7 rounded-lg bg-[#D97746] hover:bg-[#C26333] hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 font-bold text-xs text-white transition-all duration-150 shadow-2xs"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="pt-2 flex items-center justify-between text-xs">
        <span className="text-[#A8A29E]">
          {Object.keys(poll.userVotes).length} of {users.length} travelers cast votes
        </span>

        {poll.status === 'active' ? (
          <button
            onClick={() => finalizePoll(poll.id)}
            className="px-4 py-2 bg-[#D97746] hover:bg-[#C26333] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Resolve with Consensus Engine</span>
          </button>
        ) : (
          <span className="font-semibold text-[#4D7C5F]">
            ✓ Decided &amp; Updated in Timeline
          </span>
        )}
      </div>
    </div>
  );
}
