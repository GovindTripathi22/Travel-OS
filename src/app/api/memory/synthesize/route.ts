// src/app/api/memory/synthesize/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveWeatherByKey } from '@/lib/api/webFetchService';

export async function POST(req: NextRequest) {
  try {
    const { day = 1, memories = [], tripTitle = 'Rajasthan Family Expedition' } = await req.json();

    // 1. Fetch real-world weather context for authentic memory narration
    const weather = await fetchLiveWeatherByKey('Jaipur', 26.9124, 75.7873);

    // 2. If Groq API Key is provided, dynamically synthesize the memory using Llama-3.3-70B
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey && groqKey.trim().length > 10 && !groqKey.includes('your_')) {
      try {
        const prompt = `Write a nostalgic, poetic 3-sentence travel diary entry summarizing Day ${day} of "${tripTitle}".
Incorporate the real weather conditions: ${weather.tempC}°C, ${weather.description}.
Three generations traveled together (Dadaji the elder, Rohan the planner, Kabir the young child).
Highlight how frictionless the day was. Also provide 4 short bullet highlights.
Output in JSON with keys: "title", "story", "highlights" (array of 4 strings).`;

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.7,
          }),
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          const parsed = JSON.parse(data.choices[0].message.content);
          return NextResponse.json({
            success: true,
            engine: 'groq-llama-3.3-70b-versatile',
            data: {
              title: parsed.title || `Day ${day} Chronicles: Harmony in the Pink City`,
              story: parsed.story,
              highlights: parsed.highlights || [],
              tripTitle,
              photoCount: memories.length,
              weatherContext: weather,
            },
          });
        }
      } catch (groqErr) {
        console.warn('[Groq Memory Synthesis] Error, falling back to static template:', groqErr);
      }
    }

    // 3. Resilient Fallback Template
    const title = `Day ${day} Chronicles: Harmony in the Pink City`;
    const story = `From the moment the wheels touched down under ${weather.tempC}°C ${weather.description.toLowerCase()} skies, the expedition unfolded like a vivid Marwari painting. With airport logistics effortlessly aligned, the family gathered at Rambagh Palace under the shade of blooming bougainvillea. Dadaji beamed as Kabir chased peacocks through the marble courtyards, while Priya enjoyed the authentic royal feast without a single dietary worry. By evening, as folk music echoed across the fort bastions, the collective memory was sealed: a trip where no one felt burdened, and everyone felt truly seen.`;

    const highlights = [
      'Airport rendezvous without a single lost phone call',
      `Comfortable travel under ${weather.tempC}°C weather`,
      'Dadaji comfortably observed the folk dance with zero stair fatigue',
      'Kabir unlocked Level 3 Desert Explorer badge',
    ];

    return NextResponse.json({
      success: true,
      engine: 'template-synthesizer',
      data: {
        title,
        story,
        highlights,
        tripTitle,
        photoCount: memories.length,
        weatherContext: weather,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
