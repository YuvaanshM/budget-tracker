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

const ACCENT_GREEN = "#2E8B57";
const CHART_COLORS = [
  ACCENT_GREEN,
  "#059669",
  "#0d9488",
  "#047857",
  "#065f46",
  "#134e4a",
  "#15803d",
  "#166534",
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
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 flex items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Income, expenses, and spending breakdown
          </p>
        </header>

        {/* Summary cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            label="Monthly Income"
            value={formatCurrency(monthlyIncome)}
            valueColor="text-[#2E8B57]"
          />
          <SummaryCard
            label="Monthly Expenses"
            value={formatCurrency(monthlyExpenses)}
            valueColor="text-amber-600"
          />
          <SummaryCard
            label="Savings Rate"
            value={
              savingsRate != null ? `${savingsRate}%` : "—"
            }
            valueColor="text-gray-900"
          />
        </section>

        {/* Expense Breakdown and Top Spending – side by side, equal size */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Expense Breakdown (percent bar chart) */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-gray-600">
              Expense Breakdown
            </h2>
            <select
              value={breakdownPeriod}
              onChange={(e) => setBreakdownPeriod(e.target.value as Period)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs font-medium text-gray-700 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
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
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={false}
                  height={56}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
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
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-gray-600">
              Top Spending Categories
            </h2>
            <select
              value={topSpendingPeriod}
              onChange={(e) => setTopSpendingPeriod(e.target.value as Period)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs font-medium text-gray-700 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
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
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={false}
                  height={56}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `$${v / 1000}k` : `$${v}`)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                  }}
                  formatter={(value) => [formatCurrency(Number(value) || 0), "Spent"]}
                  labelFormatter={(name) => name}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#2E8B57" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No spending in this period" />
          )}
          </div>
        </section>

        {/* Spending over time – full-width row underneath */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-gray-600">
              Spending over time
            </h2>
            <select
              value={trendRange}
              onChange={(e) => setTrendRange(e.target.value as "week" | "month" | "year")}
              className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs font-medium text-gray-700 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
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
                    <stop offset="0%" stopColor="#2E8B57" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#2E8B57" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                  }}
                  labelStyle={{ color: "#374151" }}
                  formatter={(value: number | undefined) => [value != null ? formatCurrency(value) : "—", "Spent"]}
                  labelFormatter={(label) => label}
                />
                <Area
                  type="monotone"
                  dataKey="spent"
                  stroke="#2E8B57"
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
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-600 mb-2">
            Spending Insights
          </h2>
          <p className="text-sm text-gray-500">
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
    <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-[transform,border-color] hover:scale-[1.02] hover:border-gray-300">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
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
    <div className="flex h-64 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-500">
      {message}
    </div>
  );
}
