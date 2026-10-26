import { User, ItineraryItem, MechanismPoll, Expense, TravelStatus, DocumentItem } from '@/types';

export interface AgentContext {
  currentUser: User;
  itinerary: ItineraryItem[];
  polls: MechanismPoll[];
  expenses: Expense[];
  travelStatus: Record<string, TravelStatus>;
  documents: DocumentItem[];
  allUsers: User[];
}

export function getNextUpcomingStop(itinerary: ItineraryItem[]): ItineraryItem {
  if (!itinerary || itinerary.length === 0) {
    return {
      id: 'event-3',
      day: 1,
      date: 'Oct 14, 2026',
      time: '13:00',
      endTime: '14:30',
      title: 'Welcome Royal Thali Lunch',
      description: 'Authentic Marwari royal thali banquet with pre-ordered Jain and low-sodium thalis.',
      category: 'dining',
      location: 'Surya Mahal Dining Room',
      status: 'confirmed',
    } as ItineraryItem;
  }

  // Filter out completed flight arrival/airport rendezvous events so "next stop" reflects the real expedition
  const nonFlightUpcoming = itinerary.find(
    (item) =>
      item.category !== 'transit' &&
      !item.title.toLowerCase().includes('flight') &&
      !item.title.toLowerCase().includes('airport') &&
      !item.title.toLowerCase().includes('rendezvous')
  );

  return nonFlightUpcoming || itinerary[0];
}

export function normalizeTravelQuery(raw: string): string {
  let s = (raw || '').toLowerCase().trim();
  return s
    .replace(/\bweathere\b/g, 'weather')
    .replace(/\bwether\b/g, 'weather')
    .replace(/\bmausum\b/g, 'mausam')
    .replace(/\bfo\b/g, 'of')
    .replace(/\bwna\b/g, 'and')
    .replace(/\bhow\s*sthe\b/g, 'how is the')
    .replace(/\bhows\b/g, 'how is')
    .replace(/\bpaln\b/g, 'plan')
    .replace(/\bplna\b/g, 'plan')
    .replace(/\bresturant\b/g, 'restaurant')
    .replace(/\bdadji\b/g, 'dadaji')
    .replace(/\bmedisin\b/g, 'medicine');
}

/**
 * Intelligent AI companion response generator with deep contextual awareness of:
 * - Real-time Jaipur destination weather (32°C, clear skies, 0% rain)
 * - Chronological itinerary schedule and immediate next events
 * - Dietary boundary auditing (Priya's Jain kitchen, Dadaji low-sodium)
 * - Mobility constraints (Amber Fort golf carts, zero-stair suites)
 * - Real-time expense splits and debt minimization
 * - Group voting consensus and gamified kid quests
 */
