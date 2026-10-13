import { NextRequest, NextResponse } from 'next/server';
import { generateCompanionResponse } from '@/lib/agents/companionAgent';
import { INITIAL_USERS, INITIAL_ITINERARY, INITIAL_POLLS, INITIAL_EXPENSES, INITIAL_TRAVEL_STATUS, INITIAL_DOCUMENTS } from '@/lib/state/mockData';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, userId, allUsers, itinerary, polls } = body;

    const usersList = allUsers || INITIAL_USERS;
    const currentUser = usersList.find((u: any) => u.id === userId) || usersList[0];

    const context = {
      currentUser,
      itinerary: itinerary || INITIAL_ITINERARY,
      polls: polls || INITIAL_POLLS,
      expenses: INITIAL_EXPENSES,
      travelStatus: INITIAL_TRAVEL_STATUS,
      documents: INITIAL_DOCUMENTS,
      allUsers: usersList,
    };

    const response = generateCompanionResponse(query || '', context);

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error processing assistant query' },
      { status: 500 }
    );
  }
}
