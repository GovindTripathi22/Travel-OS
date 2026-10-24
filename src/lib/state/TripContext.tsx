'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
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
  TripInfo,
} from '@/types';
import {
  INITIAL_USERS,
  INITIAL_ITINERARY,
  INITIAL_POLLS,
  INITIAL_EXPENSES,
  INITIAL_TRAVEL_STATUS,
  INITIAL_DOCUMENTS,
  INITIAL_MEMORIES,
  INITIAL_PACKING,
  LOCAL_PHRASES,
  DEFAULT_DEMO_TRIP,
  createSvgAvatar,
} from './mockData';

import { calculateNetBalances, minimizeDebts, recommendNextPayer } from '../algorithms/debtMinimizer';
import { detectTripConflicts, detectWeatherAndTemporalConflicts, toMinutes, fromMinutes } from '../algorithms/conflictDetector';
import { resolveQuadraticPoll, resolveBordaCountPoll } from '../algorithms/mechanismVoting';
import { processJarvisVoiceCommand, JarvisContext } from '../agents/jarvisBrain';
import { runEdgeSlmNlu } from '../slm/edgeSlmEngine';
import {
  speakWithJarvisVoice,
  stopJarvisSpeech,
  onJarvisSpeechStateChange,
  playJarvisSound,
} from '../audio/jarvisAudio';
import { useAuth } from '../auth/AuthContext';

