// src/lib/api/liveDataService.ts

export interface LiveWeatherTelemetry {
  destination: string;
  temperatureC: number;
  apparentTempC: number;
  humidity: number;
  windSpeedKmh: number;
  condition: string;
  isDay: boolean;
  updatedAt: string;
}

export interface LiveForexRates {
  baseCurrency: string;
  rates: {
    JPY: number;
    USD: number;
    EUR: number;
  };
  lastUpdated: string;
}

export interface LivePlaceResult {
  displayName: string;
  lat: number;
  lng: number;
}

/**
 * WMO Weather interpretation code mapping
 */
function interpretWeatherCode(code: number): string {
  if (code === 0) return 'Clear Sky';
  if (code === 1 || code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code >= 45 && code <= 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 65) return 'Rain Showers';
  if (code >= 71 && code <= 77) return 'Snow Flurries';
  if (code >= 80 && code <= 82) return 'Heavy Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Fair Conditions';
}

/**
 * 1. Fetches Live Real-Time Weather (Open-Meteo - No API Key Required)
 * Default coordinates: Kyoto, Japan (Lat: 35.0116, Lng: 135.7681)
 */
export async function fetchLiveWeather(
  lat: number = 35.0116,
  lng: number = 135.7681,
  cityName: string = 'Kyoto, Japan'
): Promise<LiveWeatherTelemetry> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&timezone=auto`;
    const res = await fetch(url, { next: { revalidate: 300 } }); // Cache for 5 mins
    
    if (!res.ok) throw new Error('Weather API error');
    const data = await res.json();
    const curr = data.current;

    return {
      destination: cityName,
      temperatureC: Math.round(curr.temperature_2m),
      apparentTempC: Math.round(curr.apparent_temperature),
      humidity: curr.relative_humidity_2m,
      windSpeedKmh: Math.round(curr.wind_speed_10m),
      condition: interpretWeatherCode(curr.weather_code),
      isDay: curr.is_day === 1,
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  } catch {
    // Graceful offline fallback
    return {
      destination: cityName,
      temperatureC: 19,
      apparentTempC: 18,
      humidity: 55,
      windSpeedKmh: 12,
      condition: 'Clear Sky',
      isDay: true,
      updatedAt: 'Cached Offline',
    };
  }
}

/**
 * 2. Fetches Live Global Exchange Rates (ExchangeRate-API - No Key Required)
 * Converts base INR to live JPY, USD, and EUR.
 */
export async function fetchLiveForexRates(): Promise<LiveForexRates> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/INR', {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    
    if (!res.ok) throw new Error('Forex API error');
    const data = await res.json();

    return {
      baseCurrency: 'INR',
      rates: {
        JPY: Number((data.rates?.JPY || 1.81).toFixed(2)),
        USD: Number((data.rates?.USD || 0.012).toFixed(4)),
        EUR: Number((data.rates?.EUR || 0.011).toFixed(4)),
      },
      lastUpdated: new Date().toLocaleDateString(),
    };
  } catch {
    return {
      baseCurrency: 'INR',
      rates: { JPY: 1.81, USD: 0.012, EUR: 0.011 },
      lastUpdated: 'Cached',
    };
  }
}

/**
 * 3. Live Location & Geocoding Search (OpenStreetMap Nominatim - No Key Required)
 */
export async function searchLiveLocation(query: string): Promise<LivePlaceResult[]> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&limit=3`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TravelOS-Academic-Agent/1.0' },
    });
    if (!res.ok) return [];
    const data = await res.json();

    return data.map((item: any) => ({
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
  } catch {
    return [];
  }
}
