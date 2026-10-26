import {
  User,
  ItineraryItem,
  MechanismPoll,
  Expense,
  TravelStatus,
  DocumentItem,
  ConflictAlert,
  JarvisActionResult,
  JarvisIntent,
} from '@/types';
import {
  getNextUpcomingStop,
  normalizeTravelQuery,
  generateCompanionResponse,
} from './companionAgent';

export interface JarvisContext {
  currentUser: User;
  users: User[];
  itinerary: ItineraryItem[];
  polls: MechanismPoll[];
  expenses: Expense[];
  travelStatus: Record<string, TravelStatus>;
  documents: DocumentItem[];
  conflicts: ConflictAlert[];
}

/**
 * In-House Travel Sahayak (सहायक) Brain.
 * Zero external LLMs. 100% offline, deterministic & heuristic NLP parser.
 * Runs in <15ms, extracts intents & slots, and executes every feature of the website.
 */
export function processJarvisVoiceCommand(
  rawInput: string,
  ctx: JarvisContext
): JarvisActionResult {
  // Strip wake words (e.g. "Hey Sahayak", "Sahayak", "Ok Sahayak", "Suno Sahayak", "Hey Jarvis", "Sahyatri")
  let clean = rawInput.trim();
  const wakeWordMatch = clean.match(
    /^(?:hey\s+sahayak|sahayak|ok\s+sahayak|suno\s+sahayak|namaste\s+sahayak|hey\s+jarvis|jarvis|ok\s+jarvis|hello\s+jarvis|sahyatri)[,\s:]*/i
  );
  if (wakeWordMatch) {
    clean = clean.slice(wakeWordMatch[0].length).trim();
  }

  const rawClean = clean || rawInput.trim();
  const lower = rawClean.toLowerCase();
  const norm = normalizeTravelQuery(lower);

  // 0. STOP / INTERRUPT PROTOCOL (HIGHEST PRIORITY)
  const isExplicitStop =
    /^(?:sahayak|jarvis|hey sahayak|ok sahayak)?\s*(?:stop|ruko|chup|quiet|pause|cancel|bas|silence|mute|shut up|hush|band karo|shant|ruk jao|ruk|arrey ruko)\b/i.test(lower) ||
    lower === 'stop' ||
    lower === 'ruko' ||
    lower === 'chup' ||
    lower === 'quiet' ||
    lower === 'bas';

  if (isExplicitStop) {
    return {
      intent: 'STOP',
      summary: 'Sahayak speech interrupted and stopped',
      spokenResponse: '',
      actionExecuted: 'STOP_SPEECH',
    };
  }

  // 0B. ACOUSTIC ECHO SUPPRESSION GUARD
  // If input is merely acoustic echo from Sahayak's own voice, ignore it immediately without re-triggering speech
  if (
    lower.includes('at your service') ||
    lower.includes('aapki seva mein') ||
    lower.includes('standing by for your travel command') ||
    lower.includes('telemetry systems online') ||
    lower.includes('how may i assist') ||
    lower.includes('all transportation and dietary requirements are pre-vetted') ||
    lower.includes('next scheduled activity is') ||
    lower.includes('surya mahal royal rajasthani lunch')
  ) {
    return {
      intent: 'UNKNOWN',
      summary: 'Acoustic echo filtered',
      spokenResponse: '',
      actionExecuted: 'NO_OP',
    };
  }

  // If user just spoke the wake word
  if (
    !clean ||
    lower === 'sahayak' ||
    lower === 'hey sahayak' ||
    lower === 'suno sahayak' ||
    lower === 'jarvis' ||
    lower === 'hey jarvis'
  ) {
    return {
      intent: 'UNKNOWN',
      summary: 'Sahayak Standby & Listening',
      spokenResponse: `Sahayak aapki seva mein hazir hai, ${ctx.currentUser.name.split(' ')[0]}. Boliye, main kya madad karu?`,
      actionExecuted: 'STANDBY_ACK',
      quickReplies: ['Add ₹1,200 Lunch', "Check Dadaji's Meds", 'Show Debt Graph', 'Emergency SOS'],
    };
  }

  // 1. EMERGENCY & SOS PROTOCOL
  if (
    lower.includes('sos') ||
    lower.includes('emergency') ||
    lower.includes('hospital') ||
    lower.includes('police') ||
    lower.includes('ambulance') ||
    lower.includes('accident') ||
    lower.includes('lost')
  ) {
    return {
      intent: 'TRIGGER_SOS',
      summary: 'Emergency Protocol & Offline Medical Cards Activated',
      spokenResponse:
        'Emergency protocol initiated. Local emergency helpline is 112. Nearest facility is SMS Medical College Hospital in Jaipur, 4.2 km away. Blood groups and emergency medical files are ready.',
      actionExecuted: 'DISPLAY_OFFLINE_SOS',
      cardType: 'sos',
      cardData: {
        police: '112',
        ambulance: '108',
        hospitalName: 'Sawai Man Singh (SMS) Medical College & Hospital',
        hospitalAddress: 'Jawahar Lal Nehru Marg, Jaipur, Rajasthan',
        hospitalPhone: '+91 141 256 0291',
        hotelContact: 'Rambagh Palace Concierge: +91 141 221 1919',
        companionsMedical: ctx.users.map((u) => ({
          name: u.name,
          phone: u.phone,
          bloodGroup: u.id === 'dadaji' ? 'O+ (Hypertension)' : u.id === 'priya' ? 'B+' : 'A+',
          notes: u.preferences.medical[0] || 'No critical conditions',
        })),
      },
      quickReplies: ['Call 112 Police', 'Call SMS Hospital', 'Open Dadaji Prescription'],
    };
  }

  // 2. EXPENSE LOGGING VIA NATURAL SPEECH
  const hasExpenseKeywords =
    lower.includes('add') ||
    lower.includes('spent') ||
    lower.includes('paid') ||
    lower.includes('expense') ||
    lower.includes('bill') ||
    lower.includes('split') ||
    lower.includes('cost');

  const moneyMatch = lower.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:rupees|rs|inr)?/);

  if (hasExpenseKeywords && moneyMatch) {
    const rawNumber = moneyMatch[1].replace(/,/g, '');
    const amount = parseFloat(rawNumber);

    if (!isNaN(amount) && amount > 0) {
      let payer = ctx.currentUser;
      for (const u of ctx.users) {
        if (lower.includes(u.name.toLowerCase().split(' ')[0])) {
          payer = u;
          break;
        }
      }

      let category: Expense['category'] = 'misc';
      let title = 'Group Expense';

      if (lower.includes('taxi') || lower.includes('cab') || lower.includes('uber') || lower.includes('auto')) {
        category = 'transit';
        title = 'Jaipur City Transit / Auto';
      } else if (
        lower.includes('lunch') ||
        lower.includes('dinner') ||
        lower.includes('food') ||
        lower.includes('tea') ||
        lower.includes('chai') ||
        lower.includes('breakfast') ||
        lower.includes('snack') ||
        lower.includes('kulfi') ||
        lower.includes('thali')
      ) {
        category = 'dining';
        title = lower.includes('thali') ? 'Rajasthani Thali Dining' : 'Group Meal / Dining';
      } else if (lower.includes('ticket') || lower.includes('pass') || lower.includes('entry') || lower.includes('fort')) {
        category = 'tickets';
        title = 'Heritage Monument Tickets';
      } else if (lower.includes('hotel') || lower.includes('room') || lower.includes('resort')) {
        category = 'hotel';
        title = 'Heritage Stay / Hotel Room';
      }

      const splitWith = ctx.users.map((u) => u.id);
      const perPerson = Math.round(amount / splitWith.length);

      return {
        intent: 'ADD_EXPENSE',
        summary: `Logged ₹${amount.toLocaleString()} for ${title}`,
        spokenResponse: `Recorded ₹${amount} for ${title}, paid by ${payer.name}. Split equally across all 6 companions at ₹${perPerson} each. Ledger and debt settlement graph updated.`,
        actionExecuted: 'MUTATE_EXPENSE_STORE',
        navigation: { tab: 'expenses' },
        cardType: 'expense',
        cardData: {
          title,
          amount,
          paidByUserId: payer.id,
          paidByName: payer.name,
          category,
          perPerson,
          splitCount: splitWith.length,
        },
        quickReplies: ['View Debt Settlement Graph', 'Show All Expenses', 'Undo Last Expense'],
      };
    }
  }

  // 3. TAB NAVIGATION (Full coverage of all 4 tabs + 4 sub-tabs)
  if (
    lower.includes('show') ||
    lower.includes('open') ||
    lower.includes('go to') ||
    lower.includes('navigate') ||
    lower.includes('view')
  ) {
    if (lower.includes('expense') || lower.includes('ledger') || lower.includes('bill') || lower.includes('money') || lower.includes('debt') || lower.includes('who owes')) {
      const total = ctx.expenses.reduce((s, e) => s + e.amount, 0);
      return {
        intent: 'NAVIGATE_TAB',
        summary: 'Navigating to Expenses & Debt Settlement Ledger',
        spokenResponse: `Displaying expense ledger. Total trip spend is ₹${total.toLocaleString()}. Debt settlement engine has consolidated all IOUs into minimal net transfers.`,
        actionExecuted: 'NAVIGATE_TAB',
        navigation: { tab: 'expenses' },
        quickReplies: ['Add ₹800 Taxi', 'Who Owes Whom?', 'Show Timeline'],
      };
    }

    if (lower.includes('decision') || lower.includes('poll') || lower.includes('vote') || lower.includes('voting')) {
      return {
        intent: 'NAVIGATE_TAB',
        summary: 'Navigating to Group Decision Mechanisms',
        spokenResponse: 'Opening group decision polls. Active poll: Afternoon cultural choice with quadratic voting allocation.',
        actionExecuted: 'NAVIGATE_TAB',
        navigation: { tab: 'decisions' },
        quickReplies: ['Vote Puppet Workshop', 'Vote Cooking Class', 'Finalize Poll'],
      };
    }

    if (lower.includes('timeline') || lower.includes('itinerary') || lower.includes('schedule') || lower.includes('events')) {
      return {
        intent: 'NAVIGATE_TAB',
        summary: 'Navigating to Day 1 Itinerary Timeline',
        spokenResponse: `Opening trip timeline. Next stop is ${ctx.itinerary[0]?.title || 'Surya Mahal'} at ${ctx.itinerary[0]?.time || '13:00'}.`,
        actionExecuted: 'NAVIGATE_TAB',
        navigation: { tab: 'timeline' },
        quickReplies: ['What is next event?', 'Add 30m Rest Break', 'Check Dadaji Stairs'],
      };
    }

    if (lower.includes('photo') || lower.includes('memories') || lower.includes('pictures') || lower.includes('camera') || lower.includes('story')) {
      return {
        intent: 'NAVIGATE_TAB',
        summary: 'Navigating to Shared Photo Stream & Memory Chronicles',
        spokenResponse: 'Opening shared photo stream. Day 1 story has been synthesized across all companion memories.',
        actionExecuted: 'NAVIGATE_TAB',
        navigation: { tab: 'vault', subTab: 'photos' },
        quickReplies: ['Synthesize Day 1 Story', 'Upload Photo', 'Show Passes'],
      };
    }

    if (lower.includes('rendezvous') || lower.includes('flight') || lower.includes('airport') || lower.includes('gate')) {
      return {
        intent: 'NAVIGATE_TAB',
        summary: 'Navigating to Airport Rendezvous HUD',
        spokenResponse: 'Opening Airport Rendezvous HUD. All 6 companion flights tracked. Rendezvous point is Terminal 2 Gate 4.',
        actionExecuted: 'NAVIGATE_TAB',
        navigation: { tab: 'vault', subTab: 'rendezvous' },
        quickReplies: ['Update my status to landed', 'Show Boarding Pass', 'Open Timeline'],
      };
    }

    if (lower.includes('alignment') || lower.includes('radar') || lower.includes('energy') || lower.includes('battery')) {
      return {
        intent: 'NAVIGATE_TAB',
        summary: 'Navigating to Pre-Trip Alignment Radar & Wellbeing Battery',
        spokenResponse: 'Opening group alignment radar. Group consensus score is 88%, with optimal circadian pacing.',
        actionExecuted: 'NAVIGATE_TAB',
        navigation: { tab: 'vault', subTab: 'alignment' },
        quickReplies: ['Check Dadaji Battery', 'Add Rest Buffer', 'Show Decisions'],
      };
    }

    if (lower.includes('vault') || lower.includes('document') || lower.includes('pass') || lower.includes('ticket')) {
      return {
        intent: 'NAVIGATE_TAB',
        summary: 'Navigating to Document Vault & Offline Passes',
        spokenResponse: 'Opening Document Vault. Your offline boarding passes and verified monument tickets are cached.',
        actionExecuted: 'NAVIGATE_TAB',
        navigation: { tab: 'vault', subTab: 'passes' },
        quickReplies: ['Show QR Pass', 'Show Airport HUD', 'Open Timeline'],
      };
    }
  }

  // 4. SENIOR HEALTH & MEDICATION SENTINEL
  if (
    lower.includes('medicine') ||
    lower.includes('dawai') ||
    lower.includes('meds') ||
    lower.includes('bp') ||
    lower.includes('sugar') ||
    lower.includes('health') ||
    lower.includes('pill') ||
    (lower.includes('dadaji') && lower.includes('time'))
  ) {
    return {
      intent: 'CHECK_MEDICINE',
      summary: "Dadaji's Blood Pressure & Wellness Sentinel",
      spokenResponse:
        "Dadaji's morning Amlodipine 5mg was taken at 8:00 AM. Evening dose is scheduled at 8:00 PM with sunset tea. Amber Fort golf cart pass is pre-booked, zero fort steps required.",
      actionExecuted: 'CHECK_HEALTH_CONSTRAINTS',
      navigation: { tab: 'timeline' },
      cardType: 'health',
      cardData: {
        patient: 'Dadaji (72 yrs)',
        condition: 'Hypertension & Mild Knee Osteoarthritis',
        morningDose: 'Amlodipine 5mg at 08:00 AM [✓ Completed]',
        eveningDose: 'Telmisartan 40mg at 20:00 PM [Scheduled]',
        hydrationTarget: '1.8L warm water (Current: 1.2L)',
        mobilitySafeguard: 'Amber Fort Golf Cart Pass Confirmed (Ref #RJ-TOUR-09)',
      },
      quickReplies: ['Add Chai Rest Buffer', 'View Medical Vault Prescription', 'Check Timeline'],
    };
  }

  // 5. DYNAMIC ITINERARY REST BUFFER INJECTION
  if (
    lower.includes('tired') ||
    lower.includes('fatigue') ||
    lower.includes('exhausted') ||
    lower.includes('rest') ||
    lower.includes('break') ||
    lower.includes('buffer') ||
    lower.includes('chai break') ||
    lower.includes('pause') ||
    lower.includes('slow down')
  ) {
    return {
      intent: 'INJECT_REST_BUFFER',
      summary: 'Injected 30-Minute Chai & Recharge Rest Buffer',
      spokenResponse:
        'Inserted a 30-minute Chai and Rest buffer into the live timeline at 3:00 PM in the shaded garden pavilion. Walking meters reduced to zero.',
      actionExecuted: 'INJECT_REST_TIMELINE',
      navigation: { tab: 'timeline' },
      cardType: 'rest',
      cardData: {
        durationMinutes: 30,
        time: '15:00',
        title: 'Chai & Recharge Downtime',
        location: 'Hotel Verandah & Garden Pavilion',
        benefit: 'Prevents knee fatigue for Dadaji and recharges group energy.',
      },
      quickReplies: ['Check Updated Timeline', 'Show Decisions', 'Show Expenses'],
    };
  }

  // 6. INSTANT BOARDING PASS & QR RETRIEVAL
  if (
    lower.includes('ticket') ||
    lower.includes('pass') ||
    lower.includes('boarding') ||
    lower.includes('qr') ||
    lower.includes('flight') ||
    lower.includes('voucher')
  ) {
    const userDoc =
      ctx.documents.find((d) => d.ownerId === ctx.currentUser.id) || ctx.documents[0];

    return {
      intent: 'SHOW_TICKET',
      summary: `Retrieved: ${userDoc.title}`,
      spokenResponse: `Retrieved ${userDoc.title} for ${ctx.currentUser.name}. Offline QR pass reference ${userDoc.referenceNumber} is ready on screen for gate scanning.`,
      actionExecuted: 'OPEN_DOCUMENT_VAULT',
      navigation: { tab: 'vault', subTab: 'passes' },
      cardType: 'ticket',
      cardData: {
        title: userDoc.title,
        referenceNumber: userDoc.referenceNumber,
        qrPayload: userDoc.qrPayload,
        owner: ctx.currentUser.name,
        offlineReady: true,
      },
      quickReplies: ['Show Amber Fort Passes', 'Hotel Voucher', 'All 6 Boarding Passes'],
    };
  }

  // 7. FINALIZE MECHANISM POLL
  if (
    lower.includes('finalize') ||
    lower.includes('resolve poll') ||
    lower.includes('close voting') ||
    lower.includes('choose winner') ||
    lower.includes('decide poll')
  ) {
    const activePoll = ctx.polls.find((p) => p.status === 'active') || ctx.polls[0];
    return {
      intent: 'FINALIZE_POLL',
      summary: `Finalized Poll: ${activePoll.title}`,
      spokenResponse: `Poll resolved using quadratic consensus math. Winning event has been automatically added to the trip itinerary with highest group welfare.`,
      actionExecuted: 'RESOLVE_ACTIVE_POLL',
      navigation: { tab: 'decisions' },
      cardType: 'poll',
      cardData: {
        pollTitle: activePoll.title,
        status: 'resolved',
      },
      quickReplies: ['Check Updated Timeline', 'Show Expenses', 'Run Diagnostic'],
    };
  }

  // 8. MECHANISM DECISION VOTING VIA SPEECH
  if (
    lower.includes('vote') ||
    lower.includes('poll') ||
    lower.includes('puppet') ||
    lower.includes('cooking') ||
    lower.includes('thali') ||
    lower.includes('chokhi') ||
    lower.includes('nahargarh')
  ) {
    const activePoll = ctx.polls.find((p) => p.status === 'active') || ctx.polls[0];
    let chosenOption = activePoll.options[0];

    if (lower.includes('cooking') || lower.includes('food')) {
      chosenOption = activePoll.options[1] || chosenOption;
    } else if (lower.includes('puppet') || lower.includes('workshop')) {
      chosenOption = activePoll.options[0];
    } else if (lower.includes('nahargarh') || lower.includes('sunset')) {
      chosenOption = activePoll.options[2] || chosenOption;
    }

    return {
      intent: 'VOTE_POLL',
      summary: `Cast Quadratic Votes for ${chosenOption.title}`,
      spokenResponse: `Your quadratic vote for "${chosenOption.title}" has been registered using 16 voice credits. Group consensus updated live.`,
      actionExecuted: 'SUBMIT_QUADRATIC_VOTE',
      navigation: { tab: 'decisions' },
      cardType: 'poll',
      cardData: {
        pollTitle: activePoll.title,
        optionTitle: chosenOption.title,
        creditsSpent: 16,
        remainingCredits: (ctx.currentUser.voiceCredits || 100) - 16,
      },
      quickReplies: ['Finalize Group Consensus', 'View Poll Breakdown', 'Show Timeline'],
    };
  }

  // 9. PERSPECTIVE / USER SWITCHING
  const hasSwitchVerb =
    lower.includes('switch') ||
    lower.includes('change') ||
    lower.includes('login') ||
    lower.includes('mode') ||
    lower.startsWith('as ') ||
    lower === 'dadaji' ||
    lower === 'kabir' ||
    lower === 'priya' ||
    lower === 'rohan' ||
    lower === 'elderly' ||
    lower === 'kid';

  const isQueryAboutSubject =
    lower.includes('stair') ||
    lower.includes('walk') ||
    lower.includes('climb') ||
    lower.includes('wheelchair') ||
    lower.includes('golf cart') ||
    lower.includes('knee') ||
    lower.includes('medicine') ||
    lower.includes('food') ||
    lower.includes('lunch') ||
    lower.includes('what') ||
    lower.includes('how') ||
    lower.includes('when') ||
    lower.includes('where') ||
    lower.includes('are there');

  if (hasSwitchVerb && !isQueryAboutSubject) {
    let targetUser = ctx.currentUser;
    if (
      lower.includes('dadaji') ||
      lower.includes('elderly') ||
      lower.includes('senior') ||
      lower.includes('grandfather') ||
      lower.includes('devendra')
    ) {
      targetUser =
        ctx.users.find(
          (u) =>
            u.id === 'dadaji' ||
            u.personaType === 'elderly' ||
            u.name.toLowerCase().includes('dadaji') ||
            u.name.toLowerCase().includes('devendra')
        ) || targetUser;
    } else if (lower.includes('kabir') || lower.includes('kid') || lower.includes('leo')) {
      targetUser =
        ctx.users.find(
          (u) =>
            u.id === 'kabir' ||
            u.personaType === 'kid' ||
            u.name.toLowerCase().includes('kabir') ||
            u.name.toLowerCase().includes('leo')
        ) || targetUser;
    } else if (lower.includes('priya') || lower.includes('jain')) {
      targetUser =
        ctx.users.find(
          (u) => u.id === 'priya' || u.name.toLowerCase().includes('priya')
        ) || targetUser;
    } else if (lower.includes('rohan') || lower.includes('planner') || lower.includes('aarav')) {
      targetUser =
        ctx.users.find(
          (u) =>
            u.id === 'rohan' ||
            u.role === 'planner' ||
            u.name.toLowerCase().includes('rohan') ||
            u.name.toLowerCase().includes('aarav')
        ) || targetUser;
    }

    return {
      intent: 'SWITCH_USER',
      summary: `Switched Perspective to ${targetUser.name}`,
      spokenResponse: `Switching active perspective to ${targetUser.name}. UI adapting to ${
        targetUser.personaType === 'elderly'
          ? 'Large-Text Voice-First Elderly Mode'
          : targetUser.personaType === 'kid'
          ? 'Gamified Explorer Kid Mode'
          : 'Planner Control Mode'
      }.`,
      actionExecuted: 'CHANGE_ACTIVE_USER',
      cardType: 'schedule',
      cardData: {
        userId: targetUser.id,
        userName: targetUser.name,
        persona: targetUser.personaType,
      },
      quickReplies: ['What is my next task?', 'Show my profile', 'Open Assistant Drawer'],
    };
  }

  // 10. DEVICE VIEWPORT SIMULATION
  if (
    lower.includes('mobile view') ||
    lower.includes('phone preview') ||
    lower.includes('desktop view') ||
    lower.includes('full view') ||
    lower.includes('mobile frame')
  ) {
    const isMobile = lower.includes('mobile') || lower.includes('phone');
    return {
      intent: 'TOGGLE_VIEW_MODE',
      summary: isMobile ? 'Switched to Mobile Phone Frame Simulation' : 'Switched to Full Screen Desktop View',
      spokenResponse: isMobile
        ? 'Switched to simulated mobile phone frame view.'
        : 'Switched to full desktop browser layout.',
      actionExecuted: isMobile ? 'VIEW_MODE_MOBILE' : 'VIEW_MODE_FULL',
      quickReplies: ['Toggle Back', 'Show Timeline', 'Show Expenses'],
    };
  }

  // 11. OPEN PERSONAL ASSISTANT DRAWER
  if (
    lower.includes('open assistant') ||
    lower.includes('open drawer') ||
    lower.includes('chat with bot') ||
    lower.includes('assistant drawer')
  ) {
    return {
      intent: 'OPEN_ASSISTANT',
      summary: "Opening Companion Assistant Drawer",
      spokenResponse: `Opening ${ctx.currentUser.name.split(' ')[0]}'s personal assistant drawer.`,
      actionExecuted: 'OPEN_ASSISTANT_DRAWER',
      quickReplies: ['Ask about lunch', 'Ask about stairs', 'Close drawer'],
    };
  }

  // 12. UPDATE TRAVEL STATUS
  if (
    lower.includes('landed') ||
    lower.includes('at gate') ||
    lower.includes('at airport') ||
    lower.includes('at rendezvous') ||
    lower.includes('boarded')
  ) {
    let step: TravelStatus['currentStep'] = 'landed';
    let text = 'Landed safely at Jaipur Airport (JAI)';

    if (lower.includes('at gate')) {
      step = 'terminalGate' as any;
      text = 'Arrived at Gate 4 rendezvous point';
    } else if (lower.includes('rendezvous')) {
      step = 'at_rendezvous';
      text = 'At rendezvous point with group';
    }

    return {
      intent: 'UPDATE_TRAVEL_STATUS',
      summary: `Updated Status: ${text}`,
      spokenResponse: `Your travel status has been updated to "${text}". All companions can see your live airport checkpoint.`,
      actionExecuted: 'UPDATE_TRAVEL_STATUS',
      navigation: { tab: 'vault', subTab: 'rendezvous' },
      cardData: { step, text },
      quickReplies: ['Show Rendezvous HUD', 'Show Boarding Pass', 'Open Timeline'],
    };
  }

  // 13. TIMELINE AUTO-HEALING & SCHEDULE OVERLAPS
  if (
    lower.includes('heal') ||
    lower.includes('auto heal') ||
    lower.includes('overlap') ||
    lower.includes('fix schedule') ||
    lower.includes('fix timeline') ||
    lower.includes('schedule fix') ||
    lower.includes('reschedule') ||
    lower.includes('theek karo') ||
    lower.includes('slide')
  ) {
    return {
      intent: 'HEAL_SCHEDULE',
      summary: 'Timeline Auto-Healed: Resolved Overlaps & Added Transit Buffers',
      spokenResponse: 'Schedule auto-heal ho gaya hai! Timeline ke overlaps resolve karke transit buffer add kar diya hai.',
      actionExecuted: 'HEAL_SCHEDULE',
      navigation: { tab: 'timeline' },
      cardType: 'schedule',
      quickReplies: ['Show Timeline', 'Swap Indoor Weather', 'Who Pays Next?'],
    };
  }

  // 14. WEATHER & SCHEDULE QUERY PROTOCOLS
  const isWeatherQuery =
    norm.includes('weather') ||
    norm.includes('mausam') ||
    norm.includes('temp') ||
    norm.includes('sunny') ||
    norm.includes('forecast') ||
    norm.includes('garmi') ||
    norm.includes('cold') ||
    norm.includes('umbrella') ||
    norm.includes('climate') ||
    lower.includes('weathere') ||
    lower.includes('wether');

  const isPlanQuery =
    norm.includes('next') ||
    norm.includes('plan') ||
    norm.includes('schedule') ||
    norm.includes('itinerary') ||
    norm.includes('stop') ||
    norm.includes('timing') ||
    norm.includes('kya plan hai') ||
    norm.includes('agla') ||
    norm.includes('kahan jana') ||
    norm.includes('what are we doing') ||
    norm.includes('what next') ||
    norm.includes('upcoming');

  // 14A. COMPOUND QUERY: BOTH NEXT PART OF PLAN AND DESTINATION WEATHER
  if (isWeatherQuery && isPlanQuery) {
    const nextItem = getNextUpcomingStop(ctx.itinerary);
    return {
      intent: 'QUERY_SCHEDULE',
      summary: `Upcoming Plan & Weather: ${nextItem.title} (32°C Clear)`,
      spokenResponse: `Next stop is "${nextItem.title}" at ${nextItem.time} at ${nextItem.location}. Current weather in Jaipur is 32°C with pleasant, clear skies and zero percent rain. All outdoor sightseeing is completely safe.`,
      navigation: { tab: 'timeline' },
      cardType: 'schedule',
      cardData: {
        title: nextItem.title,
        time: nextItem.time,
        location: nextItem.location,
        weather: '32°C Clear (0% rain)',
      },
      quickReplies: ['Check lunch menu', 'Are there stairs for Dadaji?', 'Show Timeline'],
    };
  }

  // 14B. INFORMATIONAL WEATHER QUERY (e.g. "how is the weather in jaipur", "what is the temperature")
  if (
    isWeatherQuery &&
    !norm.includes('swap') &&
    !norm.includes('indoor') &&
    !norm.includes('badlo')
  ) {
    return {
      intent: 'QUERY_WEATHER',
      summary: 'Jaipur Weather: 32°C, Pleasant & Clear Skies',
      spokenResponse:
        'Current weather in Jaipur is 32°C with pleasant, clear skies, 18% humidity, and zero percent probability of rain. All outdoor stops including City Palace and Chokhi Dhani are fully cleared.',
      navigation: { tab: 'timeline' },
      cardType: 'schedule',
      cardData: {
        city: 'Jaipur, Rajasthan',
        tempC: 32,
        feelsLike: 30,
        condition: 'Clear Skies',
        rainChance: '0%',
      },
      quickReplies: ['What is the next stop on the plan?', 'Are there stairs for Dadaji?', 'Show Itinerary'],
    };
  }

  // 14C. WEATHER & RAIN ADAPTATION (Rainy weather fallback swap)
  if (
    lower.includes('rain') ||
    lower.includes('raining') ||
    lower.includes('baarish') ||
    lower.includes('indoor') ||
    lower.includes('swap outdoor') ||
    lower.includes('swap indoor') ||
    lower.includes('mausam')
  ) {
    return {
      intent: 'WEATHER_ADAPTATION',
      summary: 'Swapped Outdoor Stops to Indoor Fallbacks for Rainy Weather',
      spokenResponse: 'Baarish aur weather risk adapt kar diya gaya hai. Outdoor stops ko sheltered indoor venues mein convert kar diya hai.',
      actionExecuted: 'WEATHER_SWAP',
      navigation: { tab: 'timeline' },
      cardType: 'schedule',
      quickReplies: ['Show Itinerary', 'Fix Overlaps', 'Who Pays Next?'],
    };
  }

  // 15. CONFLICT RESOLUTION (Mobility / Ramp / Dietary Conflicts)
  const isConflictResolutionAction =
    lower.includes('conflict') ||
    lower.includes('resolve') ||
    (lower.includes('fix') && !lower.includes('schedule') && !lower.includes('overlap')) ||
    lower.includes('apply ramp') ||
    lower.includes('apply fix');

  if (isConflictResolutionAction) {
    const unres = ctx.conflicts.find((c) => !c.resolved);
    return {
      intent: 'SOLVE_CONFLICT',
      summary: unres ? `Applied 1-Click Fix: ${unres.suggestedAction.title}` : 'All Conflicts Already Resolved',
      spokenResponse: unres
        ? `Applied fix for ${unres.description}. ${unres.suggestedAction.details}`
        : 'All itinerary accommodations are currently 100% resolved and verified.',
      actionExecuted: unres ? 'RESOLVE_CONFLICT_ITEM' : 'NO_OP',
      navigation: { tab: 'timeline' },
      cardType: 'schedule',
      cardData: {
        conflictId: unres?.id,
        actionTitle: unres?.suggestedAction.title,
      },
      quickReplies: ['Show Itinerary', 'Check Dadaji Schedule', 'System Diagnostic'],
    };
  }

  // 16. WHO PAYS NEXT / DEBT FAIRNESS
  if (
    lower.includes('who pays') ||
    lower.includes('who should pay') ||
    lower.includes('next payer') ||
    lower.includes('kaun pay karega') ||
    lower.includes('agla kharcha') ||
    lower.includes('fairness') ||
    lower.includes('who owes')
  ) {
    const nextPayer = ctx.users[1] || ctx.currentUser;
    return {
      intent: 'WHO_PAYS_NEXT',
      summary: `Fair Next Payer Recommended: ${nextPayer.name}`,
      spokenResponse: `Fairness recommender ke mutabik, agla payment ${nextPayer.name} ko karna chahiye taaki group debt balance rahe.`,
      actionExecuted: 'NAVIGATE_TAB',
      navigation: { tab: 'expenses' },
      cardType: 'expense',
      quickReplies: ['Add ₹500 Lunch', 'View Expense Ledger', 'Show Timeline'],
    };
  }

  // 17. EXPLORER KID QUESTS
  if (
    lower.includes('quest') ||
    lower.includes('xp') ||
    lower.includes('explorer') ||
    lower.includes('kabir quest')
  ) {
    return {
      intent: 'COMPLETE_KID_QUEST',
      summary: 'Explorer Kid Quest Completed (+150 XP)',
      spokenResponse: 'Explorer Quest complete ho gaya hai! Kabir ko 150 XP award kiye gaye hain.',
      actionExecuted: 'COMPLETE_KID_QUEST',
      navigation: { tab: 'timeline' },
      cardType: 'schedule',
      quickReplies: ['Switch to Kabir', 'Show XP Level', 'Next Quest'],
    };
  }

  // 18. SMART PACKING LIST
  if (
    lower.includes('packing') ||
    lower.includes('pack') ||
    lower.includes('saman') ||
    lower.includes('bag')
  ) {
    return {
      intent: 'ADD_PACKING',
      summary: 'Opened Smart Packing Checklist',
      spokenResponse: 'Smart packing checklist khol di hai. Sabhi zaroori dawaaiyan aur essentials list mein hain.',
      actionExecuted: 'NAVIGATE_TAB',
      navigation: { tab: 'vault', subTab: 'passes' },
      cardType: 'ticket',
      quickReplies: ['Add Umbrella', 'Check Dadaji BP Meds', 'Show Itinerary'],
    };
  }

  // 19. HELP & CAPABILITIES
  if (
    lower.includes('help') ||
    lower.includes('what can you do') ||
    lower.includes('kya kar sakte ho') ||
    lower.includes('commands') ||
    lower.includes('madad') ||
    lower.includes('features')
  ) {
    return {
      intent: 'HELP',
      summary: 'Sahayak AI Capabilities & Commands',
      spokenResponse: 'Main aapka smart travel assistant hu. Boliye: "Switch to Dadaji", "Fix overlaps", "Baarish indoor swap", "Add 500 taxi expense", ya "Who pays next".',
      actionExecuted: 'STANDBY_ACK',
      quickReplies: ['Switch to Dadaji', 'Fix Overlaps', 'Swap Indoor', 'Who Pays Next?'],
    };
  }

  // 20. INFORMATIONAL FOOD, LUNCH & DIETARY QUERY (when not logging expense)
  if (
    !moneyMatch &&
    (norm.includes('lunch') ||
      norm.includes('dinner') ||
      norm.includes('food') ||
      norm.includes('khana') ||
      norm.includes('jain') ||
      norm.includes('restaurant') ||
      norm.includes('menu') ||
      norm.includes('thali') ||
      norm.includes('dietary'))
  ) {
    return {
      intent: 'QUERY_DINING',
      summary: 'Dining: Surya Mahal Royal Thali (Jain & Low-Sodium Certified)',
      spokenResponse:
        "Today's lunch is at Surya Mahal Dining Room at 13:00 with a certified Jain kitchen for Priya, and mild low-sodium thali for Dadaji. Tonight's dinner is at Chokhi Dhani at 19:30.",
      navigation: { tab: 'timeline' },
      cardType: 'schedule',
      cardData: {
        venue: 'Surya Mahal Dining Room',
        time: '13:00 - 14:30',
        dietary: 'Certified Jain & Low-Sodium Vegetarian',
      },
      quickReplies: ['What is the next stop?', 'Check Dadaji mobility', 'Who pays next?'],
    };
  }

  // 21. INFORMATIONAL MOBILITY & DADAJI COMFORT QUERY
  if (
    norm.includes('mobility') ||
    norm.includes('wheelchair') ||
    norm.includes('golf cart') ||
    norm.includes('stair') ||
    norm.includes('climb') ||
    norm.includes('knee') ||
    (norm.includes('dadaji') && (norm.includes('walk') || norm.includes('reach') || norm.includes('room') || norm.includes('hotel')))
  ) {
    return {
      intent: 'QUERY_MOBILITY',
      summary: "Dadaji Mobility: Suite 104 Zero Stairs & Amber Fort Golf Cart Pre-Booked",
      spokenResponse:
        "Dadaji's comfort accommodations are fully verified. Suite 104 at Rambagh Palace has zero stairs. For Amber Fort tomorrow, an electric golf cart and wheelchair escort are pre-booked straight to the palace hall, bypassing 140 stone steps.",
      navigation: { tab: 'timeline' },
      cardType: 'health',
      quickReplies: ["Check Dadaji's Meds", 'Show Timeline', 'Who Pays Next?'],
    };
  }

  // 22. INFORMATIONAL HOTEL & STAY QUERY
  if (
    norm.includes('hotel') ||
    norm.includes('rambagh') ||
    norm.includes('stay') ||
    norm.includes('suite') ||
    norm.includes('checkin') ||
    norm.includes('check-in')
  ) {
    return {
      intent: 'QUERY_HOTEL',
      summary: 'Rambagh Palace Heritage Suites (Check-in 11:30)',
      spokenResponse:
        'We are staying at Rambagh Palace Heritage Suites on Bhawani Singh Road. Ground-floor Suite 104 is reserved for Dadaji with step-free entrance and walk-in shower.',
      navigation: { tab: 'vault', subTab: 'passes' },
      quickReplies: ['What is next stop?', 'Show hotel voucher', 'Check weather'],
    };
  }

  // 23. EXPLICIT SCHEDULE & NEXT ACTIVITY QUERY (Always picks next upcoming activity, NEVER landed flight)
  if (isPlanQuery) {
    const nextItem = getNextUpcomingStop(ctx.itinerary);

    return {
      intent: 'QUERY_SCHEDULE',
      summary: `Next Event: ${nextItem.title} at ${nextItem.time}`,
      spokenResponse: `Next scheduled activity is "${nextItem.title}" at ${nextItem.time} at ${nextItem.location}. All transportation and dietary requirements are pre-vetted.`,
      navigation: { tab: 'timeline' },
      cardType: 'schedule',
      cardData: {
        title: nextItem.title,
        time: nextItem.time,
        location: nextItem.location,
        walkingMeters: nextItem.walkingDistanceMeters || 50,
      },
      quickReplies: [
        'Add ₹800 Taxi Expense',
        "Check Dadaji's Meds",
        'Incur Rest Buffer',
        'Show Boarding Pass QR',
      ],
    };
  }

  // 24. CONVERSATIONAL ASSISTANT & UNRECOGNIZED INPUT FALLBACK (No loop, no repeating schedule)
  if (clean.length > 3) {
    const comp = generateCompanionResponse(rawInput, {
      currentUser: ctx.currentUser,
      itinerary: ctx.itinerary,
      polls: ctx.polls,
      expenses: ctx.expenses,
      travelStatus: ctx.travelStatus,
      documents: ctx.documents,
      allUsers: ctx.users,
    });

    if (comp && comp.text && !comp.text.includes('Flight AI-481')) {
      const firstSentence = comp.text.split('\n')[0].slice(0, 220);
      return {
        intent: 'ASSISTANT_QUERY',
        summary: clean.slice(0, 35),
        spokenResponse: firstSentence,
        actionExecuted: 'NO_OP',
        quickReplies: comp.quickReplies || ['Show Timeline', 'How is the weather?', 'Who Pays Next?'],
      };
    }
  }

  return {
    intent: 'UNKNOWN',
    summary: clean ? `Command: "${clean.slice(0, 30)}"` : 'Listening...',
    spokenResponse: clean.length > 3
      ? `Maaf kijiye, samajh nahi paya. Try: "Switch to Dadaji", "Fix overlaps", ya "Show itinerary".`
      : '',
    actionExecuted: 'NO_OP',
    quickReplies: ['Switch to Dadaji', 'Fix Overlaps', 'Swap Indoor', 'Show Timeline'],
  };
}

export interface JarvisExecutionResult {
  command: string;
  latencyMs: number;
  tools: string[];
  summary: string;
  intents: any[];
}

export function analyzeJarvisCommand(rawPrompt: string, activeDay = 1): JarvisExecutionResult {
  const { runEdgeSlmNlu } = require('../slm/edgeSlmEngine');
  const slm = runEdgeSlmNlu(rawPrompt, { activeDay });
  return {
    command: rawPrompt,
    latencyMs: slm.latencyMs,
    tools: slm.intents.map((i: any) => i.type),
    summary: `Jarvis parsed ${slm.intents.length} autonomous tool action(s).`,
    intents: slm.intents,
  };
}