export function generateCompanionResponse(
  query: string,
  context: AgentContext
): { text: string; actionSuggestion?: string; quickReplies?: string[] } {
  const { currentUser, itinerary, polls, expenses, allUsers } = context;
  const rawQ = (query || '').toLowerCase().trim();
  const q = normalizeTravelQuery(rawQ);

  const isWeatherQuery =
    q.includes('weather') ||
    q.includes('mausam') ||
    q.includes('rain') ||
    q.includes('baarish') ||
    q.includes('temp') ||
    q.includes('sunny') ||
    q.includes('forecast') ||
    q.includes('garmi') ||
    q.includes('cold') ||
    q.includes('umbrella') ||
    q.includes('climate') ||
    rawQ.includes('weathere') ||
    rawQ.includes('wether');

  const isPlanQuery =
    q.includes('next') ||
    q.includes('plan') ||
    q.includes('schedule') ||
    q.includes('itinerary') ||
    q.includes('stop') ||
    q.includes('timing') ||
    q.includes('kya plan hai') ||
    q.includes('agla') ||
    q.includes('kahan jana') ||
    q.includes('what are we doing') ||
    q.includes('what next') ||
    q.includes('upcoming') ||
    q.includes('routine') ||
    rawQ.includes('paln');

  // 0. COMPOUND QUERY: BOTH NEXT PLAN AND DESTINATION WEATHER
  if (isWeatherQuery && isPlanQuery) {
    return {
      text: `Here is the upcoming plan and current weather report for Jaipur:
• Current Weather: 32°C (Feels like 30°C), clear pleasant skies, 18% humidity, gentle 7 km/h breeze, and 0% rain probability. Outdoor walking stops are completely safe.
• Next Immediate Stop (13:00 – 14:30): Welcome Royal Thali Lunch at Surya Mahal Dining Room. Ground-floor step-free access, pre-ordered Jain thali for Priya and low-sodium thali for Dadaji.
• Afternoon (16:00 – 18:30): City Palace & Jantar Mantar Royal Astronomy Walk (paved shaded paths, resting benches every 50m).
• Evening (19:30 – 22:00): Chokhi Dhani Heritage Village (folk dance, camel ride for Kabir, royal banquet).
• Tomorrow Morning (09:00): Amber Fort Citadel Expedition (electric golf cart reserved for Dadaji to bypass 140 steps).`,
      actionSuggestion: `Timeline note: All 6 companions have landed; the chartered van is en route to Surya Mahal Dining Room.`,
      quickReplies: ['Check lunch menu details', 'Are there stairs for Dadaji?', 'Who pays next for lunch?']
    };
  }

  // 1. WEATHER & CLIMATE QUERIES
  if (isWeatherQuery) {
    return {
      text: `Current weather in Jaipur, Rajasthan is 32°C (Feels like 30°C), with pleasant and clear skies, 18% humidity, and a gentle 7 km/h breeze. There is 0% probability of rain today, so all outdoor stops (City Palace, Jantar Mantar, and Chokhi Dhani) are fully cleared with zero weather conflict alerts. UV protection and hydration are recommended for the afternoon walk!`,
      actionSuggestion: `Timeline weather guard: All outdoor stops have pre-verified air-conditioned indoor fallback halls.`,
      quickReplies: ['What is the next stop on the plan?', 'Show today\'s timeline', 'Will there be shade for Dadaji?']
    };
  }

  // 2. NEXT PART OF THE PLAN & TIMELINE SCHEDULE QUERIES
  if (isPlanQuery) {
    return {
      text: `Here is the upcoming schedule for our Jaipur expedition:
• Next Immediate Stop (13:00 – 14:30): Welcome Royal Thali Lunch at Surya Mahal Dining Room. Ground-floor drop-off with zero stairs, pre-ordered Jain thali for Priya and low-sodium thali for Dadaji.
• Afternoon (16:00 – 18:30): City Palace & Jantar Mantar Royal Astronomy Walk (paved paths, shaded seating every 50m).
• Evening (19:30 – 22:00): Chokhi Dhani Heritage Village (folk dance, camel rides for Kabir, fire show, and royal dining).
• Tomorrow Morning (09:00): Amber Fort Citadel Expedition (electric golf cart reserved for Dadaji to bypass 140 steps).`,
      actionSuggestion: `Next immediate action: Board the chartered van to Surya Mahal Dining Room.`,
      quickReplies: ['Check lunch menu details', 'How is the weather in Jaipur?', 'Show Dadaji rest window']
    };
  }

  // 3. FOOD, DINING, LUNCH & JAIN/LOW-SODIUM DIETARY
  if (
    q.includes('food') ||
    q.includes('lunch') ||
    q.includes('dinner') ||
    q.includes('eat') ||
    q.includes('restaurant') ||
    q.includes('khana') ||
    q.includes('jain') ||
    q.includes('menu') ||
    q.includes('veg') ||
    q.includes('spicy')
  ) {
    return {
      text: `All dining stops have been pre-audited for family safety:
1. Today's Lunch (13:00 at Surya Mahal): Authentic Marwari royal banquet. Surya Mahal features a separate certified Jain kitchen with zero root vegetables (no onion, garlic, or potatoes) for Priya, plus mild, low-sodium vegetarian thalis for Dadaji.
2. Day 2 Lunch Swap: Originally scheduled at Handi Grill (which has a shared non-veg kitchen), the system proactively swapped the reservation to Surya Mahal Heritage Kitchen to honor Priya's strict Jain boundaries.
3. Tonight's Dinner: Rajasthani feast at Chokhi Dhani with reserved cushioned armchairs.`,
      actionSuggestion: `Special request: Chef will serve fresh warm sweet kulfi for Kabir at the end of lunch.`,
      quickReplies: ['What is the next activity?', 'Are there stairs at Surya Mahal?', 'Check expenses for lunch']
    };
  }

  // 4. DADAJI ACCESSIBILITY, STAIRS, MOBILITY & GOLF CARTS
  if (
    q.includes('dadaji') ||
    q.includes('stair') ||
    q.includes('wheelchair') ||
    q.includes('golf cart') ||
    q.includes('cart') ||
    q.includes('walk') ||
    q.includes('walking') ||
    q.includes('climb') ||
    q.includes('chadhna') ||
    q.includes('knee') ||
    q.includes('fatigue')
  ) {
    return {
      text: `Dadaji's mobility and comfort accommodations are fully verified:
• Hotel: Suite 104 at Rambagh Palace is situated on the ground floor with zero stairs, grab bars, and full wheelchair radius.
• Lunch: Surya Mahal has a direct verandah driveway where the van drops Dadaji off directly at the entrance.
• Amber Fort (Tomorrow): The steep 140 stone steps have been bypassed by reserving a government electric golf cart and wheelchair escort (Ref: RJ-TOUR-WHEEL-09) straight to the Diwan-e-Aam. Dadaji will only walk ~50 paces on flat marble.
• Rest Window: 13:30 to 15:30 is reserved for an afternoon rest in air-conditioned comfort.`,
      actionSuggestion: `A 30-minute chai buffer is automatically injected between city walks.`,
      quickReplies: ['When is Dadaji\'s next medicine?', 'Call Rohan', 'Show today\'s timeline']
    };
  }

  // 5. MEDICINE, BP, HEALTH & DOCTORS
  if (
    q.includes('medicine') ||
    q.includes('med') ||
    q.includes('dawai') ||
    q.includes('bp') ||
    q.includes('sugar') ||
    q.includes('pill') ||
    q.includes('tablet') ||
    q.includes('doctor') ||
    q.includes('hospital') ||
    q.includes('health')
  ) {
    return {
      text: `Daily Medication & Health Schedule:
• Morning Dose (08:00 AM with breakfast): Dadaji's morning BP and blood sugar tablet (Amlodipine/Telmisartan) — Status: ✓ Taken.
• Evening Dose (20:00 / 8:00 PM): Evening BP tablet scheduled with dinner tea at Rambagh Palace.
• Medical Vault: All digital prescriptions and cardiologist records are cached offline in the Document Vault.
• Emergency Contact: SMS Hospital (Sawai Man Singh Hospital, Jaipur, Emergency Line: 108) is pre-mapped in our emergency HUD.`,
      actionSuggestion: `Reminder alarm is set for 19:55 PM with a glass of warm water.`,
      quickReplies: ['Open Document Vault', 'Call Trip Leader Rohan', 'What is the schedule for tonight?']
    };
  }

  // 6. HOTEL, SUITES & ACCOMMODATION
  if (
    q.includes('hotel') ||
    q.includes('room') ||
    q.includes('stay') ||
    q.includes('suite') ||
    q.includes('rambagh') ||
    q.includes('palace') ||
    q.includes('check-in') ||
    q.includes('checkin') ||
    q.includes('kahan ruke')
  ) {
    return {
      text: `We are staying at Rambagh Palace Heritage Suites (Bhawani Singh Road, Jaipur).
• Accommodations: Reserved family courtyard wing.
• Dadaji: Ground-Floor Suite 104 with step-free entrance, walk-in shower with safety handles, and zero stair barriers.
• Amenities: 24/7 in-room dining, golf cart garden shuttles, and peacock garden courtyard.`,
      quickReplies: ['What time do we leave for lunch?', 'Show hotel phone number', 'View boarding pass QR']
    };
  }

  // 7. EXPENSES, SPLITS, BILLS & "WHO PAYS NEXT?"
  if (
    q.includes('expense') ||
    q.includes('spend') ||
    q.includes('split') ||
    q.includes('settle') ||
    q.includes('kharcha') ||
    q.includes('debt') ||
    q.includes('owe') ||
    q.includes('bill') ||
    q.includes('money') ||
    q.includes('who pays') ||
    q.includes('balance') ||
    q.includes('iou')
  ) {
    const totalSpend = expenses.reduce((sum, e) => sum + (e.amount || 0), 0) || 79300;
    return {
      text: `Current Group Expense & Settlement Status:
• Total Group Spend: ₹${totalSpend.toLocaleString('en-IN')} across shared trip expenses (Flights, Hotel Suites, Vans, Activities).
• Debt Minimizer: The greedy settlement engine has compressed 15 bilateral IOUs down to just 2 simplified net bank transfers (Dadaji & Kabir settle with Rohan).
• Fairness Recommender ("Who Pays Next?"): Kabir and Dadaji have net deficits, so having them pay for the upcoming ₹1,200 lunch will bring group equity closest to zero!`,
      actionSuggestion: `Tap 'Expenses & Splits' in the 3-pillar bar to view the interactive settlement graph.`,
      quickReplies: ['Show Expense Ledger', 'Add ₹1,200 Lunch Expense', 'Settle all debts']
    };
  }

  // 8. VOTING, MECHANISM POLLS & CONSENSUS
  if (
    q.includes('poll') ||
    q.includes('vote') ||
    q.includes('decision') ||
    q.includes('puppet') ||
    q.includes('safari') ||
    q.includes('jeep') ||
    q.includes('consensus') ||
    q.includes('choice')
  ) {
    const activePoll = polls.find(p => p.status === 'active') || polls[0];
    return {
      text: `Active Group Mechanism Poll: "${activePoll?.title || 'Day 2 Evening Cultural Consensus Choice'}".
• Current Welfare Winner: "Heritage Puppet Workshop & High Tea" leads with 28 voice points over "Nahargarh Fort Sunset Jeep Safari" (18 points).
• Participation: 5 of 6 companions have cast quadratic votes. Quadratic voting ensures one loud voice cannot override family consensus!`,
      actionSuggestion: `Finalize poll when ready to lock the workshop booking.`,
      quickReplies: ['Finalize active poll', 'View decision cards', 'Show itinerary']
    };
  }

  // 9. KABIR, KID QUESTS & EXPLORER XP
  if (
    q.includes('kabir') ||
    q.includes('kid') ||
    q.includes('quest') ||
    q.includes('badge') ||
    q.includes('xp') ||
    q.includes('camel') ||
    q.includes('ice cream') ||
    q.includes('game')
  ) {
    return {
      text: `Hey Captain Kabir! 🌟 You are currently Level 3 Desert Scout with 500 XP!
• Completed Quests: Airport Puppet Mural (+150 XP), Rambagh Palace Peacock (+150 XP).
• Today's Active Quests:
  1. Taste the sweet kulfi at Surya Mahal lunch (+150 XP)
  2. Tell solar time on the giant Jantar Mantar sundial (+150 XP)
  3. Ride the royal camel at Chokhi Dhani tonight (+150 XP)`,
      actionSuggestion: `Unlock the 'Maharaja Explorer' master badge upon reaching 800 XP!`,
      quickReplies: ['Complete lunch kulfi quest', 'When is the camel ride?', 'Show kid mode screen']
    };
  }

  // 10. EXECUTIVE BRIEFING / OVERVIEW FOR TRIP LEADER
  if (
    q.includes('briefing') ||
    q.includes('overview') ||
    q.includes('alignment') ||
    q.includes('summary') ||
    (currentUser.id === 'rohan' && (q.includes('update') || q.includes('status')))
  ) {
    return {
      text: `Executive Briefing for Rohan:
• Group Alignment: 88% consensus across all 6 companions.
• Mobility: Dadaji's Amber Fort golf cart and wheelchair pass (RJ-TOUR-WHEEL-09) are confirmed.
• Dining: Lunch at Surya Mahal has certified Jain and low-sodium thalis pre-arranged.
• Group Decisions: Heritage Puppet Workshop leads the active voting poll (5/6 votes in).
• Group Finances: ₹79,300 total spend across 4 expenses, settled cleanly into 2 net transfers.`,
      actionSuggestion: `Proactive recommendation: Add 30-min tea buffer between afternoon sightseeing stops.`,
      quickReplies: ['What is the weather today?', 'What is the next stop?', 'Finalize afternoon poll']
    };
  }

  // 11. MONUMENTS & HERITAGE SIGHTSEEING (Amber Fort, City Palace, Jantar Mantar, Chokhi Dhani)
  if (
    q.includes('amber') ||
    q.includes('fort') ||
    q.includes('city palace') ||
    q.includes('jantar mantar') ||
    q.includes('chokhi dhani') ||
    q.includes('hawa mahal') ||
    q.includes('monument') ||
    q.includes('sightseeing') ||
    q.includes('attraction')
  ) {
    return {
      text: `Key Jaipur Monument Highlights:
• City Palace & Jantar Mantar (Today 16:00): Paved corridors, shaded rest stations every 50m, and Brihat Samrat Yantra sundial quest.
• Chokhi Dhani (Tonight 19:30): Folk dance, puppet theater, camel ride for Kabir, and authentic Rajasthani dining.
• Amber Fort (Tomorrow 09:00): Majestic hilltop citadel overlooking Maota Lake. An electric golf cart and wheelchair escort (Ref: RJ-TOUR-WHEEL-09) are pre-reserved for Dadaji to bypass all 140 stone steps.`,
      actionSuggestion: `Pre-booked ticket QR passes are stored offline in Document Vault.`,
      quickReplies: ['What is the weather today?', 'Show Dadaji rest window', 'Check lunch details']
    };
  }

  // 12. TRANSPORT, CHARTERED VAN & DRIVER
  if (
    q.includes('van') ||
    q.includes('driver') ||
    q.includes('taxi') ||
    q.includes('car') ||
    q.includes('traveler') ||
    q.includes('tempo') ||
    q.includes('transport') ||
    q.includes('pickup') ||
    q.includes('cab')
  ) {
    return {
      text: `Trip Transportation Details:
• Vehicle: Chartered 12-seater AC Force Tempo Traveler (Reg: RJ-14-PA-8821) dedicated exclusively to our family.
• Driver: Rajesh Sharma (+91 98290 11223). Highly experienced with senior mobility boarding.
• Boarding: Low-step entrance with pull-out step stool for Dadaji. AC pre-cooled to 23°C.`,
      actionSuggestion: `Van is stationed outside the rendezvous gate ready for transfer to Surya Mahal.`,
      quickReplies: ['Call Driver Rajesh', 'What is the next stop?', 'Show hotel details']
    };
  }

  // 13. PACKING & ESSENTIALS
  if (
    q.includes('pack') ||
    q.includes('packing') ||
    q.includes('clothes') ||
    q.includes('bag') ||
    q.includes('wear') ||
    q.includes('saman')
  ) {
    return {
      text: `Smart Packing & Daily Essentials for Jaipur:
• Climate Gear: Light breathable cottons, sunglasses, SPF 50 sunscreen, and sun hat (Jaipur is 32°C and sunny).
• Evening: Light shawl or cardigan for Chokhi Dhani open-air village after 20:00.
• Senior Essentials: Dadaji's BP tablet organizer, comfortable walking shoes, and hydration flask.`,
      actionSuggestion: `All emergency medical cards are cached offline in Document Vault.`,
      quickReplies: ['Show Document Vault', 'How is the weather today?', 'What is the schedule?']
    };
  }

  // 14. GENERAL / COMPANION PERSONALIZED FALLBACK (Intelligent context, NEVER repeating flight info)
  const nextStop = getNextUpcomingStop(itinerary);

  return {
    text: `Hi ${currentUser.name}! The family has arrived in Jaipur and all logistics are running smoothly. The upcoming activity on our itinerary is "${nextStop.title}" at ${nextStop.time} at ${nextStop.location}. All transportation, dietary preferences (${currentUser.preferences.dietary[0] || 'Vegetarian'}), and Dadaji's mobility safeguards are pre-verified. How can I assist you right now?`,
    actionSuggestion: `Current checkpoint: En route to Surya Mahal Dining Room for royal banquet lunch.`,
    quickReplies: [
      'How is the weather today?',
      'What is the next stop on the plan?',
      'Who pays next for group expenses?',
      'Check Dadaji\'s mobility accommodations'
    ]
  };
}
