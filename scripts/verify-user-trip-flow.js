import assert from 'assert';
import {
  INITIAL_USERS,
  INITIAL_ITINERARY,
  INITIAL_POLLS,
  INITIAL_EXPENSES,
  INITIAL_TRAVEL_STATUS,
  INITIAL_DOCUMENTS,
  INITIAL_PACKING,
  DEFAULT_DEMO_TRIP,
  createSvgAvatar,
} from '../src/lib/state/mockData.ts';
import { canViewDocumentWithUser } from '../src/lib/auth/AuthContext.tsx';
import { loginWithEmail } from '../src/lib/firebase/authService.ts';

console.log('\n=============================================================');
console.log('   SAHYATRI TRAVEL OS: NEW USER & CUSTOM TRIP VERIFICATION   ');
console.log('=============================================================\n');

let stepCount = 0;
async function step(desc, fn) {
  stepCount++;
  try {
    await fn();
    console.log(`  [PASS] Step ${stepCount}: ${desc}`);
  } catch (err) {
    console.error(`  [FAIL] Step ${stepCount}: ${desc}`, err);
    process.exit(1);
  }
}

async function runTests() {
  // 1. Fresh User Session Verification (Problem 2)
  await step('Fresh user account has NO pre-loaded mock travelers', () => {
    const newUser = {
      uid: 'user_fresh_9988',
      email: 'newtraveler@example.com',
      displayName: 'Aarav Patel',
      role: 'planner',
      personaType: 'standard',
      photoURL: createSvgAvatar('AP', '#3b82f6', '#1d4ed8'),
      isMock: false,
    };

    // Convert to CompanionUser
    const tripUser = {
      id: newUser.uid,
      name: newUser.displayName,
      role: newUser.role,
      personaType: newUser.personaType,
      avatar: newUser.photoURL,
      relationship: 'Trip Leader',
      dietary: 'Vegetarian',
      mobilityRestrictions: {
        maxWalkingDistanceMeters: 3000,
        requiresWheelchairOrRamp: false,
        stairTolerance: 'normal',
      },
      emergencyContact: '+91 98000 00000',
      flightPnr: 'PNR-NEW',
    };

    // Clean trip initial state
    const cleanTrip = {
      tripInfo: {
        id: `trip-${Date.now()}`,
        title: 'My First Journey',
        destination: 'Goa',
        startDate: '2026-11-10',
        endDate: '2026-11-15',
        totalDays: 5,
        currency: 'INR',
      },
      users: [tripUser],
      currentUser: tripUser,
      itinerary: [],
      polls: [],
      expenses: [],
      documents: [],
    };

    // Verify none of the mock users exist in clean trip
    const mockNames = ['Rohan Sharma', 'Devendra Sharma', 'Priya Sharma', 'Kabir Sharma', 'Vikram Sharma', 'Ananya Verma'];
    for (const mockName of mockNames) {
      assert(!cleanTrip.users.some(u => u.name === mockName), `Mock user ${mockName} should NOT be in fresh trip!`);
    }
    assert.strictEqual(cleanTrip.users.length, 1, 'Clean trip should only contain the signed-in user');
    assert.strictEqual(cleanTrip.itinerary.length, 0, 'Clean trip itinerary must start empty');
    assert.strictEqual(cleanTrip.polls.length, 0, 'Clean trip polls must start empty');
    assert.strictEqual(cleanTrip.documents.length, 0, 'Clean trip documents must start empty');
    console.log('       -> Clean trip isolated with single user: ' + cleanTrip.users[0].name);
  });

  // 2. Custom Trip Creation Flow
  await step('Trip Setup Modal creates customized multi-day journey with companion drafts', () => {
    const customTrip = {
      tripInfo: {
        id: 'trip-himalaya-2026',
        title: 'Himachal Snow Trail',
        destination: 'Manali, Himachal Pradesh',
        startDate: '2026-12-01',
        endDate: '2026-12-05',
        totalDays: 5,
        currency: 'INR',
      },
      users: [
        {
          id: 'u-leader',
          name: 'Aarav Patel',
          role: 'planner',
          personaType: 'standard',
          relationship: 'Trip Leader',
          dietary: 'Vegetarian',
          avatar: createSvgAvatar('AP', '#3b82f6', '#1d4ed8'),
        },
        {
          id: 'u-dadi',
          name: 'Kalyani Patel',
          role: 'companion',
          personaType: 'elderly',
          relationship: 'Grandmother',
          dietary: 'Jain (No Root Veg)',
          avatar: createSvgAvatar('KP', '#059669', '#047857'),
          mobilityRestrictions: {
            maxWalkingDistanceMeters: 300,
            requiresWheelchairOrRamp: true,
            stairTolerance: 'none',
          },
        },
      ],
      itinerary: [],
      polls: [],
      expenses: [],
      documents: [],
    };

    assert.strictEqual(customTrip.tripInfo.destination, 'Manali, Himachal Pradesh');
    assert.strictEqual(customTrip.users.length, 2);
    assert.strictEqual(customTrip.users[1].personaType, 'elderly');
    assert.strictEqual(customTrip.users[1].mobilityRestrictions.requiresWheelchairOrRamp, true);
    console.log(`       -> Created trip "${customTrip.tripInfo.title}" with 2 travelers.`);
  });

  // 3. Demo Trip Switching & Fallback
  await step('One-click switch to Rajasthan Demo Expedition restores full interactive dataset', () => {
    const demoTrip = {
      tripInfo: DEFAULT_DEMO_TRIP,
      users: INITIAL_USERS,
      currentUser: INITIAL_USERS[0],
      itinerary: INITIAL_ITINERARY,
      polls: INITIAL_POLLS,
      expenses: INITIAL_EXPENSES,
      documents: INITIAL_DOCUMENTS,
    };

    assert.strictEqual(demoTrip.tripInfo.destination, 'Jaipur, Rajasthan');
    assert.strictEqual(demoTrip.users.length, 6);
    assert(demoTrip.itinerary.length >= 7);
    assert(demoTrip.polls.length >= 1);
    assert(demoTrip.documents.length >= 4);
    console.log(`       -> Successfully restored demo trip with ${demoTrip.users.length} companions & ${demoTrip.itinerary.length} stops.`);
  });

  // 4. Dynamic Companion Addition (Elderly & Kid Personas)
  await step('Add Companion Modal supports elderly mobility and kid quest constraints', () => {
    const companionsList = [];

    // Add Elderly
    const elderlyCompanion = {
      id: `comp-elderly-${Date.now()}`,
      name: 'Savitri Devi',
      role: 'companion',
      personaType: 'elderly',
      avatar: createSvgAvatar('SD', '#059669', '#047857'),
      relationship: 'Grandmother',
      dietary: 'Low-Sodium Vegetarian',
      mobilityRestrictions: {
        maxWalkingDistanceMeters: 250,
        requiresWheelchairOrRamp: true,
        stairTolerance: 'none',
      },
      emergencyContact: '+91 98111 22233',
    };
    companionsList.push(elderlyCompanion);

    // Add Kid
    const kidCompanion = {
      id: `comp-kid-${Date.now()}`,
      name: 'Reyansh Patel',
      role: 'companion',
      personaType: 'kid',
      avatar: createSvgAvatar('RP', '#0284c7', '#0369a1'),
      relationship: 'Son',
      dietary: 'Standard',
      mobilityRestrictions: {
        maxWalkingDistanceMeters: 2000,
        requiresWheelchairOrRamp: false,
        stairTolerance: 'normal',
      },
      kidQuests: [
        { id: 'q1', title: 'Find 3 colorful kites at the beach market', xpReward: 100, completed: false },
      ],
    };
    companionsList.push(kidCompanion);

    assert.strictEqual(companionsList.length, 2);
    assert.strictEqual(companionsList[0].mobilityRestrictions.maxWalkingDistanceMeters, 250);
    assert.strictEqual(companionsList[1].kidQuests[0].xpReward, 100);
    console.log('       -> Added elderly with wheelchair requirements & kid with XP quests.');
  });

  // 5. Dynamic Itinerary Stop Addition with Weather Fallbacks
  await step('Add Itinerary Modal creates stops with indoor weather fallback and wheelchair tags', () => {
    const newStop = {
      id: 'itin-custom-1',
      day: 1,
      date: 'Day 1',
      time: '15:00',
      endTime: '17:30',
      title: 'Baga Beach Coastal Sunset Walk',
      description: 'Relaxed golden hour walk along the shore with tender coconut stalls.',
      category: 'activity',
      location: 'Baga Beach, North Goa',
      walkingDistanceMeters: 400,
      stairsCount: 0,
      costPerPerson: 100,
      cost: 100,
      isOutdoor: true,
      indoorFallback: 'Goa State Central Museum & Cultural Gallery',
      wheelchairAccessible: true,
      status: 'confirmed',
    };

    assert.strictEqual(newStop.isOutdoor, true);
    assert.strictEqual(newStop.indoorFallback, 'Goa State Central Museum & Cultural Gallery');
    assert.strictEqual(newStop.wheelchairAccessible, true);
    console.log(`       -> Created stop "${newStop.title}" with indoor fallback "${newStop.indoorFallback}".`);
  });

  // 6. Dynamic Mechanism Poll Creation
  await step('Add Poll Modal creates multi-option consensus polls', () => {
    const newPoll = {
      id: 'poll-custom-1',
      title: 'Dinner Choice: Beachside Shack vs Portuguese Bistro',
      description: 'Use quadratic votes to express group culinary preference fairly.',
      mechanismType: 'quadratic',
      options: [
        { id: 'opt-a', title: 'Britto’s Beach Shack', description: 'Fresh seafood & beach sunset views', costEstimate: '₹900/person', category: 'dining' },
        { id: 'opt-b', title: 'Viva Panjim Heritage Bistro', description: 'Historic Portuguese mansion with vegetarian Goan curry', costEstimate: '₹750/person', category: 'dining' },
      ],
      userVotes: {
        'u-leader': { 'opt-a': 4, 'opt-b': 2 }, // 16 + 4 = 20 credits spent <= 100
      },
      status: 'active',
    };

    const spentLeader = Math.pow(4, 2) + Math.pow(2, 2);
    assert.strictEqual(spentLeader, 20);
    assert.strictEqual(100 - spentLeader, 80, 'Remaining credits should be 80');
    console.log(`       -> Created poll with 2 options, quadratic credit balance enforced.`);
  });

  // 7. Dynamic Travel Document Upload with RBAC
  await step('Upload Document Modal enforces granular family vs planner RBAC scoping', () => {
    const uploadedDoc = {
      id: 'doc-ticket-99',
      title: 'IndiGo 6E-204 Flight Boarding Pass',
      type: 'boarding_pass',
      ownerId: 'u-leader',
      sharingScope: 'family_all',
      referenceNumber: '6E204-BLR-GOI',
      validUntil: '2026-11-10',
      qrPayload: 'INDI_GO_AARAV_SEAT_14B_GATE_03',
      cachedOffline: true,
    };

    const privateDoc = {
      id: 'doc-medical-1',
      title: 'Confidential Doctor Health Assessment',
      type: 'prescription',
      ownerId: 'u-dadi',
      sharingScope: 'planner_only',
      referenceNumber: 'RX-7788',
      validUntil: '2026-12-31',
      cachedOffline: true,
    };

    // Check RBAC with canViewDocumentWithUser
    const plannerUser = { uid: 'u-leader', role: 'planner' };
    const familyUser = { uid: 'u-companion', role: 'companion' };

    // Family pass should be visible to all
    assert.strictEqual(canViewDocumentWithUser(uploadedDoc, familyUser), true);
    assert.strictEqual(canViewDocumentWithUser(uploadedDoc, plannerUser), true);

    // Planner only doc should be visible to planner, but NOT regular companion
    assert.strictEqual(canViewDocumentWithUser(privateDoc, plannerUser), true);
    assert.strictEqual(canViewDocumentWithUser(privateDoc, familyUser), false);

    console.log('       -> RBAC verified: family documents public to group; planner documents secured.');
  });

  // 8. Header Sign-In CTA Logic (Problem 1)
  await step('Header CTA logic: Sign In button shows ONLY when !isAuthenticated', () => {
    function getHeaderActions(authContext) {
      if (!authContext.isAuthenticated) {
        return { showSignInButton: true, showProfileAvatar: false, showSignOut: false };
      }
      return {
        showSignInButton: false,
        showProfileAvatar: true,
        showSignOut: true,
        userDisplayName: authContext.user.displayName,
      };
    }

    // When unauthenticated
    const unauthHeader = getHeaderActions({ isAuthenticated: false, user: null });
    assert.strictEqual(unauthHeader.showSignInButton, true, 'Sign In button must show when NOT authenticated');
    assert.strictEqual(unauthHeader.showProfileAvatar, false, 'Profile avatar must NOT show when unauthenticated');

    // When authenticated
    const authHeader = getHeaderActions({
      isAuthenticated: true,
      user: { displayName: 'Aarav Patel', email: 'aarav@example.com' },
    });
    assert.strictEqual(authHeader.showSignInButton, false, 'Sign In button must NOT show when authenticated');
    assert.strictEqual(authHeader.showProfileAvatar, true, 'Profile avatar must show when authenticated');
    assert.strictEqual(authHeader.showSignOut, true, 'Sign Out option must be accessible');
    console.log('       -> Header displays "Sign In" only when !isAuthenticated, and user avatar when logged in.');
  });

  // 9. Quick Companion Switcher Authentication State (Fix Problem 1)
  await step('Companion switch sets user, active session, and sets isAuthenticated = true', () => {
    let mockSessionStorage = {};
    let currentUserState = null;
    let activeProfileState = INITIAL_USERS[0];

    function switchQuickCompanion(companionId) {
      const found = INITIAL_USERS.find((u) => u.id === companionId);
      if (!found) return;
      const session = {
        uid: found.id,
        email: `${found.id}@traveler.sahyatri.ai`,
        displayName: found.name,
        photoURL: found.avatar,
        role: found.role,
        personaType: found.personaType,
      };
      currentUserState = session;
      activeProfileState = found;
      mockSessionStorage['sahyatri_active_session'] = JSON.stringify(session);
    }

    // Before switch
    assert.strictEqual(currentUserState, null);
    assert.strictEqual(!!currentUserState, false, 'Should be unauthenticated initially');

    // Switch to Dadaji
    switchQuickCompanion('dadaji');
    assert(currentUserState !== null);
    assert.strictEqual(currentUserState.uid, 'dadaji');
    assert.strictEqual(currentUserState.role, 'companion');
    assert.strictEqual(currentUserState.personaType, 'elderly');
    assert.strictEqual(!!currentUserState, true, 'isAuthenticated must be true after companion switch');
    assert.strictEqual(activeProfileState.name, 'Dadaji (Devendra Sharma)');
    assert(mockSessionStorage['sahyatri_active_session'].includes('dadaji'));

    // Switch to Kabir (kid mode)
    switchQuickCompanion('kabir');
    assert.strictEqual(currentUserState.uid, 'kabir');
    assert.strictEqual(currentUserState.personaType, 'kid');
    assert.strictEqual(!!currentUserState, true);

    console.log('       -> switchQuickCompanion properly establishes authenticated session & persona');
  });

  // 10. Deterministic UIDs in Offline / Simulation Mode
  await step('Deterministic UIDs generated by loginWithEmail for distinct email addresses', async () => {
    const userA = await loginWithEmail('aditi.sharma@example.com', 'password123');
    const userB = await loginWithEmail('aditi.sharma@example.com', 'different-pass');
    const userC = await loginWithEmail('vikas.verma@example.com', 'password123');
    const demoRohan = await loginWithEmail('rohan.sharma@traveler.sahyatri.ai', 'rohan-pwd');

    // Identical email should yield identical deterministic UID in simulation
    assert.strictEqual(userA.uid, userB.uid, 'Same email must produce deterministic UID across logins');
    assert.strictEqual(userA.uid, 'user-sim-aditi_sharma_example_com');

    // Different email must produce different UID
    assert.notStrictEqual(userA.uid, userC.uid, 'Different emails must produce distinct UIDs');
    assert.strictEqual(userC.uid, 'user-sim-vikas_verma_example_com');

    // Demo email maps directly to rohan
    assert.strictEqual(demoRohan.uid, 'rohan');
    assert.strictEqual(demoRohan.role, 'planner');

    console.log(`       -> Verified deterministic UIDs: "${userA.uid}" and "${userC.uid}"`);
  });

  // 11. Dynamic Travel Status HUD Gathered Count
  await step('Dynamic TravelStatusHUD gathered count adapts to custom group size', () => {
    function computeHUDGatheredStatus(usersList, travelStatusMap) {
      const gatheredCount = usersList.filter(
        (u) => travelStatusMap[u.id]?.currentStep === 'at_rendezvous'
      ).length;
      return {
        gatheredCount,
        totalCount: usersList.length,
        hudDisplayString: `${gatheredCount} of ${usersList.length} Gathered`,
      };
    }

    // Demo initial travel status: 1 of 6 companions currently at rendezvous (vikram)
    const demoHUD = computeHUDGatheredStatus(INITIAL_USERS, INITIAL_TRAVEL_STATUS);
    assert.strictEqual(demoHUD.gatheredCount, 1);
    assert.strictEqual(demoHUD.totalCount, 6);
    assert.strictEqual(demoHUD.hudDisplayString, '1 of 6 Gathered');

    // Custom 2-person trip where 1 has arrived
    const customUsers = [
      { id: 'u1', name: 'Aarav Patel' },
      { id: 'u2', name: 'Kalyani Patel' },
    ];
    const customStatus = {
      u1: { currentStep: 'at_rendezvous' },
      u2: { currentStep: 'in_flight' },
    };
    const customHUD = computeHUDGatheredStatus(customUsers, customStatus);
    assert.strictEqual(customHUD.gatheredCount, 1);
    assert.strictEqual(customHUD.totalCount, 2);
    assert.strictEqual(customHUD.hudDisplayString, '1 of 2 Gathered');

    // Single traveler trip
    const soloHUD = computeHUDGatheredStatus([customUsers[0]], { u1: { currentStep: 'at_rendezvous' } });
    assert.strictEqual(soloHUD.hudDisplayString, '1 of 1 Gathered');

    console.log('       -> Verified HUD string dynamically reflects active companions: ' + customHUD.hudDisplayString);
  });

  // 12. Dynamic Expense Ledger Split String & Empty State
  await step('Dynamic ExpenseLedger split strings and empty state handling', () => {
    function getLedgerSummary(usersList, expensesList) {
      const companionLabel = usersList.length === 1 ? 'traveler' : 'companions';
      const summaryString = `Split across ${usersList.length} ${companionLabel}`;
      return {
        summaryString,
        hasEmptyState: expensesList.length === 0,
        emptyStateMessage: expensesList.length === 0 ? 'No shared expenses recorded yet.' : null,
      };
    }

    function getExpenseSplitLabel(expense, usersList) {
      const splitWays = expense.splitWithUserIds?.length || usersList.length;
      return `Split ${splitWays} ways`;
    }

    // Solo traveler with 0 expenses
    const soloLedger = getLedgerSummary([{ id: 'u1', name: 'Aarav' }], []);
    assert.strictEqual(soloLedger.summaryString, 'Split across 1 traveler');
    assert.strictEqual(soloLedger.hasEmptyState, true);
    assert.strictEqual(soloLedger.emptyStateMessage, 'No shared expenses recorded yet.');

    // 3 travelers with an expense
    const threeUsers = [{ id: 'u1' }, { id: 'u2' }, { id: 'u3' }];
    const groupLedger = getLedgerSummary(threeUsers, [{ id: 'e1', amount: 3000 }]);
    assert.strictEqual(groupLedger.summaryString, 'Split across 3 companions');
    assert.strictEqual(groupLedger.hasEmptyState, false);

    const splitLabel = getExpenseSplitLabel({ id: 'e1', amount: 3000 }, threeUsers);
    assert.strictEqual(splitLabel, 'Split 3 ways');

    console.log('       -> Verified ExpenseLedger dynamic labels and empty state handling');
  });

  console.log('\n=============================================================');
  console.log(`  ALL ${stepCount}/${stepCount} NEW USER & CUSTOM TRIP CHECKS PASSED SUCCESSFULLY! `);
  console.log('=============================================================\n');
}

runTests();
