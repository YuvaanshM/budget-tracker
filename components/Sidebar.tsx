"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useExpenseModal } from "@/context/ExpenseModalContext";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: HomeIcon },
  { href: "/analytics", label: "Analytics", icon: AnalyticsIcon },
  { href: "/history", label: "History", icon: HistoryIcon },
  { href: "/budgets", label: "Budgets", icon: BudgetsIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { openAddModal } = useExpenseModal();

  return (
    <aside
      className="fixed left-0 top-0 z-30 hidden h-screen flex-col border-r border-white/10 bg-zinc-900/95 backdrop-blur-md md:flex"
      aria-label="Main navigation"
    >
      <div className="flex h-full w-16 flex-col gap-1 p-3 xl:w-56 xl:px-4 xl:py-5">
        {/* Logo / Brand - compact on small, full on large; links to dashboard (app home) */}
        <Link
          href="/dashboard"
          className="mb-4 flex items-center gap-2 rounded-xl px-1 py-2 transition-colors hover:bg-white/5 xl:px-2"
          aria-label="Go to dashboard"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lg">
            💰
          </span>
          <span className="hidden text-sm font-semibold text-zinc-100 xl:inline">
            Budget
          </span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors xl:px-3 ${
                  isActive
                    ? "bg-[#2E8B57] text-white"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                }`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="hidden xl:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Add transaction – bottom left of sidebar */}
        <div className="mt-auto flex justify-start pb-2 xl:pb-3">
          <button
            type="button"
            onClick={openAddModal}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2E8B57] text-white transition-transform hover:scale-105 hover:bg-[#247a4a] focus:outline-none focus:ring-2 focus:ring-[#2E8B57] focus:ring-offset-2 focus:ring-offset-zinc-900 xl:h-11 xl:w-11"
            aria-label="Add transaction"
          >
            <PlusIcon className="h-5 w-5 xl:h-6 xl:w-6" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function AnalyticsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function BudgetsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
