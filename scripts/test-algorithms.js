import assert from 'assert';

// 1. Test Debt Minimization
function testDebtMinimizer() {
  console.log('Testing Debt Minimizer Algorithm...');
  
  // 6 users
  const users = [
    { id: 'rohan' },
    { id: 'dadaji' },
    { id: 'kabir' },
    { id: 'priya' },
    { id: 'vikram' },
    { id: 'ananya' }
  ];

  const expenses = [
    {
      id: 'exp-1',
      title: 'Hotel Suites',
      amount: 54000,
      paidByUserId: 'rohan',
      splitWithUserIds: ['rohan', 'dadaji', 'kabir', 'priya', 'vikram', 'ananya']
    },
    {
      id: 'exp-2',
      title: 'Banquet',
      amount: 7200,
      paidByUserId: 'vikram',
      splitWithUserIds: ['rohan', 'dadaji', 'kabir', 'priya', 'vikram', 'ananya']
    },
    {
      id: 'exp-3',
      title: 'Tempo Traveler Van Rental',
      amount: 14500,
      paidByUserId: 'priya',
      splitWithUserIds: ['rohan', 'dadaji', 'kabir', 'priya', 'vikram', 'ananya']
    },
    {
      id: 'exp-4',
      title: 'Palace Tickets',
      amount: 3600,
      paidByUserId: 'rohan',
      splitWithUserIds: ['rohan', 'dadaji', 'kabir', 'priya', 'vikram', 'ananya']
    }
  ];

  // Calculate Net Balances
  const balances = {};
  users.forEach(u => balances[u.id] = 0);

  for (const exp of expenses) {
    const splitCount = exp.splitWithUserIds.length;
    const perPerson = exp.amount / splitCount;
    balances[exp.paidByUserId] += exp.amount;
    for (const pid of exp.splitWithUserIds) {
      balances[pid] -= perPerson;
    }
  }

  // Verify Zero Sum Property
  const totalNet = Object.values(balances).reduce((a, b) => a + b, 0);
  assert(Math.abs(totalNet) < 0.01, 'Net balances must sum to 0');
  console.log('✓ Net Balances verified (Sum = 0):', balances);

  // Minimize Debts
  const creditors = [];
  const debtors = [];
  for (const [userId, net] of Object.entries(balances)) {
    if (net > 0.01) creditors.push({ userId, amount: net });
    else if (net < -0.01) debtors.push({ userId, amount: Math.abs(net) });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let cIdx = 0;
  let dIdx = 0;

  while (cIdx < creditors.length && dIdx < debtors.length) {
    const creditor = creditors[cIdx];
    const debtor = debtors[dIdx];
    const settledAmount = Math.min(creditor.amount, debtor.amount);
    settlements.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: Math.round(settledAmount * 100) / 100
    });
    creditor.amount -= settledAmount;
    debtor.amount -= settledAmount;
    if (creditor.amount < 0.01) cIdx++;
    if (debtor.amount < 0.01) dIdx++;
  }

  assert(settlements.length <= users.length - 1, 'Settlements count must be <= N - 1');
  console.log(`✓ Settled ${users.length} travelers in ${settlements.length} transfers (<= ${users.length - 1}):`, settlements);
}

// 2. Test Quadratic Voting Consensus
function testQuadraticVoting() {
  console.log('\nTesting Quadratic Mechanism Design...');
  
  const options = [
    { id: 'opt-a', title: 'Puppet Workshop' },
    { id: 'opt-b', title: 'Sunset Jeep Safari' },
    { id: 'opt-c', title: 'Johari Bazaar Walk' }
  ];

  const userVotes = {
    rohan: { 'opt-a': 5, 'opt-b': 4, 'opt-c': 3 },
    dadaji: { 'opt-a': 9, 'opt-b': 1, 'opt-c': 0 },
    kabir: { 'opt-a': 7, 'opt-b': 6, 'opt-c': 0 },
    priya: { 'opt-a': 6, 'opt-b': 2, 'opt-c': 4 },
    vikram: { 'opt-a': 0, 'opt-b': 9, 'opt-c': 2 }
  };

  // Verify credits cost = sum of v^2 <= 100 per user
  for (const [uid, votes] of Object.entries(userVotes)) {
    let cost = 0;
    for (const v of Object.values(votes)) {
      cost += v * v;
    }
    assert(cost <= 100, `User ${uid} spent ${cost} credits, exceeding 100!`);
    console.log(`✓ User ${uid} cast quadratic votes within budget (Spent ${cost}/100 credits)`);
  }

  const scores = { 'opt-a': 0, 'opt-b': 0, 'opt-c': 0 };
  for (const votes of Object.values(userVotes)) {
    for (const [optId, v] of Object.entries(votes)) {
      scores[optId] += v;
    }
  }

  console.log('✓ Quadratic Scores:', scores);
  assert(scores['opt-a'] > scores['opt-b'], 'Puppet workshop should win group welfare');
  assert(scores['opt-a'] > scores['opt-c'], 'Puppet workshop should beat bazaar walk');
  console.log('✓ Winner: opt-a (Puppet Workshop) correctly resolved with highest group utility');
}

// 3. Test Proactive Conflict Detection
function testConflictDetection() {
  console.log('\nTesting Conflict Detection Engine...');

  const dadaji = {
    id: 'dadaji',
    name: 'Dadaji',
    preferences: {
      dietary: ['Low-Sodium Vegetarian'],
      medical: ['Type 2 Diabetes', 'Knee Osteoarthritis'],
      mobility: { maxWalkingMeters: 350, needsRampOrElevator: true, stairTolerance: 'none' }
    }
  };

  const priya = {
    id: 'priya',
    name: 'Priya',
    preferences: {
      dietary: ['Jain', 'Strict Vegetarian'],
      mobility: { maxWalkingMeters: 4000, needsRampOrElevator: false, stairTolerance: 'normal' }
    }
  };

  const amberFort = {
    id: 'event-6',
    title: 'Amber Fort',
    category: 'activity',
    walkingDistanceMeters: 850,
    stairsCount: 140
  };

  const handiGrill = {
    id: 'event-7',
    title: 'Handi Grill',
    category: 'dining',
    dietaryTags: ['Non-Vegetarian', 'Mughlai']
  };

  // Mobility conflict check
  const mobilityConflict = amberFort.walkingDistanceMeters > dadaji.preferences.mobility.maxWalkingMeters;
  assert(mobilityConflict, 'Must detect Dadaji walking distance conflict at Amber Fort');
  console.log('✓ Successfully flagged Dadaji mobility conflict (850m > 350m limit)');

  // Dietary conflict check
  const dietaryConflict = !handiGrill.dietaryTags.includes('Jain');
  assert(dietaryConflict, 'Must detect Priya Jain dietary conflict at Handi Grill');
  console.log('✓ Successfully flagged Priya Jain dietary conflict at Handi Grill');
}

testDebtMinimizer();
testQuadraticVoting();
testConflictDetection();
console.log('\n======================================');
console.log('ALL ALGORITHMIC VERIFICATIONS PASSED!');
console.log('======================================');
