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
 * In-House Travel JARVIS Brain.
 * Zero external LLMs. 100% offline, deterministic & heuristic NLP parser.
 * Runs in <15ms, extracts intents & slots, and executes every feature of the website.
 */
export function processJarvisVoiceCommand(
  rawInput: string,
  ctx: JarvisContext
): JarvisActionResult {
  // Strip wake words (e.g. "Hey Jarvis", "Jarvis", "Ok Jarvis", "Sahyatri")
  let clean = rawInput.trim();
  const wakeWordMatch = clean.match(
    /^(?:hey\s+jarvis|jarvis|ok\s+jarvis|hello\s+jarvis|sahyatri)[,\s:]*/i
  );
  if (wakeWordMatch) {
    clean = clean.slice(wakeWordMatch[0].length).trim();
  }

  const lower = (clean || rawInput.trim()).toLowerCase();

  // If user just spoke the wake word
  if (!clean || lower === 'jarvis' || lower === 'hey jarvis') {
    return {
      intent: 'UNKNOWN',
      summary: 'JARVIS Standby & Listening',
      spokenResponse: `At your service, ${ctx.currentUser.name.split(' ')[0]}. Standing by for your travel command.`,
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
  if (
    lower.includes('switch') ||
    lower.includes('login') ||
    lower.includes('dadaji') ||
    lower.includes('kabir') ||
    lower.includes('priya') ||
    lower.includes('rohan') ||
    lower.includes('elderly') ||
    lower.includes('kid')
  ) {
    let targetUser = ctx.currentUser;
    if (lower.includes('dadaji') || lower.includes('elderly')) {
      targetUser = ctx.users.find((u) => u.id === 'dadaji') || targetUser;
    } else if (lower.includes('kabir') || lower.includes('kid')) {
      targetUser = ctx.users.find((u) => u.id === 'kabir') || targetUser;
    } else if (lower.includes('priya') || lower.includes('jain')) {
      targetUser = ctx.users.find((u) => u.id === 'priya') || targetUser;
    } else if (lower.includes('rohan') || lower.includes('planner')) {
      targetUser = ctx.users.find((u) => u.id === 'rohan') || targetUser;
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

  // 13. CONFLICT RESOLUTION
  if (
    lower.includes('conflict') ||
    lower.includes('fix') ||
    lower.includes('ramp') ||
    lower.includes('golf cart') ||
    lower.includes('stair')
  ) {
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

  // 14. GENERAL ITINERARY & SCHEDULE QUERY
  const nextItem = ctx.itinerary[0] || {
    title: 'Surya Mahal Royal Rajasthani Lunch',
    time: '13:00',
    location: 'City Palace Precinct',
  };

  return {
    intent: 'QUERY_SCHEDULE',
    summary: `Next Event: ${nextItem.title} at ${nextItem.time}`,
    spokenResponse: `At your service. Next scheduled activity is "${nextItem.title}" at ${nextItem.time} at ${nextItem.location}. All transportation and dietary requirements are pre-vetted.`,
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
