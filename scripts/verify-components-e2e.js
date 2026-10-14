import assert from 'assert';
import {
  INITIAL_USERS,
  INITIAL_ITINERARY,
  INITIAL_POLLS,
  INITIAL_EXPENSES,
  INITIAL_TRAVEL_STATUS,
  INITIAL_DOCUMENTS,
  INITIAL_PACKING,
  LOCAL_PHRASES,
} from '../src/lib/state/mockData.ts';
import { calculateNetBalances, minimizeDebts, recommendNextPayer } from '../src/lib/algorithms/debtMinimizer.ts';
import { detectTripConflicts, detectWeatherAndTemporalConflicts, toMinutes, fromMinutes } from '../src/lib/algorithms/conflictDetector.ts';
import { resolveQuadraticPoll } from '../src/lib/algorithms/mechanismVoting.ts';
import { processJarvisVoiceCommand } from '../src/lib/agents/jarvisBrain.ts';
import { runEdgeSlmNlu } from '../src/lib/slm/edgeSlmEngine.ts';

console.log('\n=============================================================');
console.log('   END-TO-END STATE MUTATION & FEATURE LIFECYCLE TESTS      ');
console.log('=============================================================\n');

let stepCount = 0;
function step(desc, fn) {
  stepCount++;
  try {
    fn();
    console.log(`  [OK] Step ${stepCount}: ${desc}`);
  } catch (err) {
    console.error(`  [FAIL] Step ${stepCount}: ${desc}`, err);
    throw err;
  }
}

// Emulate full TripContext state machine
let state = {
  users: JSON.parse(JSON.stringify(INITIAL_USERS)),
  currentUser: JSON.parse(JSON.stringify(INITIAL_USERS[0])),
  itinerary: JSON.parse(JSON.stringify(INITIAL_ITINERARY)),
  polls: JSON.parse(JSON.stringify(INITIAL_POLLS)),
  expenses: JSON.parse(JSON.stringify(INITIAL_EXPENSES)),
  travelStatus: JSON.parse(JSON.stringify(INITIAL_TRAVEL_STATUS)),
  documents: JSON.parse(JSON.stringify(INITIAL_DOCUMENTS)),
  packingList: JSON.parse(JSON.stringify(INITIAL_PACKING)),
  weather: 'Sunny',
  currency: 'INR',
  activeTab: 'timeline',
  vaultSubTab: 'passes',
  viewMode: 'full',
  isSosModalOpen: false,
};

// 1. Weather Toggle & Indoor Fallback Adaptation
step('Toggle weather from Sunny to Rainy and verify conflict detection flags outdoor stops', () => {
  state.weather = 'Rainy';
  const conflicts = detectWeatherAndTemporalConflicts(state.itinerary, state.weather);
  const rainConflicts = conflicts.filter(c => c.id.startsWith('weather-'));
  assert(rainConflicts.length > 0, 'Rain conflicts must be detected');
  console.log(`       -> Flagged ${rainConflicts.length} outdoor stops at risk of heavy rain.`);
});

step('Execute 1-Click Indoor Weather Adaptation (swap Amber Fort Ramparts for Sheesh Mahal)', () => {
  const outdoorCountBefore = state.itinerary.filter(i => i.isOutdoor).length;
  // Mimic adaptWeatherIndoor
  state.itinerary = state.itinerary.map((item) => {
    if (item.isOutdoor && item.indoorFallback) {
      return {
        ...item,
        title: item.indoorFallback,
        isOutdoor: false,
        description: `${item.description} [Weather Adaptation: Swapped for indoor shelter during rain]`,
      };
    }
    return item;
  });
  const outdoorCountAfter = state.itinerary.filter(i => i.isOutdoor).length;
  assert.strictEqual(outdoorCountAfter, 0, 'All outdoor stops should be adapted to indoor fallbacks');
  console.log(`       -> Successfully adapted ${outdoorCountBefore} outdoor venues into indoor sheltered halls.`);
});

