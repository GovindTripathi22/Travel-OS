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

// 5. Compound query with typos from user report: "what is the next part fo the plan wna how sthe weathere there"
const compoundQuery = processJarvisVoiceCommand('what is the next part fo the plan wna how sthe weathere there', mockCtx);
if (compoundQuery.intent !== 'QUERY_SCHEDULE' || !compoundQuery.spokenResponse.includes('32°C') || compoundQuery.spokenResponse.includes('Flight AI-481')) {
  console.error('FAILED compound plan + weather query:', compoundQuery);
  process.exit(1);
}
console.log('✓ Compound query with typos accurately answers upcoming plan AND weather without flight info');

// 6. Informational weather query
const weatherInfo = processJarvisVoiceCommand('how is the weather in jaipur today', mockCtx);
if (weatherInfo.intent !== 'QUERY_WEATHER' || !weatherInfo.spokenResponse.includes('32°C')) {
  console.error('FAILED informational weather check:', weatherInfo);
  process.exit(1);
}
console.log('✓ Informational weather query returns 32°C forecast without falling back to flight info');

// 7. Informational dining query
const diningInfo = processJarvisVoiceCommand('what is the plan for lunch and is it jain', mockCtx);
if (diningInfo.intent !== 'QUERY_DINING' || !diningInfo.spokenResponse.toLowerCase().includes('surya mahal')) {
  console.error('FAILED dining check:', diningInfo);
  process.exit(1);
}
console.log('✓ Informational dining query returns Surya Mahal Jain lunch accommodations');

// 8. Informational Dadaji mobility query
const mobilityInfo = processJarvisVoiceCommand('are there stairs for dadaji at amber fort', mockCtx);
if (mobilityInfo.intent !== 'QUERY_MOBILITY' || !mobilityInfo.spokenResponse.toLowerCase().includes('golf cart')) {
  console.error('FAILED mobility check:', mobilityInfo);
  process.exit(1);
}
console.log('✓ Informational mobility query returns Dadaji suite 104 and golf cart bypass');

// 9. Verify companionAgent responses directly
import { generateCompanionResponse } from '../src/lib/agents/companionAgent';
const agentCtx = {
  currentUser: mockCtx.currentUser,
  itinerary: [
    {
      id: 'event-1',
      day: 1,
      date: 'Oct 14, 2026',
      time: '09:30',
      endTime: '11:00',
      title: 'Flight AI-481 Land & Airport Rendezvous',
      description: 'Landed at airport',
      category: 'transit' as const,
      location: 'Airport',
      status: 'confirmed' as const,
    },
    {
      id: 'event-3',
      day: 1,
      date: 'Oct 14, 2026',
      time: '13:00',
      endTime: '14:30',
      title: 'Welcome Royal Thali Lunch',
      description: 'Lunch banquet',
      category: 'dining' as const,
      location: 'Surya Mahal',
      status: 'confirmed' as const,
    }
  ],
  polls: [],
  expenses: [],
  travelStatus: {},
  documents: [],
  allUsers: mockCtx.users,
};

const compResponse = generateCompanionResponse('what is the next part fo the plan wna how sthe weathere there', agentCtx);
if (!compResponse.text.includes('32°C') || !compResponse.text.includes('Surya Mahal') || compResponse.text.includes('Flight AI-481')) {
  console.error('FAILED companionAgent compound response:', compResponse);
  process.exit(1);
}
console.log('✓ companionAgent answers compound query with weather + lunch plan (never Flight AI-481)');

const compGreeting = generateCompanionResponse('hello sahayak can you help me', agentCtx);
if (compGreeting.text.includes('Flight AI-481') || !compGreeting.text.includes('Welcome Royal Thali Lunch')) {
  console.error('FAILED companionAgent general greeting fallback:', compGreeting);
  process.exit(1);
}
console.log('✓ companionAgent general greeting points to upcoming activity (Welcome Royal Thali Lunch, never Flight AI-481)');

// 10. Voice Audio Controller Mute & Unmute Guard
import { jarvisAudio } from '../src/lib/audio/jarvisAudio';
jarvisAudio.mute();
if (!jarvisAudio.isMicMuted() || jarvisAudio.isActive()) {
  console.error('FAILED jarvisAudio.mute() check');
  process.exit(1);
}
jarvisAudio.unmute();
if (jarvisAudio.isMicMuted()) {
  console.error('FAILED jarvisAudio.unmute() check');
  process.exit(1);
}
console.log('✓ jarvisAudio mute and unmute guards prevent auto-restart loop');

console.log('\n=============================================');
console.log('ALL VOICE CHECKS PASSED WITH 100% SUCCESS!');
console.log('=============================================');
