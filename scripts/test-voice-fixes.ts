import { processJarvisVoiceCommand } from '../src/lib/agents/jarvisBrain';
import { JarvisContext } from '../src/lib/agents/jarvisBrain';

const mockCtx: JarvisContext = {
  currentUser: {
    id: 'rohan',
    name: 'Rohan Sharma',
    role: 'planner',
    personaType: 'standard',
    avatar: '',
    age: 32,
    phone: '+91 98765 43210',
    relationship: 'Self',
    preferences: { mobility: { maxWalkingMeters: 5000, stairTolerance: 'normal', needsRampOrElevator: false }, dietary: [], pacePreference: 'moderate', medical: [] }
  },
  users: [
    {
      id: 'rohan',
      name: 'Rohan Sharma',
      role: 'planner',
      personaType: 'standard',
      avatar: '',
      age: 32,
      phone: '+91 98765 43210',
      relationship: 'Self',
      preferences: { mobility: { maxWalkingMeters: 5000, stairTolerance: 'normal', needsRampOrElevator: false }, dietary: [], pacePreference: 'moderate', medical: [] }
    },
    {
      id: 'dadaji',
      name: 'Dadaji (Devendra Sharma)',
      role: 'companion',
      personaType: 'elderly',
      avatar: '',
      age: 72,
      phone: '+91 98765 43211',
      relationship: 'Grandfather',
      preferences: { mobility: { maxWalkingMeters: 350, stairTolerance: 'none', needsRampOrElevator: true }, dietary: [], pacePreference: 'relaxed', medical: ['Hypertension'] }
    },
    {
      id: 'kabir',
      name: 'Kabir Sharma',
      role: 'companion',
      personaType: 'kid',
      avatar: '',
      age: 8,
      phone: '+91 98765 43212',
      relationship: 'Son',
      preferences: { mobility: { maxWalkingMeters: 2000, stairTolerance: 'few', needsRampOrElevator: false }, dietary: [], pacePreference: 'fast', medical: [] }
    }
  ],
  itinerary: [{
    id: 'itin-1',
    day: 1,
    date: 'Day 1',
    time: '10:00',
    title: 'Amber Fort',
    description: 'Historical fort palace',
    category: 'activity',
    location: 'Amber, Jaipur',
    status: 'confirmed'
  }],
  polls: [],
  expenses: [],
  travelStatus: {},
  documents: [],
  conflicts: []
};

// 1. Stop command tests
const stopPhrases = ['stop', 'ruko', 'chup', 'sahayak stop', 'stop speaking', 'quiet please', 'band karo'];
for (const p of stopPhrases) {
  const r = processJarvisVoiceCommand(p, mockCtx);
  if (r.intent !== 'STOP' || r.spokenResponse !== '') {
    console.error('FAILED STOP check for:', p, r);
    process.exit(1);
  }
}
console.log('✓ All STOP commands immediately silence speech (spokenResponse is empty string)');

// 2. Unrecognized / noise tests (MUST NOT repeat 'Next scheduled activity')
const noisePhrases = ['asdfghjkl', 'random background sound', ''];
for (const p of noisePhrases) {
  const r = processJarvisVoiceCommand(p, mockCtx);
  if (r.intent === 'QUERY_SCHEDULE' || r.spokenResponse.includes('Next scheduled activity')) {
    console.error('FAILED NOISE check (returned schedule for noise!):', p, r);
    process.exit(1);
  }
}
console.log('✓ Noise and unrecognized input never repeat schedule in loops');

// 3. Explicit schedule query
const sched = processJarvisVoiceCommand('what is the next activity on schedule', mockCtx);
if (sched.intent !== 'QUERY_SCHEDULE') {
  console.error('FAILED explicit schedule check:', sched);
  process.exit(1);
}
console.log('✓ Explicit schedule queries work accurately');

// 4. Missing capabilities work:
const weather = processJarvisVoiceCommand('baarish ho rahi hai indoor swap karo', mockCtx);
if (weather.actionExecuted !== 'WEATHER_SWAP') {
  console.error('FAILED weather swap check:', weather);
  process.exit(1);
}
console.log('✓ Weather adaptation works');

const heal = processJarvisVoiceCommand('fix overlaps and heal schedule', mockCtx);
if (heal.actionExecuted !== 'HEAL_SCHEDULE') {
  console.error('FAILED heal schedule check:', heal);
  process.exit(1);
}
console.log('✓ Schedule auto-heal works');

const nextPayer = processJarvisVoiceCommand('who pays next for group', mockCtx);
if (nextPayer.intent !== 'WHO_PAYS_NEXT') {
  console.error('FAILED who pays next check:', nextPayer);
  process.exit(1);
}
console.log('✓ Who pays next works');

const help = processJarvisVoiceCommand('kya kar sakte ho sahayak', mockCtx);
if (help.intent !== 'HELP') {
  console.error('FAILED help check:', help);
  process.exit(1);
}
console.log('✓ Help and capabilities work');

console.log('\n=============================================');
console.log('ALL VOICE CHECKS PASSED WITH 100% SUCCESS!');
console.log('=============================================');