interface TripContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  tripInfo: TripInfo;
  setTripInfo: (info: TripInfo) => void;
  isDemoTrip: boolean;
  loadDemoTrip: () => void;
  createCustomTrip: (info: {
    title: string;
    destination: string;
    dates: string;
    companions?: Array<Partial<User>>;
  }) => void;
  addCompanion: (companion: Omit<User, 'id'> | User) => void;
  addPoll: (poll: MechanismPoll) => void;
  addDocument: (doc: DocumentItem) => void;
  isSetupModalOpen: boolean;
  setIsSetupModalOpen: (open: boolean) => void;
  isAddCompanionOpen: boolean;
  setIsAddCompanionOpen: (open: boolean) => void;
  isAddStopOpen: boolean;
  setIsAddStopOpen: (open: boolean) => void;
  isAddPollOpen: boolean;
  setIsAddPollOpen: (open: boolean) => void;
  isUploadDocOpen: boolean;
  setIsUploadDocOpen: (open: boolean) => void;
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
  isJarvisSpeaking: boolean;
  speakText: (text: string) => void;
  stopSpeaking: () => void;
  stopJarvisVoiceNow: () => void;
  isJarvisOpen: boolean;
  setIsJarvisOpen: (open: boolean) => void;
  isSosModalOpen: boolean;
  setIsSosModalOpen: (open: boolean) => void;
  lastJarvisResult: JarvisActionResult | null;
  executeJarvisCommand: (command: string) => JarvisActionResult;
  executeAutonomousJarvis: (command: string) => JarvisActionResult;
  resolveConflict: (conflictId: string) => void;
  submitQuadraticVote: (pollId: string, optionId: string, delta: number) => boolean;
  finalizePoll: (pollId: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateTravelStatus: (userId: string, step: TravelStatus['currentStep'], text: string) => void;
  updateWellbeing: (userId: string, battery: number) => void;
  weather: 'Sunny' | 'Rainy';
  toggleWeather: () => void;
  currency: 'INR' | 'USD' | 'EUR' | 'JPY';
  setCurrency: (c: 'INR' | 'USD' | 'EUR' | 'JPY') => void;
  packingList: import('@/types').PackingItem[];
  togglePackingItem: (id: string) => void;
  autoHealSchedule: (dayTarget?: number) => void;
  adaptWeatherIndoor: (dayTarget?: number) => void;
  toggleKidQuest: (stopId: string) => void;
  nextPayerInfo: { nextPayer: User; nextPayerDeficit: number };
  activeTab: 'timeline' | 'decisions' | 'expenses' | 'vault';
  setActiveTab: (tab: 'timeline' | 'decisions' | 'expenses' | 'vault') => void;
  vaultSubTab: 'passes' | 'rendezvous' | 'alignment' | 'photos';
  setVaultSubTab: (sub: 'passes' | 'rendezvous' | 'alignment' | 'photos') => void;
  voiceTriggerCount: number;
  triggerJarvisVoice: () => void;
  addItineraryRestBuffer: (afterEventId: string, minutes: number) => void;
  jarvisControlMode: import('@/types').JarvisControlMode;
  setJarvisControlMode: (mode: import('@/types').JarvisControlMode) => void;
  jarvisVoiceState: import('@/types').JarvisVoiceState;
  setJarvisVoiceState: (state: import('@/types').JarvisVoiceState) => void;
  isHUDModalOpen: boolean;
  setIsHUDModalOpen: (open: boolean) => void;
  resolveAllConflicts: () => void;
  settleAllDebts: () => void;
  resolvePollAndCommit: (pollId: string) => void;
  addItineraryItem: (item: any) => void;
  updateCurrentUser: (patch: Partial<User>) => void;
  personaMode: import('@/types').PersonaMode;
  setPersonaMode: (mode: import('@/types').PersonaMode) => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export function TripProvider({ children }: { children: React.ReactNode }) {
  const { user, activeProfile, switchQuickCompanion } = useAuth();

  const [tripInfo, setTripInfo] = useState<TripInfo>(DEFAULT_DEMO_TRIP);
  const [isDemoTrip, setIsDemoTrip] = useState(true);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isAddCompanionOpen, setIsAddCompanionOpen] = useState(false);
  const [isAddStopOpen, setIsAddStopOpen] = useState(false);
  const [isAddPollOpen, setIsAddPollOpen] = useState(false);
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);

  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]); // Rohan by default
  const [itinerary, setItinerary] = useState<ItineraryItem[]>(INITIAL_ITINERARY);
  const [polls, setPolls] = useState<MechanismPoll[]>(INITIAL_POLLS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [travelStatus, setTravelStatus] = useState<Record<string, TravelStatus>>(INITIAL_TRAVEL_STATUS);
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [memories, setMemories] = useState<PhotoMemory[]>(INITIAL_MEMORIES);
  const [resolvedConflictIds, setResolvedConflictIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'full' | 'phone_preview'>('full');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isJarvisOpen, setIsJarvisOpen] = useState(false);
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [lastJarvisResult, setLastJarvisResult] = useState<JarvisActionResult | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'decisions' | 'expenses' | 'vault'>('timeline');
  const [weather, setWeather] = useState<'Sunny' | 'Rainy'>('Sunny');
  const [currency, setCurrency] = useState<'INR' | 'USD' | 'EUR' | 'JPY'>('INR');
  const [packingList, setPackingList] = useState<import('@/types').PackingItem[]>(INITIAL_PACKING);
  const [vaultSubTab, setVaultSubTab] = useState<'passes' | 'rendezvous' | 'alignment' | 'photos'>('passes');
  const [voiceTriggerCount, setVoiceTriggerCount] = useState(0);
  const [jarvisControlMode, setJarvisControlMode] = useState<import('@/types').JarvisControlMode>('autonomous');
  const [jarvisVoiceState, setJarvisVoiceState] = useState<import('@/types').JarvisVoiceState>('idle');
  const [isHUDModalOpen, setIsHUDModalOpen] = useState(false);
  const [stateHydrated, setStateHydrated] = useState(false);

  const prevUserIdRef = useRef<string | null>(null);

  // Helper to load Rajasthan Demo Trip
  const applyDemoTripState = (data?: any) => {
    if (data) {
      if (Array.isArray(data.users)) setUsers(data.users);
      else setUsers(INITIAL_USERS);
      if (Array.isArray(data.itinerary)) setItinerary(data.itinerary);
      else setItinerary(INITIAL_ITINERARY);
      if (Array.isArray(data.polls)) setPolls(data.polls);
      else setPolls(INITIAL_POLLS);
      if (Array.isArray(data.expenses)) setExpenses(data.expenses);
      else setExpenses(INITIAL_EXPENSES);
      if (data.travelStatus && typeof data.travelStatus === 'object') setTravelStatus(data.travelStatus);
      else setTravelStatus(INITIAL_TRAVEL_STATUS);
      if (Array.isArray(data.documents)) setDocuments(data.documents);
      else setDocuments(INITIAL_DOCUMENTS);
      if (Array.isArray(data.memories)) setMemories(data.memories);
      else setMemories(INITIAL_MEMORIES);
      if (Array.isArray(data.packingList)) setPackingList(data.packingList);
      else setPackingList(INITIAL_PACKING);
      if (data.weather === 'Sunny' || data.weather === 'Rainy') setWeather(data.weather);
      if (['INR', 'USD', 'EUR', 'JPY'].includes(data.currency)) setCurrency(data.currency);
      if (Array.isArray(data.resolvedConflictIds)) setResolvedConflictIds(new Set(data.resolvedConflictIds));
      if (data.tripInfo) setTripInfo(data.tripInfo);
      else setTripInfo(DEFAULT_DEMO_TRIP);
    } else {
      setUsers(INITIAL_USERS);
      setItinerary(INITIAL_ITINERARY);
      setPolls(INITIAL_POLLS);
      setExpenses(INITIAL_EXPENSES);
      setDocuments(INITIAL_DOCUMENTS);
      setMemories(INITIAL_MEMORIES);
      setTravelStatus(INITIAL_TRAVEL_STATUS);
      setPackingList(INITIAL_PACKING);
      setWeather('Sunny');
      setCurrency('INR');
      setTripInfo(DEFAULT_DEMO_TRIP);
    }
    setIsDemoTrip(true);
  };

  // Helper to initialize clean fresh user trip with ZERO mock travelers
  const applyCleanTripState = (traveler: User, openSetup = true) => {
    setUsers([traveler]);
    setCurrentUser(traveler);
    setItinerary([]);
    setPolls([]);
    setExpenses([]);
    setDocuments([]);
    setMemories([]);
    setPackingList([]);
    setTravelStatus({
      [traveler.id]: {
        userId: traveler.id,
        statusText: 'Trip Leader',
        currentStep: 'booked',
        lastUpdated: 'Just now',
      },
    });
    const newTripInfo: TripInfo = {
      id: `trip-${traveler.id}`,
      title: `${traveler.name.split(' ')[0]}'s Journey`,
      destination: '',
      dates: '',
      totalDays: 3,
      currentDay: 1,
      isDemo: false,
    };
    setTripInfo(newTripInfo);
    setIsDemoTrip(false);
    if (openSetup) {
      setIsSetupModalOpen(true);
    }

    try {
      localStorage.setItem(`sahyatri_user_trip_${traveler.id}`, JSON.stringify({
        tripInfo: newTripInfo,
        users: [traveler],
        itinerary: [],
        polls: [],
        expenses: [],
        documents: [],
        memories: [],
        travelStatus: {
          [traveler.id]: {
            userId: traveler.id,
            statusText: 'Trip Leader',
            currentStep: 'booked',
            lastUpdated: 'Just now',
          },
        },
        weather: 'Sunny',
        currency: 'INR',
      }));
    } catch {}
  };

  // Unified Session & State Hydration / Synchronization
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentUid = user?.uid || null;
    if (currentUid === prevUserIdRef.current && stateHydrated) return;
    prevUserIdRef.current = currentUid;

    const isMockUser = user ? INITIAL_USERS.some((u) => u.id === user.uid) : false;

    // Case 1: Unauthenticated Guest or Sign-Out
    if (!user) {
      try {
        const savedDemo = localStorage.getItem('sahyatri_trip_state_v1');
        if (savedDemo) {
          applyDemoTripState(JSON.parse(savedDemo));
        } else {
          applyDemoTripState();
        }
      } catch {
        applyDemoTripState();
      }
      setCurrentUser(INITIAL_USERS[0]);
      setStateHydrated(true);
      return;
    }

    // Case 2: Signed in as a Demo Companion (Rohan, Dadaji, Priya, Kabir, etc.)
    if (isMockUser) {
      try {
        const savedDemo = localStorage.getItem('sahyatri_trip_state_v1');
        if (savedDemo) {
          applyDemoTripState(JSON.parse(savedDemo));
        } else {
          applyDemoTripState();
        }
      } catch {
        applyDemoTripState();
      }
      const matched = INITIAL_USERS.find((u) => u.id === user.uid) || INITIAL_USERS[0];
      setCurrentUser(matched);
      setStateHydrated(true);
      return;
    }

    // Case 3: Real Authenticated Custom User
    const savedCustomTrip = localStorage.getItem(`sahyatri_user_trip_${user.uid}`);
    if (savedCustomTrip) {
      try {
        const parsed = JSON.parse(savedCustomTrip);
        if (parsed.tripInfo) setTripInfo(parsed.tripInfo);
        if (Array.isArray(parsed.users) && parsed.users.length > 0) {
          setUsers(parsed.users);
          setCurrentUser(parsed.users[0]);
        } else {
          const fallbackUser: User = {
            id: user.uid,
            name: user.displayName || 'Trip Leader',
            role: user.role || 'planner',
            personaType: user.personaType || 'standard',
            relationship: 'Trip Leader',
            age: 28,
            avatar: user.photoURL || createSvgAvatar((user.displayName || 'TR').slice(0, 2).toUpperCase(), '#0284c7', '#1d4ed8'),
            phone: '+91 98000 00000',
            batteryLevel: 90,
            voiceCredits: 100,
            preferences: {
              dietary: ['Vegetarian'],
              medical: [],
              mobility: { maxWalkingMeters: 2500, needsRampOrElevator: false, stairTolerance: 'normal' },
              pacePreference: 'moderate',
            },
          };
          setUsers([fallbackUser]);
          setCurrentUser(fallbackUser);
        }
        if (Array.isArray(parsed.itinerary)) setItinerary(parsed.itinerary);
        else setItinerary([]);
        if (Array.isArray(parsed.polls)) setPolls(parsed.polls);
        else setPolls([]);
        if (Array.isArray(parsed.expenses)) setExpenses(parsed.expenses);
        else setExpenses([]);
        if (Array.isArray(parsed.documents)) setDocuments(parsed.documents);
        else setDocuments([]);
        if (Array.isArray(parsed.memories)) setMemories(parsed.memories);
        else setMemories([]);
        if (parsed.travelStatus && typeof parsed.travelStatus === 'object') setTravelStatus(parsed.travelStatus);
        if (parsed.weather === 'Sunny' || parsed.weather === 'Rainy') setWeather(parsed.weather);
        if (['INR', 'USD', 'EUR', 'JPY'].includes(parsed.currency)) setCurrency(parsed.currency);
        setIsDemoTrip(false);
        setStateHydrated(true);
        return;
      } catch (e) {
        console.warn('Failed to parse custom trip', e);
      }
    }

    // Case 4: First-time sign-in or newly created account: CLEAN TRIP SETUP!
    // Absolute guarantee: 0 mock travelers (NO Rohan, Dadaji, Priya, Kabir, Vikram, Ananya)!
    const freshUser: User = {
      id: user.uid,
      name: user.displayName || 'Trip Leader',
      role: 'planner',
      personaType: user.personaType || 'standard',
      relationship: 'Trip Leader',
      age: user.personaType === 'elderly' ? 70 : user.personaType === 'kid' ? 10 : 28,
      avatar: user.photoURL || createSvgAvatar((user.displayName || 'TR').slice(0, 2).toUpperCase(), '#0284c7', '#1d4ed8'),
      phone: '+91 98000 00000',
      batteryLevel: 90,
      voiceCredits: 100,
      preferences: {
        dietary: ['Vegetarian'],
        medical: [],
        mobility: { maxWalkingMeters: 2500, needsRampOrElevator: false, stairTolerance: 'normal' },
        pacePreference: 'moderate',
      },
    };

    applyCleanTripState(freshUser, true);
    setStateHydrated(true);
  }, [user, activeProfile]);

  // Save demo trip changes (strictly isolated to demo mode!)
  useEffect(() => {
    if (!stateHydrated || !isDemoTrip) return;
    try {
      localStorage.setItem('sahyatri_trip_state_v1', JSON.stringify({
        tripInfo, users, itinerary, polls, expenses, documents, travelStatus, memories, packingList,
        weather, currency, resolvedConflictIds: [...resolvedConflictIds],
      }));
    } catch (error) {
      console.warn('[Sahyatri] Trip changes could not be saved in this browser.', error);
    }
  }, [stateHydrated, isDemoTrip, tripInfo, users, itinerary, polls, expenses, documents, travelStatus, memories, packingList, weather, currency, resolvedConflictIds]);

  // Save custom trip changes (strictly isolated to custom user!)
  useEffect(() => {
    if (!stateHydrated || isDemoTrip || !user || INITIAL_USERS.some(u => u.id === user.uid)) return;
    try {
      localStorage.setItem(`sahyatri_user_trip_${user.uid}`, JSON.stringify({
        tripInfo, users, itinerary, polls, expenses, documents, memories, travelStatus, weather, currency,
      }));
    } catch (error) {
      console.warn('[Sahyatri] Custom trip could not be saved in this browser.', error);
    }
  }, [stateHydrated, isDemoTrip, user, tripInfo, users, itinerary, polls, expenses, documents, memories, travelStatus, weather, currency]);


  const toggleWeather = () => {
    setWeather((prev) => (prev === 'Sunny' ? 'Rainy' : 'Sunny'));
  };

  const togglePackingItem = (id: string) => {
    setPackingList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const toggleKidQuest = (stopId: string) => {
    setItinerary((prev) =>
      prev.map((item) =>
        item.id === stopId ? { ...item, kidQuestCompleted: !item.kidQuestCompleted } : item
      )
    );
  };

  // Weather Adaptation: Swaps outdoor stops to verified indoor fallbacks
  const adaptWeatherIndoor = (dayTarget?: number) => {
    setItinerary((prev) =>
      prev.map((item) => {
        if ((!dayTarget || item.day === dayTarget) && item.isOutdoor && item.indoorFallback) {
          return {
            ...item,
            title: item.indoorFallback,
            description: `${item.description} [Weather Adaptation: Swapped for indoor shelter during rain]`,
            isOutdoor: false,
          };
        }
        return item;
      })
    );
  };

  // 1-Click Auto-Heal: Resolves temporal overlaps and adds 15m safety buffers between consecutive stops
  const autoHealSchedule = (dayTarget?: number) => {
    setItinerary((prev) => {
      const days = Array.from(new Set(prev.map((i) => i.day)));
      let updated = [...prev];

      days.forEach((day) => {
        if (dayTarget && day !== dayTarget) return;

        const dayStops = updated
          .filter((i) => i.day === day)
          .sort((a, b) => toMinutes(a.time) - toMinutes(b.time));

        let currentCursor = toMinutes(dayStops[0]?.time || '09:00');

        dayStops.forEach((stop) => {
          const startM = Math.max(toMinutes(stop.time), currentCursor);
          const stopEnd = stop.endTime ? toMinutes(stop.endTime) : startM + 90;
          const duration = Math.max(45, stopEnd - toMinutes(stop.time));
          const healedEnd = startM + duration;

          updated = updated.map((i) =>
            i.id === stop.id
              ? {
                  ...i,
                  time: fromMinutes(startM),
                  endTime: fromMinutes(healedEnd),
                }
              : i
          );

          currentCursor = healedEnd + 15; // 15-minute buffer
        });
      });

      return updated;
    });
  };

  const triggerJarvisVoice = () => {
    setVoiceTriggerCount((prev) => prev + 1);
  };

  // Synchronize current user with updated users list (e.g. voice credits or battery)
  useEffect(() => {
    const fresh = users.find((u) => u.id === currentUser.id);
    if (fresh) setCurrentUser(fresh);
  }, [users]);

  // Connect speech state listener
  useEffect(() => {
    onJarvisSpeechStateChange((speaking) => {
      setIsSpeaking(speaking);
    });
    return () => {
      stopJarvisSpeech();
    };
  }, []);

  // Compute Conflicts (User constraints + Weather / Temporal overlaps)
  const rawConflicts = useMemo(() => {
    const userAlerts = detectTripConflicts(itinerary, users);
    const weatherTemporalAlerts = detectWeatherAndTemporalConflicts(itinerary, weather);
    return [...userAlerts, ...weatherTemporalAlerts];
  }, [itinerary, users, weather]);

  const conflicts = useMemo(() => {
    return rawConflicts.map((c) => ({
      ...c,
      resolved: resolvedConflictIds.has(c.id),
    }));
  }, [rawConflicts, resolvedConflictIds]);

  // Compute Balances, Settlements, and Smart Next Payer
  const netBalances = useMemo(() => {
    return calculateNetBalances(expenses, users);
  }, [expenses, users]);

  const settlements = useMemo(() => {
    return minimizeDebts(netBalances, currency);
  }, [netBalances, currency]);

  const nextPayerInfo = useMemo(() => {
    return recommendNextPayer(netBalances, users);
  }, [netBalances, users]);

  // Speech synthesis using natural British J.A.R.V.I.S. neural voice cadence
  const speakText = (text: string) => {
    speakWithJarvisVoice(text, 'en-GB', true);
  };

  const stopSpeaking = () => {
    stopJarvisSpeech();
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

  // Settle all debts using minimal transfers
  const settleAllDebts = () => {
    if (settlements.length === 0) return;
    const nameOf = (id: string) => users.find((u) => u.id === id)?.name.split(' ')[0] || id;
    const settlementEntries: Expense[] = settlements.map((s, idx) => ({
      id: `settle-${Date.now()}-${idx}`,
      title: `Settlement: ${nameOf(s.fromUserId)} → ${nameOf(s.toUserId)}`,
      amount: s.amount,
      currency: currency || 'INR',
      paidByUserId: s.fromUserId,
      splitWithUserIds: [s.toUserId],
      category: 'transit',
      date: 'Today',
      verified: true,
    }));
    setExpenses((prev) => [...settlementEntries, ...prev]);
  };

  // Resolve all conflicts with 1-click auto-heal
  const resolveAllConflicts = () => {
    autoHealSchedule();
    conflicts.forEach((c) => resolveConflict(c.id));
  };

  // Resolve poll and commit winner to itinerary
  const resolvePollAndCommit = (pollId: string) => {
    finalizePoll(pollId);
  };

  // Add itinerary item
  const addItineraryItem = (item: any) => {
    setItinerary((prev) => [
      ...prev,
      {
        ...item,
        id: item.id || `it-${Date.now()}`,
        status: item.status || 'confirmed',
      },
    ]);
  };

  // Add Companion dynamically
  const addCompanion = (companionData: Omit<User, 'id'> | User) => {
    const newId = 'id' in companionData && companionData.id ? companionData.id : `comp-${Date.now()}`;
    const initials = (companionData.name || 'TR')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'TR';
    const avatar = companionData.avatar || createSvgAvatar(initials, '#ea580c', '#c2410c');

    const newCompanion: User = {
      ...companionData,
      id: newId,
      avatar,
      voiceCredits: companionData.voiceCredits ?? 100,
      batteryLevel: companionData.batteryLevel ?? 85,
    };

    setUsers((prev) => [...prev, newCompanion]);
    setTravelStatus((prev) => ({
      ...prev,
      [newId]: {
        userId: newId,
        statusText: 'Joined Trip',
        currentStep: 'booked',
        lastUpdated: 'Just now',
      },
    }));
  };

  // Add Poll dynamically
  const addPoll = (newPoll: MechanismPoll) => {
    setPolls((prev) => [newPoll, ...prev]);
    setActiveTab('decisions');
  };

  // Add Document dynamically
  const addDocument = (newDoc: DocumentItem) => {
    setDocuments((prev) => [newDoc, ...prev]);
    setActiveTab('vault');
    setVaultSubTab('passes');
  };

  // Load sample demo trip (Rajasthan Expedition)
  const loadDemoTrip = () => {
    try {
      const saved = localStorage.getItem('sahyatri_trip_state_v1');
      if (saved) {
        applyDemoTripState(JSON.parse(saved));
      } else {
        applyDemoTripState();
      }
    } catch {
      applyDemoTripState();
    }
    setCurrentUser(INITIAL_USERS[0]);
    setIsDemoTrip(true);
    setIsSetupModalOpen(false);
  };

  // Create clean custom trip
  const createCustomTrip = (info: {
    title: string;
    destination: string;
    dates: string;
    companions?: Array<Partial<User>>;
  }) => {
    const leader = currentUser || activeProfile;
    const initialTravelers: User[] = [
      {
        ...leader,
        role: 'planner',
      },
    ];

    if (info.companions && info.companions.length > 0) {
      info.companions.forEach((c, idx) => {
        if (!c.name) return;
        const cId = `comp-${Date.now()}-${idx}`;
        const initials = (c.name || 'TR')
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase() || 'TR';
        initialTravelers.push({
          id: cId,
          name: c.name,
          role: c.role || 'companion',
          personaType: c.personaType || 'standard',
          relationship: c.relationship || 'Companion',
          age: c.age || 28,
          avatar: c.avatar || createSvgAvatar(initials, '#0284c7', '#2563eb'),
          phone: c.phone || '+91 98000 00000',
          batteryLevel: 90,
          voiceCredits: 100,
          preferences: c.preferences || {
            dietary: ['Vegetarian'],
            medical: [],
            mobility: { maxWalkingMeters: 2000, needsRampOrElevator: false, stairTolerance: 'normal' },
            pacePreference: 'moderate',
          },
        });
      });
    }

    setUsers(initialTravelers);
    setCurrentUser(initialTravelers[0]);
    setItinerary([]);
    setPolls([]);
    setExpenses([]);
    setDocuments([]);
    setMemories([]);
    setPackingList([]);
    const customInfo: TripInfo = {
      id: `trip-${Date.now()}`,
      title: info.title || 'My New Journey',
      destination: info.destination || 'Selected Destination',
      dates: info.dates || 'Upcoming',
      totalDays: 3,
      currentDay: 1,
      isDemo: false,
    };
    setTripInfo(customInfo);
    setIsDemoTrip(false);
    setIsSetupModalOpen(false);
  };


  // Update Current User
  const updateCurrentUser = (patch: Partial<User>) => {
    setCurrentUser((prev) => ({ ...prev, ...patch }));
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? { ...u, ...patch } : u)));
  };

  const personaMode = (currentUser.personaType || 'standard') as import('@/types').PersonaMode;
  const setPersonaMode = (mode: import('@/types').PersonaMode) => {
    updateCurrentUser({ personaType: mode as import('@/types').PersonaType });
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

    // Run Local Edge SLM analysis to execute deterministic 26-tool actions
    const slmAnalysis = runEdgeSlmNlu(command, { currentUser, users });
    let shouldSpeak = true;

    for (const intent of slmAnalysis.intents) {
      switch (intent.type) {
        case 'STOP_SPEECH': {
          stopJarvisSpeech();
          setIsSpeaking(false);
          shouldSpeak = false;
          break;
        }
        case 'SET_CURRENCY': {
          if (intent.params?.currency) {
            setCurrency(intent.params.currency);
          }
          break;
        }
        case 'SWITCH_DAY': {
          if (intent.params?.day) {
            setActiveTab('timeline');
          }
          break;
        }
        case 'GENERATE_DAY_PLAN': {
          const d = intent.params?.day || 3;
          const city = intent.params?.city || 'Jaipur';
          const newStops: ItineraryItem[] = [
            {
              id: `gen-d${d}-1-${Date.now()}`,
              day: d,
              date: `Day ${d}`,
              time: '09:30',
              endTime: '11:30',
              title: `${city} City Palace & Private Royal Quarters`,
              description: `Guided tour of the Chandra Mahal & courtyard collections with elevator and ramp accessibility.`,
              category: 'activity',
              location: `Old City, ${city}`,
              walkingDistanceMeters: 250,
              stairsCount: 0,
              cost: 500,
              costPerPerson: 500,
              isOutdoor: false,
              wheelchairAccessible: true,
              elderNote: 'Elevator access confirmed for Dadaji.',
              kidQuest: 'Find the 4 peacock doors representing the 4 seasons! (+150 XP)',
              kidQuestCompleted: false,
              indoorFallback: 'City Palace Museum (Indoor Galleries)',
              status: 'confirmed',
            },
            {
              id: `gen-d${d}-2-${Date.now()}`,
              day: d,
              date: `Day ${d}`,
              time: '12:30',
              endTime: '14:00',
              title: `Royal Rajasthani Heritage Thali & Puppet Show`,
              description: 'Authentic pure vegetarian multi-course thali lunch with low-sodium options.',
              category: 'dining',
              location: `MI Road, ${city}`,
              walkingDistanceMeters: 50,
              stairsCount: 0,
              cost: 650,
              costPerPerson: 650,
              isOutdoor: false,
              wheelchairAccessible: true,
              elderNote: 'Ground floor dining with cushioned seating.',
              kidQuest: 'Watch the Kathputli puppet dance and collect an artisan souvenir! (+150 XP)',
              kidQuestCompleted: false,
              indoorFallback: 'Air-conditioned Private Dining Room',
              status: 'confirmed',
            },
            {
              id: `gen-d${d}-3-${Date.now()}`,
              day: d,
              date: `Day ${d}`,
              time: '15:30',
              endTime: '17:30',
              title: `Albert Hall Museum & Heritage Indo-Saracenic Gallery`,
              description: 'Historical museum housing rare carpets, miniature paintings, and Egyptian mummy artifact.',
              category: 'activity',
              location: `Ram Niwas Garden, ${city}`,
              walkingDistanceMeters: 180,
              stairsCount: 0,
              cost: 300,
              costPerPerson: 300,
              isOutdoor: false,
              wheelchairAccessible: true,
              elderNote: 'Wheelchair ramps and frequent resting benches.',
              kidQuest: 'Locate the ancient Egyptian mummy in the basement hall! (+200 XP)',
              kidQuestCompleted: false,
              indoorFallback: 'Albert Hall Museum Galleries',
              status: 'confirmed',
            },
          ];
          setItinerary((prev) => [...prev.filter((i) => i.day !== d), ...newStops]);
          setActiveTab('timeline');
          playJarvisSound('heal', true);
          break;
        }
        case 'SET_WEATHER': {
          if (intent.params?.weather) {
            setWeather(intent.params.weather);
          }
          break;
        }
        case 'WEATHER_SWAP': {
          adaptWeatherIndoor(intent.params?.day);
          break;
        }
        case 'HEAL_CONFLICTS': {
          autoHealSchedule(intent.params?.day);
          playJarvisSound('heal', true);
          break;
        }
        case 'SET_PERSONA': {
          const p = intent.params?.persona;
          let target = users[0];
          if (p === 'elderly' || intent.params?.userId === 'dadaji') {
            target =
              users.find(
                (u) =>
                  u.id === 'dadaji' ||
                  u.personaType === 'elderly' ||
                  u.name.toLowerCase().includes('dadaji')
              ) || users[1];
          } else if (p === 'kid' || intent.params?.userId === 'kabir') {
            target =
              users.find(
                (u) =>
                  u.id === 'kabir' ||
                  u.personaType === 'kid' ||
                  u.name.toLowerCase().includes('kabir')
              ) || users[2];
          } else {
            target =
              users.find(
                (u) =>
                  u.id === 'rohan' ||
                  u.role === 'planner' ||
                  u.name.toLowerCase().includes('rohan')
              ) || users[0];
          }
          if (target) {
            setCurrentUser(target);
            try {
              switchQuickCompanion(target.id);
            } catch {}
          }
          break;
        }
        case 'SWITCH_USER': {
          const targetId = intent.params?.memberId || intent.params?.userId;
          const target =
            users.find(
              (u) =>
                u.id === targetId ||
                u.name.toLowerCase().includes(String(targetId || '').toLowerCase())
            ) || users[0];
          if (target) {
            setCurrentUser(target);
            try {
              switchQuickCompanion(target.id);
            } catch {}
          }
          break;
        }
        case 'COMPLETE_KID_QUEST': {
          const q = (intent.params?.query || '').toLowerCase();
          setItinerary((prev) =>
            prev.map((item) => {
              const words = item.title.toLowerCase().split(/\s+/);
              if (q.includes('all') || words.some((w) => w.length > 3 && q.includes(w))) {
                return { ...item, kidQuestCompleted: true };
              }
              return item;
            })
          );
          playJarvisSound('xp', true);
          break;
        }
        case 'VOTE_POLL': {
          const activePoll = polls.find((p) => p.status === 'active') || polls[0];
          if (activePoll && activePoll.options.length > 0) {
            submitQuadraticVote(activePoll.id, activePoll.options[0].id, 4);
          }
          break;
        }
        case 'COMMIT_POLL': {
          const activePoll = polls.find((p) => p.status === 'active') || polls[0];
          if (activePoll) finalizePoll(activePoll.id);
          break;
        }
        case 'CREATE_POLL': {
          const newPoll: MechanismPoll = {
            id: `poll-${Date.now()}`,
            title: `Day 2 Evening Cultural Consensus Choice`,
            description: 'Group decision mechanism with quadratic voice credits.',
            mechanismType: 'quadratic',
            status: 'active',
            deadline: '20:00',
            options: [
              {
                id: `opt-${Date.now()}-1`,
                title: 'Private Chokhi Dhani Folk Village Tour',
                description: 'Rajasthani dance, puppet show, and royal dining.',
                location: 'Chokhi Dhani Resort',
                category: 'dining',
                costEstimate: '₹1,200',
                estimatedCost: 1200,
                votes: 8,
              },
              {
                id: `opt-${Date.now()}-2`,
                title: 'Nahargarh Fort Sunset Viewpoint',
                description: 'Panoramic dusk views over the pink city.',
                location: 'Nahargarh Hills',
                category: 'activity',
                costEstimate: '₹350',
                estimatedCost: 350,
                votes: 5,
              },
            ],
            userVotes: {},
          };
          setPolls((prev) => [newPoll, ...prev]);
          setActiveTab('decisions');
          break;
        }
        case 'ADD_PACKING': {
          const itemText = intent.params?.text || intent.params?.item;
          if (itemText) {
            setPackingList((prev) => [
              { id: `pk-${Date.now()}`, text: itemText, tag: 'Jarvis Added', done: false },
              ...prev,
            ]);
            setActiveTab('vault');
          }
          break;
        }
        case 'TOGGLE_PACKING': {
          const q = (intent.params?.query || '').toLowerCase();
          setPackingList((prev) =>
            prev.map((item) => {
              if (
                q.includes('all') ||
                item.text.toLowerCase().split(/\s+/).some((w) => w.length > 3 && q.includes(w))
              ) {
                return { ...item, done: true };
              }
              return item;
            })
          );
          setActiveTab('vault');
          break;
        }
        case 'REMOVE_PACKING': {
          const q = (intent.params?.query || '').toLowerCase();
          setPackingList((prev) =>
            prev.filter(
              (item) =>
                !item.text.toLowerCase().split(/\s+/).some((w) => w.length > 3 && q.includes(w))
            )
          );
          setActiveTab('vault');
          break;
        }
        case 'SPEAK_PHRASE': {
          const phrase = LOCAL_PHRASES[0]?.hi || 'Namaste';
          speakWithJarvisVoice(phrase, 'hi-IN', true);
          break;
        }
        case 'OPEN_SOS': {
          setIsSosModalOpen(true);
          playJarvisSound('sos', true);
          break;
        }
        case 'IMPORT_VAULT_DOC': {
          setActiveTab('vault');
          setVaultSubTab('passes');
          break;
        }
        case 'ADD_EXPENSE': {
          if (intent.params?.amount) {
            addExpense({
              title: intent.params.title || 'Jaipur City Transit',
              amount: intent.params.amount,
              currency: 'INR',
              paidByUserId: intent.params.payerId || currentUser.id,
              splitWithUserIds: users.map((u) => u.id),
              category: (intent.params.category as Expense['category']) || 'transit',
              date: 'Today',
              verified: true,
            });
            setActiveTab('expenses');
          }
          break;
        }
        case 'REMOVE_EXPENSE': {
          setExpenses((prev) => (prev.length > 0 ? prev.slice(1) : prev));
          setActiveTab('expenses');
          break;
        }
        case 'SETTLE_DEBTS': {
          setActiveTab('expenses');
          break;
        }
        case 'UPDATE_STOP': {
          const { query, newTime, newCost, newDay } = intent.params || {};
          if (query) {
            setItinerary((prev) =>
              prev.map((item) => {
                if (item.title.toLowerCase().includes(query.toLowerCase())) {
                  return {
                    ...item,
                    time: newTime || item.time,
                    cost: newCost !== null && newCost !== undefined ? newCost : item.cost,
                    costPerPerson: newCost !== null && newCost !== undefined ? newCost : item.costPerPerson,
                    day: newDay || item.day,
                  };
                }
                return item;
              })
            );
            setActiveTab('timeline');
          }
          break;
        }
        case 'REMOVE_STOP': {
          const q = (intent.params?.query || '').toLowerCase();
          setItinerary((prev) =>
            prev.filter(
              (item) =>
                !item.title.toLowerCase().split(/\s+/).some((w) => w.length > 3 && q.includes(w))
            )
          );
          setActiveTab('timeline');
          break;
        }
        case 'OPTIMIZE_BUDGET': {
          setItinerary((prev) =>
            prev.map((i) => (i.cost && i.cost > 500 ? { ...i, cost: Math.round(i.cost * 0.7), costPerPerson: Math.round(i.cost * 0.7) } : i))
          );
          setActiveTab('expenses');
          break;
        }
        case 'ADD_STOP': {
          if (intent.params) {
            const addedItem: ItineraryItem = {
              id: `itin-${Date.now()}`,
              day: intent.params.day || 1,
              date: `Day ${intent.params.day || 1}`,
              time: intent.params.startTime || '14:00',
              endTime: intent.params.endTime || '16:00',
              title: intent.params.title || 'Jaipur Heritage Stop',
              description: intent.params.description || 'Added via Autonomous JARVIS voice control.',
              category: 'activity',
              location: intent.params.location || 'Jaipur',
              walkingDistanceMeters: 150,
              stairsCount: 0,
              cost: intent.params.cost || 200,
              costPerPerson: intent.params.cost || 200,
              isOutdoor: false,
              wheelchairAccessible: true,
              status: 'confirmed',
            };
            setItinerary((prev) => [...prev, addedItem]);
            setActiveTab('timeline');
          }
          break;
        }
        case 'STATUS_BRIEFING':
        default:
          break;
      }
    }

    // Apply autonomous tab & sub-tab navigation
    if (res.navigation?.tab) {
      setActiveTab(res.navigation.tab);
    }
    if (res.navigation?.subTab) {
      setVaultSubTab(res.navigation.subTab);
    }

    // Speak aloud response using British voice cadence if speech wasn't silenced
    if (shouldSpeak) {
      speakText(res.spokenResponse);
    }

    return res;
  };

  return (
    <TripContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        tripInfo,
        setTripInfo,
        isDemoTrip,
        loadDemoTrip,
        createCustomTrip,
        addCompanion,
        addPoll,
        addDocument,
        isSetupModalOpen,
        setIsSetupModalOpen,
        isAddCompanionOpen,
        setIsAddCompanionOpen,
        isAddStopOpen,
        setIsAddStopOpen,
        isAddPollOpen,
        setIsAddPollOpen,
        isUploadDocOpen,
        setIsUploadDocOpen,
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
        isJarvisSpeaking: isSpeaking,
        speakText,
        stopSpeaking,
        stopJarvisVoiceNow: stopSpeaking,
        isJarvisOpen,
        setIsJarvisOpen,
        isSosModalOpen,
        setIsSosModalOpen,
        lastJarvisResult,
        executeJarvisCommand,
        executeAutonomousJarvis: executeJarvisCommand,
        resolveConflict,
        submitQuadraticVote,
        finalizePoll,
        addExpense,
        updateTravelStatus,
        updateWellbeing,
        addItineraryRestBuffer,
        weather,
        toggleWeather,
        currency,
        setCurrency,
        packingList,
        togglePackingItem,
        autoHealSchedule,
        adaptWeatherIndoor,
        toggleKidQuest,
        nextPayerInfo,
        activeTab,
        setActiveTab,
        vaultSubTab,
        setVaultSubTab,
        voiceTriggerCount,
        triggerJarvisVoice,
        jarvisControlMode,
        setJarvisControlMode,
        jarvisVoiceState,
        setJarvisVoiceState,
        isHUDModalOpen,
        setIsHUDModalOpen,
        resolveAllConflicts,
        settleAllDebts,
        resolvePollAndCommit,
        addItineraryItem,
        updateCurrentUser,
        personaMode,
        setPersonaMode,
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