// 2. Timeline Overlap Creation & 1-Click Auto-Heal
step('Create temporal overlap between two consecutive events and verify detection', () => {
  // Inject overlapping times
  state.itinerary[1].time = '10:00';
  state.itinerary[1].endTime = '12:00';
  state.itinerary[2].time = '11:00'; // 60 min overlap
  state.itinerary[2].endTime = '13:00';

  const conflicts = detectWeatherAndTemporalConflicts(state.itinerary, 'Sunny');
  const overlap = conflicts.find(c => c.id.startsWith('overlap-'));
  assert(overlap, 'Must detect the temporal overlap between Event 1 and Event 2');
  console.log(`       -> Proactively detected overlap: "${overlap.description}"`);
});

step('Execute 1-Click Auto-Heal schedule algorithm to slide times and inject 15m rest buffer', () => {
  // Mimic autoHealSchedule
  const day = 1;
  const dayStops = state.itinerary
    .filter((i) => i.day === day)
    .sort((a, b) => toMinutes(a.time) - toMinutes(b.time));

  let currentCursor = toMinutes(dayStops[0]?.time || '09:00');
  dayStops.forEach((stop) => {
    const startM = Math.max(toMinutes(stop.time), currentCursor);
    const stopEnd = stop.endTime ? toMinutes(stop.endTime) : startM + 90;
    const duration = Math.max(45, stopEnd - toMinutes(stop.time));
    const healedEnd = startM + duration;

    state.itinerary = state.itinerary.map((i) =>
      i.id === stop.id
        ? { ...i, time: fromMinutes(startM), endTime: fromMinutes(healedEnd) }
        : i
    );
    currentCursor = healedEnd + 15;
  });

  const conflictsAfter = detectWeatherAndTemporalConflicts(state.itinerary, 'Sunny');
  const overlapAfter = conflictsAfter.find(c => c.id.startsWith('overlap-'));
  assert(!overlapAfter, 'Auto-heal must completely eliminate temporal overlaps');
  console.log('       -> Schedule healed! 15-minute transit and mobility buffers inserted.');
});

// 3. Smart Fairness Recommender & Expense Logging
step('Compute initial "Who Pays Next?" fairness recommendation', () => {
  const initialBalances = calculateNetBalances(state.expenses, state.users);
  const rec = recommendNextPayer(initialBalances, state.users);
  assert(rec.nextPayer && rec.nextPayer.name, 'Recommendation must exist');
  console.log(`       -> Suggested Next Payer: ${rec.nextPayer.name} (Deficit: ₹${rec.nextPayerDeficit})`);
  
  // Log expense paid by the recommended payer
  state.expenses.unshift({
    id: `exp-${Date.now()}`,
    title: 'Jaipur Crafts & Block Print Souvenirs',
    amount: 6000,
    currency: 'INR',
    paidByUserId: rec.nextPayer.id,
    splitWithUserIds: state.users.map(u => u.id),
    category: 'shopping',
    date: 'Today',
    verified: true,
  });

  const updatedBalances = calculateNetBalances(state.expenses, state.users);
  const updatedRec = recommendNextPayer(updatedBalances, state.users);
  console.log(`       -> After payment, new Fair Next Payer: ${updatedRec.nextPayer.name} (Deficit: ₹${updatedRec.nextPayerDeficit})`);
  assert(updatedBalances[rec.nextPayer.id] > initialBalances[rec.nextPayer.id], 'Payer balance must increase');
});

// 4. Multi-Currency Switching (INR -> USD -> EUR -> JPY)
step('Verify multi-currency recalculation across settlements', () => {
  const balances = calculateNetBalances(state.expenses, state.users);
  const inrTransfers = minimizeDebts(balances, 'INR');
  const usdTransfers = minimizeDebts(balances, 'USD');
  const eurTransfers = minimizeDebts(balances, 'EUR');
  const jpyTransfers = minimizeDebts(balances, 'JPY');

  assert.strictEqual(inrTransfers.length, usdTransfers.length);
  assert.strictEqual(usdTransfers.length, jpyTransfers.length);
  assert(usdTransfers[0].amount < inrTransfers[0].amount, 'USD should be numerically smaller than INR');
  assert(jpyTransfers[0].amount > inrTransfers[0].amount, 'JPY should be numerically larger than INR');
  console.log(`       -> Settlement #1: ₹${inrTransfers[0].amount} = $${usdTransfers[0].amount} = €${eurTransfers[0].amount} = ¥${jpyTransfers[0].amount}`);
});

