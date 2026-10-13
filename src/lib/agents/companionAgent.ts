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

/**
 * Intelligent offline agent response generator with deep context-awareness.
 */
export function generateCompanionResponse(
  query: string,
  context: AgentContext
): { text: string; actionSuggestion?: string; quickReplies?: string[] } {
  const { currentUser, itinerary, polls, travelStatus } = context;
  const q = query.toLowerCase().trim();

  // DADAJI (ELDERLY MODE)
  if (currentUser.id === 'dadaji') {
    if (q.includes('dinner') || q.includes('khana') || q.includes('food') || q.includes('lunch') || q.includes('eat')) {
      return {
        text: `Pranam Dadaji! Today's lunch at Surya Mahal has already been pre-ordered with a special low-sodium, mild Rajasthani thali tailored for you. Tonight's dinner at 1135 AD has elevator access straight from the courtyard to the terrace so you don't need to climb any fort stairs.`,
        actionSuggestion: `Rohan has also requested the chef avoid sugar and high spices for your dinner.`,
        quickReplies: ['Will there be stairs tonight?', 'When should I take my BP medicine?', 'Call Rohan']
      };
    }

    if (q.includes('stairs') || q.includes('walk') || q.includes('walking') || q.includes('climb') || q.includes('chadhna')) {
      return {
        text: `No worries at all, Dadaji. For Amber Fort tomorrow, the system has already flagged the 140 stone steps and booked a government golf cart and wheelchair escort right to the Diwan-e-Aam. You will only walk about 50 paces on flat paved marble.`,
        actionSuggestion: `Golf cart pass confirmed under reference RJ-TOUR-WHEEL-09.`,
        quickReplies: ['What is the schedule for tomorrow?', 'Where is our hotel?', 'Listen to audio summary']
      };
    }

    if (q.includes('medicine') || q.includes('meds') || q.includes('dawai') || q.includes('bp') || q.includes('sugar')) {
      return {
        text: `Dadaji, your morning BP medicine was scheduled at 08:00 AM with breakfast. Your evening BP dose is due at 20:00 PM (8:00 PM) right after sunset tea at Rambagh Palace. Your prescription is securely stored in your travel vault.`,
        actionSuggestion: `A glass of warm water will be ready at 19:55 PM.`,
        quickReplies: ['Call Rohan', 'Where is my prescription?', 'What time is dinner?']
      };
    }

    return {
      text: `Namaste Dadaji! I am here to help you anytime. You are staying in Suite 104 on the ground floor with zero steps. Rohan and the family are with you, and everything is arranged at your gentle pace.`,
      quickReplies: ['When is lunch?', 'Will there be stairs?', 'Listen to today\'s plan']
    };
  }

  // KABIR (KID MODE)
  if (currentUser.id === 'kabir') {
    if (q.includes('elephant') || q.includes('animal') || q.includes('camel') || q.includes('ride')) {
      return {
        text: `Hey Captain Kabir! 🌟 Tonight at Chokhi Dhani there is an authentic royal camel ride waiting for you! And on Day 3, we are visiting an Elephant sanctuary where you can feed baby elephants fresh sugarcane!`,
        actionSuggestion: `Mission: Earn your 'Desert Explorer' badge tonight!`,
        quickReplies: ['When do we get ice cream?', 'Where is Uncle Vikram?', 'I want to see the Fort!']
      };
    }

    if (q.includes('ice cream') || q.includes('hungry') || q.includes('snack') || q.includes('food')) {
      return {
        text: `Yum! 🍦 Uncle Vikram promised kulfi and mango ice cream right after the City Palace visit around 5:00 PM. No spicy food for you—your favorite paneer roll is ordered!`,
        quickReplies: ['Show me my badges', 'How much time left?', 'Play scavenger hunt']
      };
    }

    return {
      text: `Hey Kabir! You have 2 explorer quests open today: 1) Spot the royal peacocks in the garden, and 2) Watch the puppet dance! You're currently at Level 3 Desert Scout!`,
      quickReplies: ['What are we doing next?', 'Show my passport stamps', 'Emergency: Where is family?']
    };
  }

  // PRIYA (STRICT JAIN / VEGAN)
  if (currentUser.id === 'priya') {
    if (q.includes('food') || q.includes('dinner') || q.includes('jain') || q.includes('lunch') || q.includes('menu')) {
      return {
        text: `Hi Priya! I have audited the Day 2 lunch originally booked at Handi Grill. Because Handi has a shared non-veg kitchen and no dedicated Jain counter, I flagged a conflict for Rohan. We have swapped it for Surya Mahal Heritage Thali, which has a separate certified Jain kitchen with zero root vegetables (no onion, garlic, or potatoes).`,
        actionSuggestion: `Conflict resolved: Certified Jain thali confirmed.`,
        quickReplies: ['Check tonight dinner menu', 'What time is our next stop?', 'See my expense share']
      };
    }
  }

  // ROHAN (PLANNER SUPER-AGENT)
  if (currentUser.id === 'rohan') {
    const activePoll = polls.find(p => p.status === 'active');
    return {
      text: `Executive Briefing for Rohan: Group alignment is currently 88%. Dadaji's mobility accommodation at Amber Fort is queued with the tourism board. ${
        activePoll ? `The afternoon voting poll has 5 out of 6 responses; Heritage Puppet Workshop currently leads with highest welfare.` : `All events on track.`
      } Total group spend is ₹79,300 across 4 expenses, and the settlement engine has minimized bilateral IOUs down to 2 simple transfers.`,
      actionSuggestion: `Proactive recommendation: Add a 30-minute tea buffer after Amber Fort to prevent Dadaji knee fatigue.`,
      quickReplies: ['Resolve afternoon poll', 'View debt settlement graph', 'Send WhatsApp summary']
    };
  }

  // GENERAL COMPANION
  return {
    text: `Hi ${currentUser.name}! The next scheduled activity is "${itinerary[0]?.title}" at ${itinerary[0]?.time}. Current airport status: All flights on time, rendezvous point at T2 Gate 4.`,
    quickReplies: ['What is the itinerary for today?', 'Who owes what on expenses?', 'Vote on afternoon activity']
  };
}
