"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useBudgetAlerts, getThresholdMessage } from "@/context/BudgetAlertsContext";
import { formatCurrency } from "@/lib/formatCurrency";

/**
 * Desktop header: notifications, help, profile (top-right).
 * Add transaction is in the left sidebar. Hidden on mobile; FABMobile is shown as floating button.
 */
export function Header() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { alerts, dismissAlert, unreadCount } = useBudgetAlerts();

  const getThresholdColor = (threshold: 50 | 90 | 100) => {
    if (threshold === 50) return "bg-amber-500";
    if (threshold === 90) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <header className="hidden md:flex sticky top-0 z-10 h-14 items-center justify-end gap-1 border-b border-white/10 bg-zinc-950/80 px-4 backdrop-blur-md">
      {/* Notification button – budget alerts at 50%, 90%, 100% */}
      <div className="relative" ref={notifRef}>
        <button
          type="button"
          onClick={() => setNotificationsOpen((o) => !o)}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-white/20"
          aria-label="Budget notifications"
          aria-expanded={notificationsOpen}
        >
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
        {notificationsOpen && (
          <>
            <div
              className="fixed inset-0 z-0"
              aria-hidden
              onClick={() => setNotificationsOpen(false)}
            />
            <div className="absolute right-0 top-full z-10 mt-1 w-80 max-h-96 overflow-y-auto rounded-xl border border-white/10 bg-zinc-900/95 py-2 shadow-xl backdrop-blur-md">
              <p className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Budget alerts
              </p>
              {alerts.length > 0 ? (
                <ul className="text-sm text-zinc-300">
                  {alerts.map((a) => (
                    <li
                      key={a.id}
                      className="group flex items-start gap-2 px-4 py-2.5 hover:bg-white/5"
                    >
                      <span
                        className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${getThresholdColor(a.threshold)}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-zinc-100">
                          {a.category} — {a.threshold}%
                        </p>
                        <p className="text-xs text-zinc-500">
                          {getThresholdMessage(a.threshold)}. {formatCurrency(a.currentSpent)} of {formatCurrency(a.budgetLimit)} spent.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => dismissAlert(a.id)}
                        className="shrink-0 rounded p-1 text-zinc-500 opacity-0 group-hover:opacity-100 hover:bg-white/10 hover:text-zinc-300"
                        aria-label="Dismiss"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
              <ul className="text-sm text-zinc-300">
                <li className="flex items-start gap-2 px-4 py-2">
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                  <span>50% — Half of your budget used</span>
                </li>
                <li className="flex items-start gap-2 px-4 py-2">
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                  <span>90% — Almost at your limit</span>
                </li>
                <li className="flex items-start gap-2 px-4 py-2">
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                  <span>100% — Budget limit reached</span>
                </li>
              </ul>
              )}
              <p className="border-t border-white/10 px-4 pt-2 text-xs text-zinc-500">
                {alerts.length > 0
                  ? "Alerts appear here when you hit 50%, 90%, or 100% of a budget."
                  : "You'll see alerts here when categories hit these levels."}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Help – link to description page */}
      <Link
        href="/help"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-white/20"
        aria-label="Help and about this website"
      >
        <HelpIcon className="h-5 w-5" />
      </Link>

      {/* Profile – link to settings */}
      <Link
        href="/settings"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-white/20"
        aria-label="Profile and settings"
      >
        <ProfileIcon className="h-5 w-5" />
      </Link>
    </header>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function HelpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}