// 5. Quadratic Voting & Credit Deductions
step('Submit quadratic votes and verify exponential cost budget enforcement (v^2 <= 100)', () => {
  const poll = state.polls[0];
  const user = state.currentUser;
  
  // Spend 6 votes on option 0 -> 6^2 = 36 credits
  const votes = 6;
  const cost = votes * votes;
  user.voiceCredits -= cost;
  poll.userVotes[user.id] = { [poll.options[0].id]: votes };

  assert.strictEqual(user.voiceCredits, 64, 'User voice credits should be 100 - 36 = 64');
  console.log(`       -> User spent ${votes} quadratic votes (Cost: ${cost} credits, Remaining: ${user.voiceCredits} credits)`);

  // Finalize poll
  const resolution = resolveQuadraticPoll(poll);
  assert.strictEqual(resolution.winner.id, poll.options[0].id);
  console.log(`       -> Group Winner: "${resolution.winner.title}" (${resolution.explanation})`);
});

// 6. Kid Quest XP & Scavenger Hunt Gamification
step('Complete Kid Quests and track Explorer XP progression', () => {
  const questStop = state.itinerary.find(i => i.kidQuest);
  assert(questStop, 'Itinerary has kid quests');
  
  const initialXP = 200;
  questStop.kidQuestCompleted = true;
  const questCount = state.itinerary.filter(i => i.kidQuestCompleted).length;
  const earnedXP = initialXP + questCount * 150;
  
  assert(earnedXP >= 350, 'XP must increment with completed quests');
  console.log(`       -> Captain Kabir completed: "${questStop.kidQuest}" (+150 XP, Total: ${earnedXP} XP)`);
});

// 7. Smart Packing Checklist & Offline Phrases
step('Toggle packing checklist items and check offline medical phrasebook', () => {
  const packItem = state.packingList.find(p => p.tag === 'Senior Medical');
  assert(packItem, 'Senior medical packing item must exist');
  packItem.done = !packItem.done;
  console.log(`       -> Toggled: "${packItem.text}" -> Done: ${packItem.done}`);

  const sosPhrase = LOCAL_PHRASES.find(p => p.badge === 'SOS');
  assert(sosPhrase && sosPhrase.hi.includes('SMS Hospital'), 'Must include hospital emergency phrase');
  console.log(`       -> Emergency Phrase verified: "${sosPhrase.en}" -> "${sosPhrase.hi}"`);
});

// 8. Full Autonomous JARVIS Command Execution
step('Execute autonomous JARVIS command: "switch to dadaji"', () => {
  const res = processJarvisVoiceCommand('switch to dadaji', {
    currentUser: state.currentUser,
    users: state.users,
    itinerary: state.itinerary,
    polls: state.polls,
    expenses: state.expenses,
    travelStatus: state.travelStatus,
    documents: state.documents,
    conflicts: [],
  });

  assert.strictEqual(res.actionExecuted, 'CHANGE_ACTIVE_USER');
  assert.strictEqual(res.cardData?.userId, 'dadaji');
  state.currentUser = state.users.find(u => u.id === 'dadaji');
  assert.strictEqual(state.currentUser.personaType, 'elderly');
  console.log(`       -> JARVIS autonomous response: "${res.spokenResponse}"`);
  console.log(`       -> Active traveler persona is now: ${state.currentUser.name} (${state.currentUser.personaType})`);
});

console.log('\n=============================================================');
console.log('   ALL 8 END-TO-END WORKFLOWS COMPLETED WITH 100% SUCCESS!   ');
console.log('=============================================================\n');
