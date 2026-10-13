import { NextRequest, NextResponse } from 'next/server';
import { detectTripConflicts } from '@/lib/algorithms/conflictDetector';

export async function POST(req: NextRequest) {
  try {
    const { items, users } = await req.json();
    const conflicts = detectTripConflicts(items || [], users || []);
    return NextResponse.json({ success: true, conflicts });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
