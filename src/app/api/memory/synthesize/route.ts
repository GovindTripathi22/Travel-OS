import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { day = 1, memories = [], tripTitle = 'Rajasthan Family Expedition' } = await req.json();

    const title = `Day ${day} Chronicles: Harmony in the Pink City`;
    const story = `From the moment the wheels touched down at Jaipur Airport, the trip unfolded like a vivid Marwari painting. With airport logistics effortlessly aligned, the family gathered at Rambagh Palace under the shade of blooming bougainvillea. Dadaji beamed as Kabir chased peacocks through the marble courtyards, while Priya enjoyed the authentic Jain royal feast without a single dietary worry. By evening, as folk music echoed across the fort bastions, the collective memory was sealed: a trip where no one felt burdened, and everyone felt truly seen.`;

    const highlights = [
      'Airport rendezvous without a single lost phone call',
      'Pre-vetted Royal Thali accommodated all 3 generations',
      'Dadaji comfortably observed the folk dance with zero stair fatigue',
      'Kabir unlocked Level 3 Desert Explorer badge',
    ];

    return NextResponse.json({
      success: true,
      data: {
        title,
        story,
        highlights,
        tripTitle,
        photoCount: memories.length,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
