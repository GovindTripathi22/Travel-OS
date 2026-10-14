export type UserRole = 'planner' | 'companion';
export type PersonaType = 'standard' | 'elderly' | 'kid';

export interface UserPreferences {
  dietary: string[];
  medical: string[];
  mobility: {
    maxWalkingMeters: number;
    needsRampOrElevator: boolean;
    stairTolerance: 'none' | 'few' | 'normal';
  };
  pacePreference: 'slow' | 'moderate' | 'fast' | 'relaxed';
  napWindow?: {
    start: string;
    end: string;
  };
  sleepNeeds?: string;
  voiceOnlyPreferred?: boolean;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  personaType: PersonaType;
  relationship: string;
  age: number;
  avatar: string;
  phone: string;
  batteryLevel?: number; // 0 to 100 for wellbeing
  preferences: UserPreferences;
  voiceCredits?: number; // for Quadratic Voting (e.g. 100 credits)
}

export interface ItineraryItem {
  id: string;
  day: number;
  date: string;
  time: string;
  endTime?: string;
  title: string;
  description: string;
  category: 'activity' | 'dining' | 'transit' | 'rest';
  location: string;
  walkingDistanceMeters?: number;
  stairsCount?: number;
  dietaryTags?: string[];
  costPerPerson?: number;
  cost?: number;
  status: 'confirmed' | 'draft' | 'pending_vote';
  conflictWarning?: string;
  image?: string;
  isOutdoor?: boolean;
  indoorFallback?: string;
  fatigueLoad?: number;
  wheelchairAccessible?: boolean;
  elderNote?: string;
  kidQuest?: string;
  kidQuestCompleted?: boolean;
}

export interface ConflictAlert {
  id: string;
  type: 'mobility' | 'dietary' | 'pacing' | 'medical';
  severity: 'critical' | 'warning' | 'info';
  affectedUserId: string;
  eventId: string;
  description: string;
  suggestedAction: {
    title: string;
    resolutionType: 'swap_venue' | 'inject_buffer' | 'book_assistance' | 'custom';
    details: string;
    replacementTitle?: string;
  };
  resolved: boolean;
}

export interface PollOption {
  id: string;
  title: string;
  description: string;
  costEstimate: string;
  estimatedCost?: number;
  location: string;
  category: string;
  image?: string;
  votes?: number;
}

export interface MechanismPoll {
  id: string;
  title: string;
  description: string;
  mechanismType: 'quadratic' | 'borda' | 'approval';
  status: 'active' | 'resolved';
  deadline: string;
  options: PollOption[];
  // userVotes: for Borda: Record<userId, optionId[]>; for Quadratic: Record<userId, Record<optionId, number>>
  userVotes: Record<string, any>;
  winningOptionId?: string;
  consensusExplanation?: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  currency: string;
  paidByUserId: string;
  splitWithUserIds: string[];
  category: 'dining' | 'transit' | 'hotel' | 'tickets' | 'misc';
  date: string;
  receiptUrl?: string;
  verified: boolean;
}

export interface Settlement {
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
}

export interface TravelStatus {
  userId: string;
  flightNumber?: string;
  airline?: string;
  statusText: string;
  currentStep: 'booked' | 'check_in' | 'security' | 'boarded' | 'in_flight' | 'landed' | 'at_rendezvous';
  eta?: string;
  lastUpdated: string;
  baggageCarousel?: string;
  terminalGate?: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  type: 'boarding_pass' | 'passport' | 'hotel_voucher' | 'prescription' | 'train_ticket';
  ownerId: string;
  sharingScope: 'private' | 'planner_only' | 'family_all';
  referenceNumber: string;
  validUntil?: string;
  qrPayload?: string;
  cachedOffline: boolean;
}

export interface WellbeingCheckIn {
  userId: string;
  date: string;
  energyScore: number;
  reportedFatigue?: string;
  bufferRecommended: boolean;
}

export interface PhotoMemory {
  id: string;
  imageUrl: string;
  caption: string;
  day: number;
  location: string;
  uploaderId: string;
  taggedUserIds: string[];
  timestamp: string;
  aiStorySnippet?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  contextBadge?: string;
  suggestedQuickReplies?: string[];
}

export type JarvisIntent =
  | 'ADD_EXPENSE'
  | 'CHECK_MEDICINE'
  | 'INJECT_REST_BUFFER'
  | 'SHOW_TICKET'
  | 'VOTE_POLL'
  | 'FINALIZE_POLL'
  | 'TRIGGER_SOS'
  | 'RUN_DIAGNOSTIC'
  | 'SWITCH_USER'
  | 'SOLVE_CONFLICT'
  | 'QUERY_SCHEDULE'
  | 'NAVIGATE_TAB'
  | 'TOGGLE_VIEW_MODE'
  | 'OPEN_ASSISTANT'
  | 'UPDATE_TRAVEL_STATUS'
  | 'UNKNOWN';

export interface JarvisActionResult {
  intent: JarvisIntent;
  summary: string;
  spokenResponse: string;
  actionExecuted?: string;
  cardType?: 'expense' | 'health' | 'rest' | 'ticket' | 'poll' | 'sos' | 'diagnostic' | 'schedule';
  cardData?: any;
  quickReplies?: string[];
  navigation?: {
    tab?: 'timeline' | 'decisions' | 'expenses' | 'vault';
    subTab?: 'passes' | 'rendezvous' | 'alignment' | 'photos';
  };
}

export interface PackingItem {
  id: string;
  text: string;
  tag: string;
  done: boolean;
}

export interface PhraseItem {
  id: string;
  en: string;
  hi?: string;
  jp?: string;
  badge: string;
}


