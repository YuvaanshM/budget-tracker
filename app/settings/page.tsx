"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SettingsPage() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6 md:p-8">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Page Header */}
        <header>
          <h1 className="text-2xl font-semibold text-zinc-50">Settings</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage your profile, preferences, and data
          </p>
        </header>

        {/* Profile Section */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <h2 className="text-lg font-medium text-zinc-100">Profile</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Update your profile picture and email
          </p>
          <div className="mt-6 space-y-4">
            {/* Avatar Upload - Placeholder */}
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5">
                <span className="text-2xl text-zinc-500">?</span>
              </div>
              <div>
                <button
                  type="button"
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-zinc-50"
                >
                  Upload Avatar
                </button>
                <p className="mt-1 text-xs text-zinc-500">
                  PNG, JPG up to 2MB
                </p>
              </div>
            </div>
            {/* Email Update - Placeholder */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-400">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <h2 className="text-lg font-medium text-zinc-100">Preferences</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Customize how the app works for you
          </p>
          <div className="mt-6 space-y-4">
            {/* Default Currency - Placeholder */}
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-zinc-400">
                Default Currency
              </label>
              <select
                id="currency"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-100 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
            {/* AI Auto-Categorization Toggle - Placeholder */}
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <div>
                <p className="font-medium text-zinc-100">AI Auto-Categorization</p>
                <p className="text-sm text-zinc-500">
                  Automatically categorize transactions
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked="false"
                className="relative h-6 w-11 shrink-0 rounded-full border border-white/10 bg-zinc-700 transition-colors"
              >
                <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-zinc-400 transition-transform" />
              </button>
            </div>
          </div>
        </section>

        {/* Account Section */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <h2 className="text-lg font-medium text-zinc-100">Account</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Sign out of your account on this device
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-zinc-50"
            >
              Log out
            </button>
          </div>
        </section>

        {/* Data Section (Danger Zone) */}
        <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 backdrop-blur-md">
          <h2 className="text-lg font-medium text-zinc-100">Data</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Export or delete your data
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-zinc-50"
            >
              Export to CSV
            </button>
            <button
              type="button"
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
            >
              Wipe All Data
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
