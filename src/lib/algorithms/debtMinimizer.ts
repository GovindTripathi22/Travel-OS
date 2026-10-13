import { Expense, Settlement, User } from '@/types';

export interface UserBalance {
  userId: string;
  net: number; // positive = is owed money, negative = owes money
}

/**
 * Computes net balances for all users based on expenses.
 */
export function calculateNetBalances(expenses: Expense[], users: User[]): Record<string, number> {
  const balances: Record<string, number> = {};
  users.forEach((u) => {
    balances[u.id] = 0;
  });

  for (const exp of expenses) {
    if (!exp.splitWithUserIds || exp.splitWithUserIds.length === 0) continue;
    const splitCount = exp.splitWithUserIds.length;
    const perPersonShare = exp.amount / splitCount;

    // Payer is credited the full amount
    balances[exp.paidByUserId] = (balances[exp.paidByUserId] || 0) + exp.amount;

    // Each participant in the split is debited their share
    for (const participantId of exp.splitWithUserIds) {
      balances[participantId] = (balances[participantId] || 0) - perPersonShare;
    }
  }

  // Round to 2 decimal places to avoid floating point anomalies
  Object.keys(balances).forEach((k) => {
    balances[k] = Math.round(balances[k] * 100) / 100;
  });

  return balances;
}

/**
 * Greedy Cash Flow Debt Minimization Algorithm.
 * Reduces O(N^2) pairwise debts to at most O(N-1) optimal bilateral settlements.
 */
export function minimizeDebts(
  balances: Record<string, number>,
  currency = 'INR'
): Settlement[] {
  const creditors: { userId: string; amount: number }[] = [];
  const debtors: { userId: string; amount: number }[] = [];

  for (const [userId, net] of Object.entries(balances)) {
    if (net > 0.01) {
      creditors.push({ userId, amount: net });
    } else if (net < -0.01) {
      debtors.push({ userId, amount: Math.abs(net) });
    }
  }

  // Sort descending by magnitude
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let cIdx = 0;
  let dIdx = 0;

  while (cIdx < creditors.length && dIdx < debtors.length) {
    const creditor = creditors[cIdx];
    const debtor = debtors[dIdx];

    const settledAmount = Math.min(creditor.amount, debtor.amount);
    const rounded = Math.round(settledAmount * 100) / 100;

    if (rounded > 0) {
      settlements.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount: rounded,
        currency,
      });
    }

    creditor.amount -= settledAmount;
    debtor.amount -= settledAmount;

    if (creditor.amount < 0.01) cIdx++;
    if (debtor.amount < 0.01) dIdx++;
  }

  return settlements;
}
