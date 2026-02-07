"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTransactions } from "@/context/TransactionsContext";
import {
  getExpenseBreakdownByPeriod,
  getTopSpendingByPeriod,
  getSavingsRatePercent,
  getSpendingTrendDataForRange,
  type Period,
} from "@/lib/analytics";
import { formatCurrency } from "@/lib/formatCurrency";
import {
  getMonthlyExpensesTotal,
  getMonthlyIncomeTotal,
} from "@/lib/mockData";

const CHART_COLORS = [
  "#8b5cf6",
  "#06b6d4",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
];

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "week", label: "Per week" },
  { value: "month", label: "Per month" },
  { value: "year", label: "Per year" },
];

const TREND_RANGE_OPTIONS: { value: "week" | "month" | "year"; label: string }[] = [
  { value: "week", label: "Past week" },
  { value: "month", label: "Past month" },
  { value: "year", label: "Past year" },
];

export default function AnalyticsPage() {
  const { transactions, loading, error } = useTransactions();
  const [breakdownPeriod, setBreakdownPeriod] = useState<Period>("month");
  const [topSpendingPeriod, setTopSpendingPeriod] = useState<Period>("month");
  const [trendRange, setTrendRange] = useState<"week" | "month" | "year">("month");

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyIncome = getMonthlyIncomeTotal(transactions, currentMonth);
  const monthlyExpenses = getMonthlyExpensesTotal(transactions, currentMonth);
  const savingsRate = getSavingsRatePercent(monthlyIncome, monthlyExpenses);

  const expenseBreakdown = getExpenseBreakdownByPeriod(
    transactions,
    breakdownPeriod
  );
  const topSpending = getTopSpendingByPeriod(
    transactions,
    topSpendingPeriod,
    8
  );
  const spendingTrend = getSpendingTrendDataForRange(transactions, trendRange);
  const hasData = transactions.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-4 md:p-6 flex items-center justify-center">
        <p className="text-zinc-400">Loading…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 p-4 md:p-6 flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-zinc-50">Analytics</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Income, expenses, and spending breakdown
          </p>
        </header>

        {/* Summary cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            label="Monthly Income"
            value={formatCurrency(monthlyIncome)}
            valueColor="text-blue-400"
          />
          <SummaryCard
            label="Monthly Expenses"
            value={formatCurrency(monthlyExpenses)}
            valueColor="text-amber-400"
          />
          <SummaryCard
            label="Savings Rate"
            value={
              savingsRate != null ? `${savingsRate}%` : "—"
            }
            valueColor="text-zinc-50"
          />
        </section>

        {/* Expense Breakdown and Top Spending – side by side, equal size */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Expense Breakdown (percent bar chart) */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-zinc-400">
              Expense Breakdown
            </h2>
            <select
              value={breakdownPeriod}
              onChange={(e) => setBreakdownPeriod(e.target.value as Period)}
              className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs font-medium text-zinc-300 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
              aria-label="Breakdown period"
            >
              {PERIOD_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {expenseBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={expenseBreakdown}
                margin={{ top: 10, right: 10, left: 0, bottom: 24 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  tickLine={false}
                  angle={-35}
                  textAnchor="end"
                  height={56}
                />
                <YAxis
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#27272a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                  }}
                  formatter={(value, _name, item) => {
                    const p = item?.payload as { percent: number; value: number; name: string } | undefined;
                    if (!p) return [String(value), ""];
                    return [`${p.percent}% (${formatCurrency(p.value)})`, p.name];
                  }}
                />
                <Bar dataKey="percent" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {expenseBreakdown.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No expenses in this period" />
          )}
          </div>

          {/* Top Spending Categories (dollar bar chart) */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-zinc-400">
              Top Spending Categories
            </h2>
            <select
              value={topSpendingPeriod}
              onChange={(e) => setTopSpendingPeriod(e.target.value as Period)}
              className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs font-medium text-zinc-300 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
              aria-label="Top spending period"
            >
              {PERIOD_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {topSpending.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={topSpending}
                margin={{ top: 10, right: 10, left: 0, bottom: 24 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  tickLine={false}
                  angle={-35}
                  textAnchor="end"
                  height={56}
                />
                <YAxis
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `$${v / 1000}k` : `$${v}`)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#27272a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                  }}
                  formatter={(value) => [formatCurrency(Number(value) || 0), "Spent"]}
                  labelFormatter={(name) => name}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No spending in this period" />
          )}
          </div>
        </section>

        {/* Spending over time – full-width row underneath */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-zinc-400">
              Spending over time
            </h2>
            <select
              value={trendRange}
              onChange={(e) => setTrendRange(e.target.value as "week" | "month" | "year")}
              className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs font-medium text-zinc-300 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
              aria-label="Time range"
            >
              {TREND_RANGE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {hasData ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart
                data={spendingTrend}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="analyticsAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#27272a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                  }}
                  labelStyle={{ color: "#a1a1aa" }}
                  formatter={(value: number | undefined) => [value != null ? formatCurrency(value) : "—", "Spent"]}
                  labelFormatter={(label) => label}
                />
                <Area
                  type="monotone"
                  dataKey="spent"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#analyticsAreaGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No spending data yet" />
          )}
        </section>

        {/* Spending Insights placeholder */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <h2 className="text-sm font-medium text-zinc-400 mb-2">
            Spending Insights
          </h2>
          <p className="text-sm text-zinc-500">
            Insights and recommendations will appear here in a future update.
            You may see AI-generated summaries of your spending patterns or
            suggestions to improve your budget.
          </p>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor: string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 transition-[transform,border-color] hover:scale-[1.02] hover:border-white/20">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${valueColor}`}>
        {value}
      </p>
    </article>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-sm text-zinc-500">
      {message}
    </div>
  );
}
