import { NextRequest, NextResponse } from 'next/server';
import { generateCompanionResponse } from '@/lib/agents/companionAgent';
import { runEdgeSlmNlu } from '@/lib/slm/edgeSlmEngine';
import {
  INITIAL_USERS,
  INITIAL_ITINERARY,
  INITIAL_POLLS,
  INITIAL_EXPENSES,
  INITIAL_TRAVEL_STATUS,
  INITIAL_DOCUMENTS,
} from '@/lib/state/mockData';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body.message || body.prompt || body.query || '';
    const activeDay = body.activeDay || 1;
    const { userId, allUsers, itinerary, polls } = body;

    const usersList = allUsers || INITIAL_USERS;
    const currentUser = usersList.find((u: any) => u.id === userId) || usersList[0];

    // 1. Run Sub-5ms Local Edge SLM Analysis
    const slmResult = runEdgeSlmNlu(message, { activeDay, currentUser, users: usersList });

    // 2. Generate Companion Contextual Response
    const context = {
      currentUser,
      itinerary: itinerary || INITIAL_ITINERARY,
      polls: polls || INITIAL_POLLS,
      expenses: INITIAL_EXPENSES,
      travelStatus: INITIAL_TRAVEL_STATUS,
      documents: INITIAL_DOCUMENTS,
      allUsers: usersList,
    };

    const companionRes = generateCompanionResponse(message, context);

    return NextResponse.json({
      ok: true,
      success: true,
      engine: slmResult.model,
      latencyMs: slmResult.latencyMs,
      intents: slmResult.intents,
      reply: `Command confirmed. Executed ${slmResult.intents.length} autonomous task(s) in ${slmResult.latencyMs}ms.`,
      data: companionRes,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, success: false, error: error.message || 'Error processing assistant query' },
      { status: 500 }
    );
  }
}
