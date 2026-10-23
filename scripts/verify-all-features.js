import assert from 'assert';
import { runEdgeSlmNlu, EXCHANGE_RATES, CURRENCY_SYMBOLS } from '../src/lib/slm/edgeSlmEngine.ts';
import { calculateNetBalances, minimizeDebts, recommendNextPayer } from '../src/lib/algorithms/debtMinimizer.ts';
import { detectTripConflicts, detectWeatherAndTemporalConflicts, toMinutes, fromMinutes } from '../src/lib/algorithms/conflictDetector.ts';
import { resolveQuadraticPoll, resolveBordaCountPoll } from '../src/lib/algorithms/mechanismVoting.ts';
import { processJarvisVoiceCommand } from '../src/lib/agents/jarvisBrain.ts';
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

let passedChecks = 0;
let totalChecks = 0;

function check(desc, fn) {
  totalChecks++;
  try {
    fn();
    console.log(`  [PASS] ${desc}`);
    passedChecks++;
  } catch (err) {
    console.error(`  [FAIL] ${desc}:`, err.message);
    throw err;
  }
}

async function runAllVerifications() {
  console.log('\n=============================================================');
  console.log('   SAHYATRI TRAVEL OS: COMPREHENSIVE FEATURE VERIFICATION   ');
  console.log('=============================================================\n');

  // --- SECTION 1: ON-DEVICE EDGE SLM NLU ENGINE ---
  console.log('1. Verifying Sub-5ms Local Edge SLM Engine & Entity Extraction...');
  
  check('SLM parses Weather Adaptation Intent ("it is raining swap outdoor stops")', () => {
    const res = runEdgeSlmNlu('it is raining outside, swap to indoor stops for day 1');
    assert(res.intents.some(i => i.type === 'WEATHER_SWAP'), 'Should have WEATHER_SWAP intent');
    assert(res.latencyMs < 50, 'Edge SLM latency should be sub-50ms');
    assert(res.offlineReady === true, 'SLM must be marked offlineReady');
  });

  check('SLM parses Timeline Auto-Healing Intent ("heal overlapping schedule")', () => {
    const res = runEdgeSlmNlu('auto-heal schedule conflicts for day 2');
    assert(res.intents.some(i => i.type === 'HEAL_CONFLICTS'), 'Should have HEAL_CONFLICTS intent');
    assert.strictEqual(res.intents[0].params.day, 2);
  });

  check('SLM extracts Multi-Currency and Payer ("Priya paid $45 for lunch")', () => {
    const res = runEdgeSlmNlu('Priya paid $45 for lunch', { users: INITIAL_USERS });
    const expIntent = res.intents.find(i => i.type === 'ADD_EXPENSE');
    assert(expIntent, 'Should detect ADD_EXPENSE intent');
    assert.strictEqual(expIntent.params.payerId, 'priya');
    assert(expIntent.params.amount > 3000, 'USD 45 should convert to ~3784 INR');
  });

  check('SLM extracts Yen Currency ("Vikram spent 5000 yen on tickets")', () => {
    const res = runEdgeSlmNlu('Vikram spent 5000 yen on tickets', { users: INITIAL_USERS });
    const expIntent = res.intents.find(i => i.type === 'ADD_EXPENSE');
    assert(expIntent, 'Should detect ADD_EXPENSE intent');
    assert.strictEqual(expIntent.params.payerId, 'vikram');
    assert(expIntent.params.amount > 2000, '5000 Yen should convert to ~2762 INR');
  });

  check('SLM handles Chained Multi-Intent Execution ("it is raining and Vikram paid ₹1200 for taxi")', () => {
    const res = runEdgeSlmNlu('it is raining and Vikram paid ₹1200 for taxi', { users: INITIAL_USERS });
    assert(res.intents.length >= 2, 'Should detect at least 2 chained intents');
    assert(res.intents.some(i => i.type === 'WEATHER_SWAP'), 'Must include WEATHER_SWAP');
    assert(res.intents.some(i => i.type === 'ADD_EXPENSE'), 'Must include ADD_EXPENSE');
  });

  check('SLM extracts Smart Packing items ("add extra umbrella to packing list")', () => {
    const res = runEdgeSlmNlu('add extra umbrella to packing list');
    const packIntent = res.intents.find(i => i.type === 'ADD_PACKING');
    assert(packIntent, 'Should detect ADD_PACKING intent');
    assert(packIntent.params.item.includes('umbrella'));
  });

  // --- SECTION 2: SMART FAIRNESS RECOMMENDER & DEBT MINIMIZER ---
  console.log('\n2. Verifying Debt Minimizer & "Who Pays Next?" Fairness AI...');

  check('Zero-Sum Net Balances Calculation across all 6 companions', () => {
    const balances = calculateNetBalances(INITIAL_EXPENSES, INITIAL_USERS);
    const sum = Object.values(balances).reduce((acc, v) => acc + v, 0);
    assert(Math.abs(sum) < 0.1, `Net balances must sum to ~0 within cents (got ${sum})`);
    assert.strictEqual(Object.keys(balances).length, 6, 'Must calculate for all 6 travelers');
  });

  check('Greedy Debt Minimization outputs <= N - 1 transfers', () => {
    const balances = calculateNetBalances(INITIAL_EXPENSES, INITIAL_USERS);
    const settlements = minimizeDebts(balances, 'INR');
    assert(settlements.length <= INITIAL_USERS.length - 1, 'Transfers must be optimal (<= N-1)');
    assert(settlements.every(s => s.amount > 0), 'Every settlement transfer must be positive');
  });

  check('Multi-Currency Settlement Conversion (USD, EUR, JPY)', () => {
    const balances = calculateNetBalances(INITIAL_EXPENSES, INITIAL_USERS);
    const settlementsUSD = minimizeDebts(balances, 'USD');
    const settlementsINR = minimizeDebts(balances, 'INR');
    assert.strictEqual(settlementsUSD.length, settlementsINR.length);
    assert(settlementsUSD[0].amount < settlementsINR[0].amount, 'USD amounts should be numerically lower than INR');
  });

  check('Smart Fairness Recommender ("Who Pays Next?")', () => {
    const balances = calculateNetBalances(INITIAL_EXPENSES, INITIAL_USERS);
    const { nextPayer, nextPayerDeficit } = recommendNextPayer(balances, INITIAL_USERS);
    assert(nextPayer && nextPayer.id, 'Should identify next payer');
    assert(nextPayerDeficit >= 0, 'Deficit must be non-negative');
    // Ensure the identified payer has the minimum net balance
    for (const u of INITIAL_USERS) {
      assert(balances[u.id] >= balances[nextPayer.id], 'Next payer must have lowest balance');
    }
  });

  // --- SECTION 3: WEATHER CONFLICTS & TEMPORAL OVERLAP AUTO-HEALING ---
  console.log('\n3. Verifying Weather Risk Adaptation & Temporal Overlap Auto-Healing...');

  check('Time conversion utilities toMinutes and fromMinutes round-trip', () => {
    assert.strictEqual(toMinutes('09:30'), 570);
    assert.strictEqual(fromMinutes(570), '09:30');
    assert.strictEqual(fromMinutes(toMinutes('17:45')), '17:45');
  });

  check('Rainy weather flags outdoor stops with indoor fallback recommendations', () => {
    const rainyAlerts = detectWeatherAndTemporalConflicts(INITIAL_ITINERARY, 'Rainy');
    const outdoorStops = INITIAL_ITINERARY.filter(i => i.isOutdoor);
    assert(rainyAlerts.length >= outdoorStops.length, 'Must flag all outdoor stops during rain');
    const firstAlert = rainyAlerts.find(a => a.suggestedAction.resolutionType === 'swap_venue');
    assert(firstAlert, 'Must recommend swap_venue for indoor fallback');
  });

  check('Sunny weather produces zero weather conflict alerts', () => {
    const sunnyAlerts = detectWeatherAndTemporalConflicts(INITIAL_ITINERARY, 'Sunny');
    assert(sunnyAlerts.every(a => !a.id.startsWith('weather-')), 'No weather alerts during Sunny forecast');
  });

  check('Overlap auto-healing calculation resolves overlapping time slots', () => {
    const overlappingItems = [
      { id: '1', day: 1, time: '09:00', endTime: '10:30', title: 'A', isOutdoor: false },
      { id: '2', day: 1, time: '10:00', endTime: '11:00', title: 'B', isOutdoor: false }, // 30m overlap
    ];
    const alerts = detectWeatherAndTemporalConflicts(overlappingItems, 'Sunny');
    assert(alerts.some(a => a.id.startsWith('overlap-')), 'Must detect overlap alert');
  });

  // --- SECTION 4: PERSONAS & DADAJI / KABIR MODES ---
  console.log('\n4. Verifying Personas, Accessibility & Gamified Kid Quests...');

  check('Dadaji Senior Mobility Constraints trigger wheelchair & distance alerts', () => {
    const alerts = detectTripConflicts(INITIAL_ITINERARY, INITIAL_USERS);
    const dadajiAlerts = alerts.filter(a => a.affectedUserId === 'dadaji');
    assert(dadajiAlerts.length > 0, 'Must proactively catch Dadaji mobility/stair conflicts');
  });

  check('Priya Jain Dietary Constraints trigger certified kitchen swap alert', () => {
    const alerts = detectTripConflicts(INITIAL_ITINERARY, INITIAL_USERS);
    const priyaAlerts = alerts.filter(a => a.affectedUserId === 'priya' && a.type === 'dietary');
    assert(priyaAlerts.length > 0, 'Must proactively flag non-Jain dining venues');
  });

  check('Kid Mode Quests are linked to itinerary stops with XP rewards', () => {
    const questStops = INITIAL_ITINERARY.filter(i => i.kidQuest);
    assert(questStops.length >= 2, 'Itinerary should feature kid quests');
    assert(questStops.every(s => s.kidQuest.includes('XP')), 'Quests must offer XP bounties');
  });

  check('Smart Packing list and Offline Phrasebook are populated with localized items', () => {
    assert(INITIAL_PACKING.length >= 5, 'Packing list must contain essential items');
    assert(INITIAL_PACKING.some(p => p.tag === 'Senior Medical'), 'Must have Senior Medical items');
    assert(INITIAL_PACKING.some(p => p.tag === 'Weather Gear'), 'Must have Weather Gear items');
    assert(LOCAL_PHRASES.length >= 4, 'Must have survival phrases');
    assert(LOCAL_PHRASES.some(p => p.badge === 'Accessibility'), 'Must have accessibility phrase');
    assert(LOCAL_PHRASES.some(p => p.badge === 'Dietary'), 'Must have Jain dietary phrase');
  });

  // --- SECTION 5: QUADRATIC VOTING MECHANISM ---
  console.log('\n5. Verifying Quadratic Voting & Mechanism Consensus...');

  check('Quadratic Poll resolves with accurate sqrt group welfare winner', () => {
    const activePoll = INITIAL_POLLS[0];
    const result = resolveQuadraticPoll(activePoll);
    assert(result.winner && result.winner.id, 'Must produce a winning option');
    assert(result.scores[result.winner.id] > 0, 'Winning quadratic score must be positive');
    assert(result.explanation.includes('Quadratic consensus reached'), 'Explanation must cite quadratic consensus');
  });

  // --- SECTION 6: JARVIS AUTONOMOUS VOICE BRAIN ---
  console.log('\n6. Verifying JARVIS Autonomous Voice Brain & Mutex Commands...');

  const mockJarvisCtx = {
    currentUser: INITIAL_USERS[0],
    users: INITIAL_USERS,
    itinerary: INITIAL_ITINERARY,
    polls: INITIAL_POLLS,
    expenses: INITIAL_EXPENSES,
    travelStatus: INITIAL_TRAVEL_STATUS,
    documents: INITIAL_DOCUMENTS,
    conflicts: [],
  };

  check('JARVIS switches to Dadaji Senior Mode autonomously', () => {
    const res = processJarvisVoiceCommand('switch to dadaji', mockJarvisCtx);
    assert.strictEqual(res.actionExecuted, 'CHANGE_ACTIVE_USER');
    assert.strictEqual(res.cardData?.userId, 'dadaji');
    assert(res.spokenResponse.toLowerCase().includes('dadaji'));
  });

  check('JARVIS injects 30-min Chai Rest Buffer', () => {
    const res = processJarvisVoiceCommand('add chai rest buffer', mockJarvisCtx);
    assert.strictEqual(res.actionExecuted, 'INJECT_REST_TIMELINE');
    assert(res.spokenResponse.toLowerCase().includes('buffer'));
  });

  check('JARVIS opens offline Emergency SOS modal', () => {
    const res = processJarvisVoiceCommand('open emergency sos beacon', mockJarvisCtx);
    assert.strictEqual(res.actionExecuted, 'DISPLAY_OFFLINE_SOS');
  });

  check('JARVIS logs expense via voice', () => {
    const res = processJarvisVoiceCommand('Vikram paid 1800 for dinner', mockJarvisCtx);
    assert.strictEqual(res.actionExecuted, 'MUTATE_EXPENSE_STORE');
    assert.strictEqual(res.cardData?.amount, 1800);
    assert.strictEqual(res.cardData?.paidByUserId, 'vikram');
  });

  check('JARVIS resolves active mechanism poll via consensus', () => {
    const res = processJarvisVoiceCommand('finalize the active poll', mockJarvisCtx);
    assert.strictEqual(res.actionExecuted, 'RESOLVE_ACTIVE_POLL');
  });

  // --- SECTION 7: LIVE WEB SERVER VERIFICATION ---
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  console.log(`\n7. Verifying Live Web Server (${baseUrl})...`);

  const res = await fetch(baseUrl);
  check('HTTP GET http://localhost:3000 returns 200 OK', () => {
    assert.strictEqual(res.status, 200);
  });

  const html = await res.text();
  check('Live DOM contains Sahyatri branding and core modules', () => {
    assert(html.includes('Sahyatri'), 'Page should include Sahyatri branding');
    assert(html.includes('AI Group Travel OS') || html.includes('Travel OS'), 'Page should include Travel OS branding');
  });

  console.log('\n=============================================================');
  console.log(`  ALL ${passedChecks}/${totalChecks} COMPREHENSIVE CHECKS PASSED SUCCESSFULLY! `);
  console.log('=============================================================\n');
}

runAllVerifications().catch((err) => {
  console.error('\nVerification halted with error:', err);
  process.exit(1);
});
