/**
 * Analytics helpers: date ranges, expense breakdown by period, spending trends.
 */

import type { Transaction } from "@/lib/mockData";

export type Period = "week" | "month" | "year";

export function getDateRangeForPeriod(
  period: Period
): { start: string; end: string } {
  const today = new Date();
  const end = today.toISOString().slice(0, 10);
  const start = (() => {
    const d = new Date(today);
    if (period === "week") {
      d.setDate(d.getDate() - 6);
      return d.toISOString().slice(0, 10);
    }
    if (period === "month") {
      d.setDate(d.getDate() - 29);
      return d.toISOString().slice(0, 10);
    }
    // year: Jan 1 of current year
    d.setMonth(0);
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  })();
  return { start, end };
}

function filterExpensesInRange(
  transactions: Transaction[],
  start: string,
  end: string
): Transaction[] {
  return transactions.filter(
    (t) =>
      !t.isIncome &&
      t.date >= start &&
      t.date <= end
  );
}

export type ExpenseBreakdownItem = { name: string; value: number; percent: number };

export function getExpenseBreakdownByPeriod(
  transactions: Transaction[],
  period: Period
): ExpenseBreakdownItem[] {
  const { start, end } = getDateRangeForPeriod(period);
  const expenses = filterExpensesInRange(transactions, start, end);
  const byCategory = new Map<string, number>();
  let total = 0;
  for (const t of expenses) {
    const amt = Math.abs(t.amount);
    byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + amt);
    total += amt;
  }
  if (total === 0) return [];
  return Array.from(byCategory.entries())
    .map(([name, value]) => ({
      name,
      value,
      percent: Math.round((value / total) * 1000) / 10,
    }))
    .sort((a, b) => b.value - a.value);
}

export function getTopSpendingByPeriod(
  transactions: Transaction[],
  period: Period,
  limit: number = 10
): { name: string; value: number }[] {
  const { start, end } = getDateRangeForPeriod(period);
  const expenses = filterExpensesInRange(transactions, start, end);
  const byCategory = new Map<string, number>();
  for (const t of expenses) {
    const amt = Math.abs(t.amount);
    byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + amt);
  }
  return Array.from(byCategory.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export type SpendingTrendPoint = { date: string; spent: number; label: string };

export function getSpendingTrendDataForRange(
  transactions: Transaction[],
  range: "week" | "month" | "year"
): SpendingTrendPoint[] {
  const today = new Date();

  if (range === "week") {
    const points: SpendingTrendPoint[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const spent = transactions
        .filter((t) => !t.isIncome && t.date === dateStr)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      points.push({
        date: dateStr,
        spent,
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      });
    }
    return points;
  }

  if (range === "month") {
    const points: SpendingTrendPoint[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const spent = transactions
        .filter((t) => !t.isIncome && t.date === dateStr)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      points.push({
        date: dateStr,
        spent,
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      });
    }
    return points;
  }

  // year: 52 weeks, spending per week
  const points: SpendingTrendPoint[] = [];
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  let weekEnd = new Date(today);
  weekEnd.setHours(23, 59, 59, 999);
  for (let w = 51; w >= 0; w--) {
    const weekStart = new Date(weekEnd.getTime() - weekMs + 1);
    const startStr = weekStart.toISOString().slice(0, 10);
    const endStr = weekEnd.toISOString().slice(0, 10);
    const spent = transactions
      .filter(
        (t) =>
          !t.isIncome &&
          t.date >= startStr &&
          t.date <= endStr
      )
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    points.push({
      date: startStr,
      spent,
      label: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    });
    weekEnd = new Date(weekStart.getTime() - 1);
  }
  return points.reverse();
}

/** Savings rate for a month: (income - expenses) / income * 100. Returns null only when income is 0 or invalid. */
export function getSavingsRatePercent(
  income: number,
  expenses: number
): number | null {
  if (income == null || income <= 0 || !Number.isFinite(income)) return null;
  const rate = ((income - expenses) / income) * 100;
  return Number.isFinite(rate) ? Math.round(rate * 10) / 10 : null;
}
