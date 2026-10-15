// src/app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { generateCompanionResponse } from '@/lib/agents/companionAgent';
import { runEdgeSlmNlu } from '@/lib/slm/edgeSlmEngine';
import { searchLiveWeb, fetchLiveWeatherByKey } from '@/lib/api/webFetchService';
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

    // 3. Optional Live Web Search Grounding (if query is factual / seeking info)
    const queryLower = message.toLowerCase();
    const needsWebSearch =
      queryLower.includes('ticket') ||
      queryLower.includes('price') ||
      queryLower.includes('weather') ||
      queryLower.includes('open') ||
      queryLower.includes('hours') ||
      queryLower.includes('restaurant') ||
      queryLower.includes('hotel') ||
      queryLower.includes('flight') ||
      queryLower.includes('train') ||
      queryLower.includes('japan') ||
      queryLower.includes('kyoto') ||
      queryLower.includes('jaipur');

    let webGroundingContext = '';
    let webSources: any[] = [];
    if (needsWebSearch) {
      try {
        const snippets = await searchLiveWeb(message, 2);
        if (snippets.length > 0) {
          webSources = snippets;
          webGroundingContext = `\n\nLive Internet Search Results:\n${snippets
            .map((s) => `- ${s.title}: ${s.content} (${s.url})`)
            .join('\n')}`;
        }
      } catch (err) {
        console.warn('[WebGrounding] Tavily/Web search skipped:', err);
      }
    }

    // 4. Try Groq Cloud Llama-3.3-70B (Fast Cloud AI Brain)
    const groqKey = process.env.GROQ_API_KEY;
    const hasValidGroq =
      groqKey && groqKey.trim().length > 10 && !groqKey.includes('your_') && !groqKey.includes('placeholder');

    if (hasValidGroq) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content: `You are J.A.R.V.I.S., the ultimate autonomous travel operating system co-pilot.
Persona: ${persona}.
Current destination: Kyoto, Japan / Jaipur, India.
Always be concise, proactive, authoritative, warm, and helpful. Max 2-3 sentences. Incorporate web search facts when provided.`,
              },
              {
                role: 'user',
                content: `${message}${webGroundingContext}`,
              },
            ],
            temperature: 0.5,
            max_tokens: 250,
          }),
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const reply = groqData.choices?.[0]?.message?.content?.trim();
          if (reply) {
            return NextResponse.json({
              ok: true,
              success: true,
              engine: 'groq-llama-3.3-70b-versatile',
              latencyMs: slmResult.latencyMs,
              intents: slmResult.intents,
              reply,
              sources: webSources,
              data: companionRes,
            });
          }
        }
      } catch (groqErr) {
        console.warn('[Groq API] Error, falling back:', groqErr);
      }
    }

    // 5. Try Gemini API fallback (if key exists)
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && geminiKey.trim().length > 5 && !geminiKey.includes('your_actual')) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
        const prompt = `You are J.A.R.V.I.S., an intelligent travel co-pilot operating in ${persona} mode for a family expedition.
Be concise, proactive, clear, and direct. Respond to the user's inquiry: "${message}"${webGroundingContext}`;

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
            sources: webSources,
            data: companionRes,
          });
        }
      } catch (geminiError) {
        console.warn('[Gemini API] Fallback to Edge SLM:', geminiError);
      }
    }

    // 6. Sub-5ms Local Edge SLM + Companion Response
    const replyBase =
      webSources.length > 0 && webSources[0].content
        ? `According to live web records: ${webSources[0].content.slice(0, 180)}...`
        : `Command confirmed. Executed ${slmResult.intents.length} autonomous task(s) in ${slmResult.latencyMs}ms.`;

    return NextResponse.json({
      ok: true,
      success: true,
      engine: slmResult.model,
      latencyMs: slmResult.latencyMs,
      intents: slmResult.intents,
      reply: replyBase,
      sources: webSources,
      data: companionRes,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, success: false, error: error.message || 'Error processing assistant query' },
      { status: 500 }
    );
  }
}
