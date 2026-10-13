import { NextRequest, NextResponse } from 'next/server';
import { resolveQuadraticPoll, resolveBordaCountPoll } from '@/lib/algorithms/mechanismVoting';

export async function POST(req: NextRequest) {
  try {
    const { poll } = await req.json();
    if (!poll) {
      return NextResponse.json({ success: false, error: 'Poll payload required' }, { status: 400 });
    }

    const result = poll.mechanismType === 'quadratic'
      ? resolveQuadraticPoll(poll)
      : resolveBordaCountPoll(poll);

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
