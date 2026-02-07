/**
 * Help / About page – Description of the Budget Tracker app.
 * Sleto Glassmorphic Dark (DesignDoc.md).
 */

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-zinc-950 p-6 md:p-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <header>
          <h1 className="text-2xl font-semibold text-zinc-50">About Budget Tracker</h1>
          <p className="mt-1 text-sm text-zinc-400">
            What this app does and how to use it
          </p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <h2 className="text-lg font-medium text-zinc-100">What is Budget Tracker?</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Budget Tracker is a personal finance app that helps you track income and expenses,
            set spending limits by category, and see your financial health at a glance. You can
            view spending trends over time, see where your money goes by category, and get
            alerts when you approach or exceed your budgets.
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <h2 className="text-lg font-medium text-zinc-100">Main features</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-400">
            <li><strong className="text-zinc-300">Dashboard</strong> — Overview of income, expenses, remaining budget, spending trends, and recent transactions.</li>
            <li><strong className="text-zinc-300">History</strong> — Search and filter past transactions; edit or delete from a slide-over panel.</li>
            <li><strong className="text-zinc-300">Budgets & Alerts</strong> — Set monthly limits per category and see progress; get notified at 50%, 90%, and 100% of each budget.</li>
            <li><strong className="text-zinc-300">Settings</strong> — Update your profile picture and email, set currency and preferences, export or manage your data.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <h2 className="text-lg font-medium text-zinc-100">Budget notifications</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Use the bell icon in the top bar to see budget alerts. You’ll be notified when a
            category budget reaches <strong className="text-zinc-300">50%</strong> (half used),
            <strong className="text-zinc-300"> 90%</strong> (almost at the limit), and
            <strong className="text-zinc-300"> 100%</strong> (limit reached or exceeded).
          </p>
        </section>
      </div>
    </div>
  );
}
