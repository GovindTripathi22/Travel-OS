import { NextRequest, NextResponse } from 'next/server';
import { calculateNetBalances, minimizeDebts } from '@/lib/algorithms/debtMinimizer';

export async function POST(req: NextRequest) {
  try {
    const { expenses, users, currency = 'INR' } = await req.json();
    const balances = calculateNetBalances(expenses || [], users || []);
    const settlements = minimizeDebts(balances, currency);

    return NextResponse.json({
      success: true,
      balances,
      settlements,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
