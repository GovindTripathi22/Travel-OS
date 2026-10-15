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
    const persona = body.persona || 'standard';
    const activeDay = body.activeDay || 1;
    const { userId, allUsers, itinerary, polls } = body;

    const usersList = allUsers || INITIAL_USERS;
    const currentUser = usersList.find((u: any) => u.id === userId) || usersList[0];

    // 1. Run Sub-5ms Local Edge SLM Analysis for Intent & Entity Extraction
    const slmResult = runEdgeSlmNlu(message, { activeDay, currentUser, users: usersList });

    // 2. Local Context for Fallback
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

    const apiKey = process.env.GEMINI_API_KEY;

    // If Gemini API Key is set, query live Gemini 1.5 Flash
    if (apiKey && apiKey.trim().length > 5 && !apiKey.includes('your_actual')) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const prompt = `You are J.A.R.V.I.S., an intelligent travel co-pilot operating in ${persona} mode for a family expedition.
Be concise, proactive, clear, and direct. Respond to the user's inquiry: "${message}"`;

        const geminiRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const replyText =
            geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
            `Command confirmed. Executed ${slmResult.intents.length} autonomous task(s) in ${slmResult.latencyMs}ms.`;

          return NextResponse.json({
            ok: true,
            success: true,
            engine: 'gemini-1.5-flash',
            latencyMs: slmResult.latencyMs,
            intents: slmResult.intents,
            reply: replyText,
            data: companionRes,
          });
        }
      } catch (geminiError) {
        console.warn('[Gemini API] Fallback to Edge SLM:', geminiError);
      }
    }

    // Default: Sub-5ms Local Edge SLM + Companion Response
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
