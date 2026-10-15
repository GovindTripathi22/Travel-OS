// src/app/api/live-data/route.ts

import { NextRequest, NextResponse } from 'next/server';
import {
  fetchLiveWeatherByKey,
  fetchLiveForexByKey,
  fetchLiveNearbyPlaces,
} from '@/lib/api/webFetchService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city') || 'Kyoto';
    const lat = parseFloat(searchParams.get('lat') || '35.0116');
    const lng = parseFloat(searchParams.get('lng') || '135.7681');
    const currency = searchParams.get('currency') || 'INR';

    // Parallel fetch across live providers
    const [weather, forex, placesTourism, placesHealth] = await Promise.all([
      fetchLiveWeatherByKey(city, lat, lng),
      fetchLiveForexByKey(currency),
      fetchLiveNearbyPlaces(lat, lng, 'tourism'),
      fetchLiveNearbyPlaces(lat, lng, 'healthcare'),
    ]);

    // Active key status for observability
    const groqKey = process.env.GROQ_API_KEY;
    const tavilyKey = process.env.TAVILY_API_KEY;
    const owmKey = process.env.OPENWEATHER_API_KEY;
    const geoKey = process.env.GEOAPIFY_API_KEY;
    const erKey = process.env.EXCHANGERATE_API_KEY;

    const isLive = (k: string | undefined) =>
      Boolean(k && k.length > 5 && !k.includes('your_') && !k.includes('placeholder'));

    return NextResponse.json({
      success: true,
      city,
      weather,
      forex,
      places: {
        attractions: placesTourism,
        healthcare: placesHealth,
      },
      activeKeys: {
        groq: isLive(groqKey),
        tavily: isLive(tavilyKey),
        openWeather: isLive(owmKey),
        geoapify: isLive(geoKey),
        exchangeRate: isLive(erKey),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch live feeds' },
      { status: 500 }
    );
  }
}
