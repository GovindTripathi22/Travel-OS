'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  X,
  Lock,
  Mail,
  User,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { UserRole, PersonaType } from '@/types';
import { createSvgAvatar } from '@/lib/state/mockData';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    switchQuickCompanion,
    activeProfile,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('companion');
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>('standard');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, displayName, selectedRole, selectedPersona);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMsg(err.message || 'Google sign-in was canceled.');
    } finally {
      setLoading(false);
    }
  };

  const QUICK_PROFILES = [
    {
      id: 'rohan',
      name: 'Rohan Sharma',
      badge: 'Trip Planner · Admin',
      role: 'Full super-agent privileges, budget approvals, conflict manager',
      avatar: createSvgAvatar('RS', '#ea580c', '#c2410c'),
      color: 'border-orange-500/40 bg-orange-500/5',
    },
    {
      id: 'dadaji',
      name: 'Dada-ji (Ramesh)',
      badge: 'Elderly Mode (72y)',
      role: 'High-contrast large text, personal BP medication, zero-stair routes',
      avatar: createSvgAvatar('DS', '#059669', '#047857'),
      color: 'border-amber-500/40 bg-amber-500/5',
    },
    {
      id: 'priya',
      name: 'Priya Patel',
      badge: 'Dietary Companion',
      role: 'Strict Jain dietary boundary enforcement & private health vault',
      avatar: createSvgAvatar('PS', '#7c3aed', '#6d28d9'),
      color: 'border-emerald-500/40 bg-emerald-500/5',
    },
    {
      id: 'kabir',
      name: 'Kabir Sharma',
      badge: 'Kid Mode (9y)',
      role: 'Gamified explorer quests, elephant badges & ice cream countdown',
      avatar: createSvgAvatar('KB', '#0284c7', '#0369a1'),
      color: 'border-indigo-500/40 bg-indigo-500/5',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#EBE7DF] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#EBE7DF] bg-[#FAF9F6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D97746] flex items-center justify-center text-white shadow-2xs font-extrabold text-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#1C1917]">
                Sahyatri Authentication
              </h3>
              <p className="text-xs text-[#78716C]">
                Firebase Identity &bull; Role-Based Privacy Safeguards
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1C1917] hover:bg-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Segmented Auth Mode Switch */}
          <div className="flex items-center p-1 bg-[#F4F1EA] rounded-2xl border border-[#EBE7DF]">
            <button
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                mode === 'signin'
                  ? 'bg-white text-[#1C1917] shadow-2xs'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                mode === 'signup'
                  ? 'bg-white text-[#1C1917] shadow-2xs'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#A8A29E] absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Ramesh Sharma"
                    className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#A8A29E] absolute left-3 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="traveler@example.com"
                  className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A8A29E] absolute left-3 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full text-xs sm:text-sm pl-9 pr-10 py-2.5 bg-white border border-[#EBE7DF] rounded-xl focus:border-[#D97746] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#A8A29E] hover:text-[#1C1917]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div className="space-y-2 pt-1">
                <label className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider">
                  Select Travel Persona Mode
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('planner');
                      setSelectedPersona('standard');
                    }}
                    className={`p-2.5 rounded-xl border text-center transition font-semibold ${
                      selectedRole === 'planner'
                        ? 'border-[#D97746] bg-[#D97746]/10 text-[#D97746]'
                        : 'border-[#EBE7DF] text-[#78716C]'
                    }`}
                  >
                    Trip Planner
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('companion');
                      setSelectedPersona('elderly');
                    }}
                    className={`p-2.5 rounded-xl border text-center transition font-semibold ${
                      selectedPersona === 'elderly'
                        ? 'border-[#D97746] bg-[#D97746]/10 text-[#D97746]'
                        : 'border-[#EBE7DF] text-[#78716C]'
                    }`}
                  >
                    Senior / Elderly
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('companion');
                      setSelectedPersona('kid');
                    }}
                    className={`p-2.5 rounded-xl border text-center transition font-semibold ${
                      selectedPersona === 'kid'
                        ? 'border-[#D97746] bg-[#D97746]/10 text-[#D97746]'
                        : 'border-[#EBE7DF] text-[#78716C]'
                    }`}
                  >
                    Explorer Kid
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#D97746] hover:bg-[#C26333] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition active:scale-95 disabled:opacity-50"
            >
              {loading
                ? 'Authenticating...'
                : mode === 'signin'
                ? 'Sign In with Firebase'
                : 'Create Account & Join Trip'}
            </button>
          </form>

          {/* Google Sign In Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-[#EBE7DF] w-full" />
            <span className="bg-white px-3 text-[10px] uppercase font-bold text-[#A8A29E] absolute">
              Or Connect With
            </span>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-white hover:bg-[#FAF9F6] border border-[#EBE7DF] rounded-xl text-xs font-bold text-[#1C1917] flex items-center justify-center gap-2.5 transition active:scale-95 shadow-2xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Quick Companion Switcher for Evaluators & Demos */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
                Instant Companion Switcher (For Demos &amp; Testing)
              </span>
              <span className="text-[10px] text-[#A8A29E]">1-Click Access</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {QUICK_PROFILES.map((p) => {
                const isCurrent = activeProfile.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      switchQuickCompanion(p.id);
                      setIsAuthModalOpen(false);
                    }}
                    className={`flex items-start gap-2.5 p-2.5 rounded-2xl border text-left transition ${
                      isCurrent
                        ? 'border-[#D97746] bg-[#FAF5EE] ring-1 ring-[#D97746]'
                        : `${p.color} hover:border-[#D97746]/60`
                    }`}
                  >
                    <img
                      src={p.avatar}
                      alt={p.name}
                      className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5 border border-[#EBE7DF]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1C1917] truncate">
                          {p.name}
                        </span>
                        {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-[#D97746]" />}
                      </div>
                      <div className="text-[10px] font-semibold text-[#D97746]">
                        {p.badge}
                      </div>
                      <div className="text-[10px] text-[#78716C] leading-tight truncate mt-0.5">
                        {p.role}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-[#FAF9F6] border-t border-[#EBE7DF] text-center text-[11px] text-[#A8A29E]">
          Protected with End-to-End Privacy &bull; Granular RBAC Permissions
        </div>
      </div>
    </div>
  );
}
