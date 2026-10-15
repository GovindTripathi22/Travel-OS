// src/app/api/live-data/route.ts

import { NextResponse } from 'next/server';
import { fetchLiveWeather, fetchLiveForexRates } from '@/lib/api/liveDataService';

export async function GET() {
  try {
    const [weather, forex] = await Promise.all([
      fetchLiveWeather(35.0116, 135.7681, 'Kyoto, Japan'),
      fetchLiveForexRates(),
    ]);

    return NextResponse.json({
      success: true,
      weather,
      forex,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch live feeds' },
      { status: 500 }
    );
  }
}
