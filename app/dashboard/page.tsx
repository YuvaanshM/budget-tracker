"use client";

import Link from "next/link";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTransactions } from "@/context/TransactionsContext";
import { getSpendingTrendDataForRange } from "@/lib/analytics";
import { formatCurrency } from "@/lib/formatCurrency";
import {
  getMonthlyExpensesTotal,
  getMonthlyIncomeTotal,
  getSpendingByCategory,
  type Transaction,
} from "@/lib/mockData";

const ACCENT_GREEN = "#2E8B57";
const CHART_COLORS = [
  ACCENT_GREEN,
  "#059669",
  "#0d9488",
  "#047857",
  "#065f46",
  "#134e4a",
];

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function DashboardPage() {
  const { transactions, loading, error } = useTransactions();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const totalIncome = getMonthlyIncomeTotal(transactions, currentMonth);
  const totalExpenses = getMonthlyExpensesTotal(transactions, currentMonth);
  const remainingBudget = totalIncome - totalExpenses;
  const hasData = transactions.length > 0;

  const spendingTrend = getSpendingTrendDataForRange(transactions, "month");
  const spendingByCategory = getSpendingByCategory(transactions);
  const recentTransactions = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-6 flex items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-6 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Top Row: Three summary cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            label="Total Income"
            value={formatCurrency(totalIncome)}
            valueColor="text-[#2E8B57]"
            ariaLabel="Total income"
          />
          <SummaryCard
            label="Total Expenses"
            value={formatCurrency(totalExpenses)}
            valueColor="text-red-500"
            ariaLabel="Total expenses"
          />
          <SummaryCard
            label="Remaining Budget"
            value={formatCurrency(remainingBudget)}
            valueColor={remainingBudget >= 0 ? "text-gray-900" : "text-red-500"}
            ariaLabel="Remaining budget"
          />
        </section>

        {/* Middle Row: Charts – 60% Area, 40% Donut */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <ChartCard title="Spending over time (past 30 days)" type="area">
              {hasData ? (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart
                    data={spendingTrend}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
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
                      fill="url(#areaGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartPlaceholder message="No spending data yet" />
              )}
            </ChartCard>
          </div>
          <div className="lg:col-span-2">
            <ChartCard title="Spending by category" type="donut">
              {spendingByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={spendingByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {spendingByCategory.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                      }}
                      formatter={(value: number | undefined) => (value != null ? formatCurrency(value) : "—")}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartPlaceholder message="No spending by category" />
              )}
            </ChartCard>
          </div>
        </section>

        {/* Bottom Row: Alerts + Recent transactions */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AlertsCard />
          <RecentTransactionsCard transactions={recentTransactions} hasData={hasData} />
        </section>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  valueColor,
  ariaLabel,
}: {
  label: string;
  value: string;
  valueColor: string;
  ariaLabel: string;
}) {
  return (
    <article
      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-[transform,border-color] hover:scale-[1.02] hover:border-gray-300"
      aria-label={ariaLabel}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${valueColor}`}>{value}</p>
    </article>
  );
}

function ChartCard({
  title,
  type,
  rightElement,
  children,
}: {
  title: string;
  type: "area" | "donut";
  rightElement?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-[transform,border-color] hover:scale-[1.02] hover:border-gray-300"
      aria-label={`${type} chart: ${title}`}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-gray-600">{title}</h2>
        {rightElement}
      </div>
      {children}
    </div>
  );
}

function EmptyChartPlaceholder({ message }: { message: string }) {
  return (
    <div className="flex h-60 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 text-gray-500 text-sm">
      {message}
    </div>
  );
}

function AlertsCard() {
  return (
    <div
      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-[transform,border-color] hover:scale-[1.02] hover:border-gray-300"
      aria-label="Upcoming bills and budget alerts"
    >
      <h2 className="text-sm font-medium text-gray-600 mb-4">
        Upcoming Bills / Budget Alerts
      </h2>
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center text-sm text-gray-500">
        No upcoming bills or budget alerts
      </div>
    </div>
  );
}

function RecentTransactionsCard({
  transactions,
  hasData,
}: {
  transactions: Transaction[];
  hasData: boolean;
}) {
  return (
    <div
      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-[transform,border-color] hover:scale-[1.02] hover:border-gray-300"
      aria-label="Recent transactions"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-600">Recent transactions</h2>
        <Link
          href="/history"
          className="text-sm font-medium text-[#2E8B57] hover:text-[#247a4a]"
        >
          View all
        </Link>
      </div>
      {hasData ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-2 pr-2">Date</th>
                <th className="pb-2 pr-2">Category</th>
                <th className="pb-2 pr-2">Description</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="text-gray-600">
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="py-2 pr-2">{formatDate(tx.date)}</td>
                  <td className="py-2 pr-2">
                    <span className="inline-flex items-center gap-1">
                      <span>{tx.categoryIcon}</span>
                      {tx.category}
                    </span>
                  </td>
                  <td className="py-2 pr-2 truncate max-w-[120px]">{tx.description}</td>
                  <td
                    className={`py-2 text-right font-medium ${
                      tx.isIncome ? "text-[#2E8B57]" : "text-red-500"
                    }`}
                  >
                    {tx.isIncome ? "+" : ""}{formatCurrency(Math.abs(tx.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center text-sm text-gray-500">
          No expenses yet. Add your first transaction to get started.
        </div>
      )}
    </div>
  );
}
