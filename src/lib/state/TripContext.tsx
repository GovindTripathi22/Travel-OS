'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  User,
  ItineraryItem,
  MechanismPoll,
  Expense,
  Settlement,
  TravelStatus,
  DocumentItem,
  PhotoMemory,
  ConflictAlert,
  JarvisActionResult,
} from '@/types';
import {
  INITIAL_USERS,
  INITIAL_ITINERARY,
  INITIAL_POLLS,
  INITIAL_EXPENSES,
  INITIAL_TRAVEL_STATUS,
  INITIAL_DOCUMENTS,
  INITIAL_MEMORIES,
} from './mockData';
import { calculateNetBalances, minimizeDebts } from '../algorithms/debtMinimizer';
import { detectTripConflicts } from '../algorithms/conflictDetector';
import { resolveQuadraticPoll, resolveBordaCountPoll } from '../algorithms/mechanismVoting';
import { processJarvisVoiceCommand, JarvisContext } from '../agents/jarvisBrain';
import { useAuth } from '../auth/AuthContext';

interface TripContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  itinerary: ItineraryItem[];
  polls: MechanismPoll[];
  expenses: Expense[];
  settlements: Settlement[];
  netBalances: Record<string, number>;
  travelStatus: Record<string, TravelStatus>;
  documents: DocumentItem[];
  memories: PhotoMemory[];
  conflicts: ConflictAlert[];
  viewMode: 'full' | 'phone_preview';
  setViewMode: (m: 'full' | 'phone_preview') => void;
  isAssistantOpen: boolean;
  setIsAssistantOpen: (open: boolean) => void;
  isSpeaking: boolean;
  speakText: (text: string) => void;
  stopSpeaking: () => void;
  isJarvisOpen: boolean;
  setIsJarvisOpen: (open: boolean) => void;
  isSosModalOpen: boolean;
  setIsSosModalOpen: (open: boolean) => void;
  lastJarvisResult: JarvisActionResult | null;
  executeJarvisCommand: (command: string) => JarvisActionResult;
  resolveConflict: (conflictId: string) => void;
  submitQuadraticVote: (pollId: string, optionId: string, delta: number) => boolean;
  finalizePoll: (pollId: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateTravelStatus: (userId: string, step: TravelStatus['currentStep'], text: string) => void;
  updateWellbeing: (userId: string, battery: number) => void;
  activeTab: 'timeline' | 'decisions' | 'expenses' | 'vault';
  setActiveTab: (tab: 'timeline' | 'decisions' | 'expenses' | 'vault') => void;
  vaultSubTab: 'passes' | 'rendezvous' | 'alignment' | 'photos';
  setVaultSubTab: (sub: 'passes' | 'rendezvous' | 'alignment' | 'photos') => void;
  voiceTriggerCount: number;
  triggerJarvisVoice: () => void;
  addItineraryRestBuffer: (afterEventId: string, minutes: number) => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export function TripProvider({ children }: { children: React.ReactNode }) {
  const { switchQuickCompanion } = useAuth();
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]); // Rohan by default
  const [itinerary, setItinerary] = useState<ItineraryItem[]>(INITIAL_ITINERARY);
  const [polls, setPolls] = useState<MechanismPoll[]>(INITIAL_POLLS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [travelStatus, setTravelStatus] = useState<Record<string, TravelStatus>>(INITIAL_TRAVEL_STATUS);
  const [documents] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [memories, setMemories] = useState<PhotoMemory[]>(INITIAL_MEMORIES);
  const [resolvedConflictIds, setResolvedConflictIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'full' | 'phone_preview'>('full');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isJarvisOpen, setIsJarvisOpen] = useState(false);
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [lastJarvisResult, setLastJarvisResult] = useState<JarvisActionResult | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'decisions' | 'expenses' | 'vault'>('timeline');
  const [vaultSubTab, setVaultSubTab] = useState<'passes' | 'rendezvous' | 'alignment' | 'photos'>('passes');
  const [voiceTriggerCount, setVoiceTriggerCount] = useState(0);

  const triggerJarvisVoice = () => {
    setVoiceTriggerCount((prev) => prev + 1);
  };

  // Synchronize current user with updated users list (e.g. voice credits or battery)
  useEffect(() => {
    const fresh = users.find((u) => u.id === currentUser.id);
    if (fresh) setCurrentUser(fresh);
  }, [users]);

  // Compute Conflicts
  const rawConflicts = useMemo(() => {
    return detectTripConflicts(itinerary, users);
  }, [itinerary, users]);

  const conflicts = useMemo(() => {
    return rawConflicts.map((c) => ({
      ...c,
      resolved: resolvedConflictIds.has(c.id),
    }));
  }, [rawConflicts, resolvedConflictIds]);

  // Compute Balances and Minimized Settlements
  const netBalances = useMemo(() => {
    return calculateNetBalances(expenses, users);
  }, [expenses, users]);

  const settlements = useMemo(() => {
    return minimizeDebts(netBalances, 'INR');
  }, [netBalances]);

  // Speech synthesis for voice briefing with Chrome keep-alive heartbeat
  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = currentUser.personaType === 'elderly' ? 0.9 : 1.0;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Natural') ||
            v.name.includes('Google') ||
            v.name.includes('Samantha') ||
            v.name.includes('India') ||
            v.name.includes('UK'))
      ) || voices[0];
      if (preferred) utterance.voice = preferred;

      let keepAliveInterval: any;
      utterance.onstart = () => {
        setIsSpeaking(true);
        keepAliveInterval = setInterval(() => {
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          }
        }, 8000);
      };

      const cleanup = () => {
        clearInterval(keepAliveInterval);
        setIsSpeaking(false);
      };

      utterance.onend = cleanup;
      utterance.onerror = cleanup;
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), 2500);
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Resolve Conflict Handler
  const resolveConflict = (conflictId: string) => {
    setResolvedConflictIds((prev) => new Set([...Array.from(prev), conflictId]));

    const conflict = conflicts.find((c) => c.id === conflictId);
    if (!conflict) return;

    // Apply concrete changes to itinerary if action specified
    if (conflict.suggestedAction.resolutionType === 'swap_venue' && conflict.suggestedAction.replacementTitle) {
      setItinerary((prev) =>
        prev.map((item) =>
          item.id === conflict.eventId
            ? {
                ...item,
                title: conflict.suggestedAction.replacementTitle!,
                description: 'Pre-vetted restaurant with certified Jain, vegetarian, and low-sodium kitchen.',
                dietaryTags: ['Jain', 'Vegetarian', 'Low-Sodium Vegetarian'],
                conflictWarning: undefined,
              }
            : item
        )
      );
    } else if (conflict.suggestedAction.resolutionType === 'book_assistance') {
      setItinerary((prev) =>
        prev.map((item) =>
          item.id === conflict.eventId
            ? {
                ...item,
                description: `${item.description} [✓ Electric Golf Cart & Wheelchair Ramp Confirmed for Dadaji]`,
                walkingDistanceMeters: 50,
                stairsCount: 0,
              }
            : item
        )
      );
    }
  };

  // Quadratic Vote Submitter
  const submitQuadraticVote = (pollId: string, optionId: string, delta: number): boolean => {
    const poll = polls.find((p) => p.id === pollId);
    if (!poll || poll.status !== 'active') return false;

    const currentVotesMap = { ...(poll.userVotes[currentUser.id] || {}) };
    const currentOptionVotes = currentVotesMap[optionId] || 0;
    const targetVotes = Math.max(0, currentOptionVotes + delta);

    // Calculate total credits spent across all options with the new target
    let newSpentCredits = 0;
    for (const [optId, v] of Object.entries(currentVotesMap)) {
      if (optId === optionId) {
        newSpentCredits += targetVotes * targetVotes;
      } else {
        const votes = v as number;
        newSpentCredits += votes * votes;
      }
    }
    if (!(optionId in currentVotesMap)) {
      newSpentCredits += targetVotes * targetVotes;
    }

    const availableBudget = 100;
    if (newSpentCredits > availableBudget) {
      return false; // exceeds budget
    }

    currentVotesMap[optionId] = targetVotes;

    setPolls((prev) =>
      prev.map((p) =>
        p.id === pollId
          ? {
              ...p,
              userVotes: {
                ...p.userVotes,
                [currentUser.id]: currentVotesMap,
              },
            }
          : p
      )
    );

    // Update remaining voice credits for currentUser
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id
          ? { ...u, voiceCredits: Math.max(0, availableBudget - newSpentCredits) }
          : u
      )
    );

    return true;
  };

  // Finalize Poll using Mechanism Resolution
  const finalizePoll = (pollId: string) => {
    const poll = polls.find((p) => p.id === pollId);
    if (!poll) return;

    let res;
    if (poll.mechanismType === 'quadratic') {
      res = resolveQuadraticPoll(poll);
    } else {
      res = resolveBordaCountPoll(poll);
    }

    setPolls((prev) =>
      prev.map((p) =>
        p.id === pollId
          ? {
              ...p,
              status: 'resolved',
              winningOptionId: res.winner.id,
              consensusExplanation: res.explanation,
            }
          : p
      )
    );

    // Update itinerary item with the consensus winner
    setItinerary((prev) =>
      prev.map((item) =>
        item.status === 'pending_vote'
          ? {
              ...item,
              title: res.winner.title,
              description: `${res.winner.description} [Selected by Group Mechanism]`,
              location: res.winner.location,
              status: 'confirmed',
            }
          : item
      )
    );
  };

  // Add Expense
  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExp: Expense = {
      ...expense,
      id: `exp-${Date.now()}`,
    };
    setExpenses((prev) => [newExp, ...prev]);
  };

  // Update Travel Status
  const updateTravelStatus = (userId: string, step: TravelStatus['currentStep'], text: string) => {
    setTravelStatus((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        currentStep: step,
        statusText: text,
        lastUpdated: 'Just now',
      },
    }));
  };

  // Update Wellbeing Battery
  const updateWellbeing = (userId: string, battery: number) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, batteryLevel: battery } : u))
    );
  };

  // Insert Rest Buffer into Itinerary
  const addItineraryRestBuffer = (afterEventId: string, minutes: number) => {
    const idx = itinerary.findIndex((item) => item.id === afterEventId);
    if (idx === -1) return;

    const bufferItem: ItineraryItem = {
      id: `rest-${Date.now()}`,
      day: itinerary[idx].day,
      date: itinerary[idx].date,
      time: '15:00',
      title: `Chai & Recharge Rest Buffer (${minutes} mins)`,
      description: 'Scheduled low-stimulation downtime requested via wellbeing check-in. Shaded seating and herbal hydration.',
      category: 'rest',
      location: 'Hotel Verandah / Garden Pavilion',
      walkingDistanceMeters: 0,
      stairsCount: 0,
      status: 'confirmed',
    };

    const newItin = [...itinerary];
    newItin.splice(idx + 1, 0, bufferItem);
    setItinerary(newItin);
  };

  // Execute In-House JARVIS Command (Offline Brain + State Mutation)
  const executeJarvisCommand = (command: string): JarvisActionResult => {
    const jarvisCtx: JarvisContext = {
      currentUser,
      users,
      itinerary,
      polls,
      expenses,
      travelStatus,
      documents,
      conflicts,
    };

    const res = processJarvisVoiceCommand(command, jarvisCtx);
    setLastJarvisResult(res);

    // Apply concrete real-world mutations:
    if (res.actionExecuted === 'MUTATE_EXPENSE_STORE' && res.cardData) {
      addExpense({
        title: res.cardData.title,
        amount: res.cardData.amount,
        currency: 'INR',
        paidByUserId: res.cardData.paidByUserId,
        splitWithUserIds: users.map((u) => u.id),
        category: res.cardData.category,
        date: 'Today',
        verified: true,
      });
    } else if (res.actionExecuted === 'INJECT_REST_TIMELINE') {
      const targetId = itinerary[0]?.id || 'itin-1';
      addItineraryRestBuffer(targetId, 30);
    } else if (res.actionExecuted === 'SUBMIT_QUADRATIC_VOTE') {
      const activePoll = polls.find((p) => p.status === 'active') || polls[0];
      if (activePoll) {
        submitQuadraticVote(activePoll.id, activePoll.options[0].id, 4);
      }
    } else if (res.actionExecuted === 'CHANGE_ACTIVE_USER' && res.cardData?.userId) {
      const target = users.find((u) => u.id === res.cardData.userId);
      if (target) {
        setCurrentUser(target);
        try {
          switchQuickCompanion(target.id);
        } catch {}
      }
    } else if (res.actionExecuted === 'RESOLVE_CONFLICT_ITEM' && res.cardData?.conflictId) {
      resolveConflict(res.cardData.conflictId);
    } else if (res.actionExecuted === 'DISPLAY_OFFLINE_SOS') {
      setIsSosModalOpen(true);
    } else if (res.actionExecuted === 'VIEW_MODE_MOBILE') {
      setViewMode('phone_preview');
    } else if (res.actionExecuted === 'VIEW_MODE_FULL') {
      setViewMode('full');
    } else if (res.actionExecuted === 'OPEN_ASSISTANT_DRAWER') {
      setIsAssistantOpen(true);
    } else if (res.actionExecuted === 'RESOLVE_ACTIVE_POLL') {
      const activePoll = polls.find((p) => p.status === 'active') || polls[0];
      if (activePoll) finalizePoll(activePoll.id);
    } else if (res.actionExecuted === 'UPDATE_TRAVEL_STATUS' && res.cardData) {
      updateTravelStatus(currentUser.id, res.cardData.step, res.cardData.text);
    }

    // Apply autonomous tab & sub-tab navigation
    if (res.navigation?.tab) {
      setActiveTab(res.navigation.tab);
    }
    if (res.navigation?.subTab) {
      setVaultSubTab(res.navigation.subTab);
    }

    // Speak aloud response
    speakText(res.spokenResponse);

    return res;
  };

  return (
    <TripContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        itinerary,
        polls,
        expenses,
        settlements,
        netBalances,
        travelStatus,
        documents,
        memories,
        conflicts,
        viewMode,
        setViewMode,
        isAssistantOpen,
        setIsAssistantOpen,
        isSpeaking,
        speakText,
        stopSpeaking,
        isJarvisOpen,
        setIsJarvisOpen,
        isSosModalOpen,
        setIsSosModalOpen,
        lastJarvisResult,
        executeJarvisCommand,
        resolveConflict,
        submitQuadraticVote,
        finalizePoll,
        addExpense,
        updateTravelStatus,
        updateWellbeing,
        addItineraryRestBuffer,
        activeTab,
        setActiveTab,
        vaultSubTab,
        setVaultSubTab,
        voiceTriggerCount,
        triggerJarvisVoice,
      }}
    >
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrip must be used within a TripProvider');
  }
  return context;
}
