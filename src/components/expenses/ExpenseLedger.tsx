'use client';

import React, { useState } from 'react';
import { useTrip } from '@/lib/state/TripContext';
import {
  Receipt,
  ArrowRight,
  Plus,
  CheckCircle2,
  X,
  Sparkles,
  Scale,
} from 'lucide-react';

export default function ExpenseLedger() {
  const {
    expenses,
    settlements,
    users,
    addExpense,
    nextPayerInfo,
    currency,
  } = useTrip();

  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState(users[0]?.id || 'rohan');
  const [category, setCategory] = useState<'dining' | 'transit' | 'hotel' | 'tickets' | 'misc'>('dining');
  const [receiptSimulated, setReceiptSimulated] = useState(false);

  const totalTripSpend = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    addExpense({
      title,
      amount: parseFloat(amount),
      currency: 'INR',
      paidByUserId: payerId,
      splitWithUserIds: users.map((u) => u.id),
      category,
      date: 'Today',
      verified: true,
    });

    setTitle('');
    setAmount('');
    setShowAddModal(false);
    setReceiptSimulated(false);
  };

  const simulateReceiptCapture = () => {
    setReceiptSimulated(true);
    setTitle('Rawat Mishtan Bhandar (Pyaz Kachori & Lassi)');
    setAmount('1850');
    setCategory('dining');
  };

  return (
    <div className="space-y-5">
      {/* Top Summary Bar */}
      <div className="bg-white border border-[#EBE7DF] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <span className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-wider">
            Total Trip Spend
          </span>
          <div className="text-xl sm:text-2xl font-bold text-[#1C1917] mt-0.5">
            ₹{totalTripSpend.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-[#78716C]">
            Split across 6 companions &bull; {settlements.length} transfers needed to settle completely
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 bg-[#D97746] hover:bg-[#C26333] text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Smart Fairness Recommender: Who Pays Next? */}
      {nextPayerInfo && (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-orange-200/80 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#D97746] bg-orange-100 px-2 py-0.5 rounded-full">
                  Fairness AI Recommendation
                </span>
                <span className="text-xs text-[#78716C]">Who Pays Next?</span>
              </div>
              <p className="text-xs font-bold text-[#1C1917] mt-0.5">
                Suggested Next Payer: <span className="text-[#D97746]">{nextPayerInfo.nextPayer?.name}</span>
                <span className="font-normal text-[#78716C] ml-1.5">
                  (Currently paid ₹{nextPayerInfo.nextPayerDeficit.toLocaleString('en-IN')} less than group median)
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setPayerId(nextPayerInfo.nextPayer.id);
              setShowAddModal(true);
            }}
            className="px-3 py-1.5 bg-white border border-orange-200 hover:border-orange-300 text-orange-700 rounded-xl text-xs font-bold shadow-2xs transition shrink-0"
          >
            Assign Next
          </button>
        </div>
      )}

      {/* Settlements Directed Transfer List */}
      <div className="bg-white border border-[#EBE7DF] rounded-2xl p-5 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-[#1C1917]">
          Simplified Debt Settlements ({settlements.length} transfers)
        </h3>

        <div className="divide-y divide-[#EBE7DF]">
          {settlements.map((s, idx) => {
            const fromUser = users.find((u) => u.id === s.fromUserId);
            const toUser = users.find((u) => u.id === s.toUserId);

            return (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <img
                    src={fromUser?.avatar}
                    alt={fromUser?.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span className="font-semibold text-[#1C1917]">{fromUser?.name.split(' ')[0]}</span>
                  <span className="text-[#A8A29E]">pays</span>
                  <span className="font-semibold text-[#1C1917]">{toUser?.name.split(' ')[0]}</span>
                  <img
                    src={toUser?.avatar}
                    alt={toUser?.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                </div>

                <div className="font-bold text-[#1C1917]">
                  ₹{s.amount.toLocaleString('en-IN')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shared Expenses Log */}
      <div className="bg-white border border-[#EBE7DF] rounded-2xl p-5 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-[#1C1917]">
          Recent Receipts ({expenses.length})
        </h3>

        <div className="divide-y divide-[#EBE7DF]">
          {expenses.map((exp) => {
            const payer = users.find((u) => u.id === exp.paidByUserId);
            return (
              <div key={exp.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-[#1C1917]">{exp.title}</div>
                  <div className="text-[10px] text-[#A8A29E]">
                    Paid by {payer?.name.split(' ')[0]} &bull; {exp.date}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-[#1C1917]">₹{exp.amount.toLocaleString('en-IN')}</div>
                  <div className="text-[10px] text-[#4D7C5F]">Split 6 ways</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-[#EBE7DF] relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-[#A8A29E] hover:text-[#1C1917]"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-[#1C1917] mb-1">
              Add Expense
            </h3>

            <button
              type="button"
              onClick={simulateReceiptCapture}
              className="w-full my-3 bg-[#F4F1EA] text-[#D97746] p-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Receipt className="w-3.5 h-3.5" />
              {receiptSimulated ? '✓ Scanned: Rawat Mishtan' : 'Simulate Camera Receipt Scan'}
            </button>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-[#78716C] block mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Amber Fort entry passes"
                  className="w-full text-xs p-2 border border-[#EBE7DF] rounded-lg focus:outline-none focus:border-[#D97746]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#78716C] block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 3600"
                  className="w-full text-xs p-2 border border-[#EBE7DF] rounded-lg focus:outline-none focus:border-[#D97746]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-[#78716C] block mb-1">Paid By</label>
                  <select
                    value={payerId}
                    onChange={(e) => setPayerId(e.target.value)}
                    className="w-full text-xs p-2 border border-[#EBE7DF] rounded-lg"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name.split(' ')[0]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#78716C] block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full text-xs p-2 border border-[#EBE7DF] rounded-lg"
                  >
                    <option value="dining">Dining</option>
                    <option value="transit">Transit</option>
                    <option value="hotel">Hotel</option>
                    <option value="tickets">Tickets</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 bg-[#D97746] hover:bg-[#C26333] text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Save &amp; Recalculate
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
