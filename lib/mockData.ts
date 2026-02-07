/**
 * Shared mock data for Dashboard and History.
 * Replace with Supabase queries when Auth & DB are ready.
 */

export type Transaction = {
  id: string;
  date: string;
  category: string;
  categoryIcon: string;
  description: string;
  amount: number;
  isIncome: boolean;
};

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: "1", date: "2025-02-06", category: "Groceries", categoryIcon: "🛒", description: "Weekly groceries", amount: -85.5, isIncome: false },
  { id: "2", date: "2025-02-05", category: "Salary", categoryIcon: "💼", description: "Monthly salary", amount: 3200, isIncome: true },
  { id: "3", date: "2025-02-04", category: "Restaurants", categoryIcon: "🍽️", description: "Dinner out", amount: -42, isIncome: false },
  { id: "4", date: "2025-02-03", category: "Transport", categoryIcon: "🚗", description: "Gas station", amount: -55, isIncome: false },
  { id: "5", date: "2025-02-02", category: "Entertainment", categoryIcon: "🎬", description: "Movie tickets", amount: -28, isIncome: false },
  { id: "6", date: "2025-02-01", category: "Groceries", categoryIcon: "🛒", description: "Milk & bread", amount: -22, isIncome: false },
  { id: "7", date: "2025-01-31", category: "Utilities", categoryIcon: "💡", description: "Electric bill", amount: -120, isIncome: false },
  { id: "8", date: "2025-01-28", category: "Restaurants", categoryIcon: "🍽️", description: "Lunch", amount: -18, isIncome: false },
  { id: "9", date: "2025-01-25", category: "Transport", categoryIcon: "🚗", description: "Uber", amount: -32, isIncome: false },
  { id: "10", date: "2025-01-20", category: "Groceries", categoryIcon: "🛒", description: "Monthly groceries", amount: -180, isIncome: false },
];

/** Generate 30-day spending trend data (daily totals) for Area chart */
export function getSpendingTrendData(transactions: Transaction[]): { date: string; spent: number; label: string }[] {
  const today = new Date();
  const days: { date: string; spent: number; label: string }[] = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const spent = transactions
      .filter((t) => !t.isIncome && t.date === dateStr)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    days.push({
      date: dateStr,
      spent,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    });
  }
  return days;
}

/** Spending by category for Donut chart */
export function getSpendingByCategory(transactions: Transaction[]): { name: string; value: number }[] {
  const byCategory = new Map<string, number>();
  for (const t of transactions) {
    if (!t.isIncome) {
      const v = byCategory.get(t.category) ?? 0;
      byCategory.set(t.category, v + Math.abs(t.amount));
    }
  }
  return Array.from(byCategory.entries()).map(([name, value]) => ({ name, value }));
}

/** Budget type – links category to monthly limit */
export type Budget = {
  id: string;
  category: string;
  budgetLimit: number;
};

/** Mock budgets */
export const MOCK_BUDGETS: Budget[] = [
  { id: "b1", category: "Groceries", budgetLimit: 400 },
  { id: "b2", category: "Restaurants", budgetLimit: 150 },
  { id: "b3", category: "Transport", budgetLimit: 200 },
  { id: "b4", category: "Entertainment", budgetLimit: 100 },
  { id: "b5", category: "Utilities", budgetLimit: 250 },
];

/** Get spending per category for current month */
function getMonthlySpendingByCategory(transactions: Transaction[], yearMonth: string): Map<string, number> {
  const byCategory = new Map<string, number>();
  for (const t of transactions) {
    if (!t.isIncome && t.date.startsWith(yearMonth)) {
      const v = byCategory.get(t.category) ?? 0;
      byCategory.set(t.category, v + Math.abs(t.amount));
    }
  }
  return byCategory;
}

/** Budget with computed current spent (for current month) */
export type BudgetWithSpent = Budget & { currentSpent: number };

export function getBudgetsWithSpent(
  transactions: Transaction[],
  budgets: Budget[],
  yearMonth?: string
): BudgetWithSpent[] {
  const ym = yearMonth ?? new Date().toISOString().slice(0, 7);
  const spentByCategory = getMonthlySpendingByCategory(transactions, ym);
  return budgets.map((b) => ({
    ...b,
    currentSpent: spentByCategory.get(b.category) ?? 0,
  }));
}
