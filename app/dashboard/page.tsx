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
import { formatCurrency } from "@/lib/formatCurrency";
import {
  getSpendingByCategory,
  getSpendingTrendData,
  type Transaction,
} from "@/lib/mockData";

const CHART_COLORS = [
  "#8b5cf6",
  "#06b6d4",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#ec4899",
];

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function DashboardPage() {
  const transactions: Transaction[] = [];
  const hasData = transactions.length > 0;

  const totalIncome = transactions
    .filter((t) => t.isIncome)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => !t.isIncome)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const remainingBudget = totalIncome - totalExpenses;

  const spendingTrend = getSpendingTrendData(transactions);
  const spendingByCategory = getSpendingByCategory(transactions);
  const recentTransactions = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Top Row: Three summary cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            label="Total Income"
            value={formatCurrency(totalIncome)}
            valueColor="text-emerald-400"
            ariaLabel="Total income"
          />
          <SummaryCard
            label="Total Expenses"
            value={formatCurrency(totalExpenses)}
            valueColor="text-red-400"
            ariaLabel="Total expenses"
          />
          <SummaryCard
            label="Remaining Budget"
            value={formatCurrency(remainingBudget)}
            valueColor={remainingBudget >= 0 ? "text-zinc-50" : "text-red-400"}
            ariaLabel="Remaining budget"
          />
        </section>

        {/* Middle Row: Charts – 60% Area, 40% Donut */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <ChartCard title="Spending trends (30 days)" type="area">
              {hasData ? (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart
                    data={spendingTrend}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
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
                        backgroundColor: "#27272a",
                        border: "1px solid rgba(255,255,255,0.1)",
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
      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 transition-[transform,border-color] hover:scale-[1.02] hover:border-white/20"
      aria-label={ariaLabel}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${valueColor}`}>{value}</p>
    </article>
  );
}

function ChartCard({
  title,
  type,
  children,
}: {
  title: string;
  type: "area" | "donut";
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 transition-[transform,border-color] hover:scale-[1.02] hover:border-white/20"
      aria-label={`${type} chart: ${title}`}
    >
      <h2 className="text-sm font-medium text-zinc-400 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function EmptyChartPlaceholder({ message }: { message: string }) {
  return (
    <div className="flex h-60 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-zinc-500 text-sm">
      {message}
    </div>
  );
}

function AlertsCard() {
  return (
    <div
      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 transition-[transform,border-color] hover:scale-[1.02] hover:border-white/20"
      aria-label="Upcoming bills and budget alerts"
    >
      <h2 className="text-sm font-medium text-zinc-400 mb-4">
        Upcoming Bills / Budget Alerts
      </h2>
      <div className="rounded-xl border border-white/5 bg-white/5 p-6 text-center text-sm text-zinc-500">
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
      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 transition-[transform,border-color] hover:scale-[1.02] hover:border-white/20"
      aria-label="Recent transactions"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-zinc-400">Recent transactions</h2>
        <Link
          href="/history"
          className="text-sm font-medium text-purple-400 hover:text-purple-300"
        >
          View all
        </Link>
      </div>
      {hasData ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-zinc-500">
                <th className="pb-2 pr-2">Date</th>
                <th className="pb-2 pr-2">Category</th>
                <th className="pb-2 pr-2">Description</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="text-zinc-400">
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-white/5 last:border-b-0">
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
                      tx.isIncome ? "text-emerald-400" : "text-red-400"
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
        <div className="rounded-xl border border-white/5 bg-white/5 p-6 text-center text-sm text-zinc-500">
          No expenses yet. Add your first transaction to get started.
        </div>
      )}
    </div>
  );
}
