/**
 * Dashboard (Home) – At-a-glance financial health.
 * Design: DesignDoc.md §2.1 – Sleto Glassmorphic Dark.
 * Placeholders for charts and data to be implemented later.
 */

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Top Row: Three summary cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            label="Total Income"
            value="$0.00"
            ariaLabel="Total income placeholder"
          />
          <SummaryCard
            label="Total Expenses"
            value="$0.00"
            ariaLabel="Total expenses placeholder"
          />
          <SummaryCard
            label="Remaining Budget"
            value="$0.00"
            ariaLabel="Remaining budget placeholder"
          />
        </section>

        {/* Middle Row: Charts – 60% Area Chart, 40% Donut Chart */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <ChartPlaceholder
              title="Spending trends (30 days)"
              type="area"
            />
          </div>
          <div className="lg:col-span-2">
            <ChartPlaceholder
              title="Spending by category"
              type="donut"
            />
          </div>
        </section>

        {/* Bottom Row: Alerts list + Recent transactions */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AlertsListPlaceholder />
          <RecentTransactionsPlaceholder />
        </section>
      </div>
    </div>
  );
}

// --- Reusable skeleton components (placeholders) ---

function SummaryCard({
  label,
  value,
  ariaLabel,
}: {
  label: string;
  value: string;
  ariaLabel: string;
}) {
  return (
    <article
      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 transition-[transform,border-color] hover:scale-[1.02] hover:border-white/20"
      aria-label={ariaLabel}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </article>
  );
}

function ChartPlaceholder({
  title,
  type,
}: {
  title: string;
  type: "area" | "donut";
}) {
  return (
    <div
      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 transition-[transform,border-color] hover:scale-[1.02] hover:border-white/20"
      aria-label={`${type} chart placeholder: ${title}`}
    >
      <h2 className="text-sm font-medium text-zinc-400 mb-4">{title}</h2>
      <div className="aspect-[4/3] flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-zinc-500 text-sm">
        {type === "area" ? "Area chart placeholder" : "Donut chart placeholder"}
      </div>
    </div>
  );
}

function AlertsListPlaceholder() {
  return (
    <div
      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 transition-[transform,border-color] hover:scale-[1.02] hover:border-white/20"
      aria-label="Upcoming bills and budget alerts placeholder"
    >
      <h2 className="text-sm font-medium text-zinc-400 mb-4">
        Upcoming Bills / Budget Alerts
      </h2>
      <ul className="space-y-2 text-sm text-zinc-500">
        <li className="rounded-lg border border-white/5 bg-white/5 p-3">
          Placeholder item 1
        </li>
        <li className="rounded-lg border border-white/5 bg-white/5 p-3">
          Placeholder item 2
        </li>
        <li className="rounded-lg border border-white/5 bg-white/5 p-3">
          Placeholder item 3
        </li>
      </ul>
    </div>
  );
}

function RecentTransactionsPlaceholder() {
  return (
    <div
      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 transition-[transform,border-color] hover:scale-[1.02] hover:border-white/20"
      aria-label="Recent transactions placeholder"
    >
      <h2 className="text-sm font-medium text-zinc-400 mb-4">
        Recent transactions (5)
      </h2>
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
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="border-b border-white/5">
                <td className="py-2 pr-2">—</td>
                <td className="py-2 pr-2">—</td>
                <td className="py-2 pr-2">—</td>
                <td className="py-2 text-right">—</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
