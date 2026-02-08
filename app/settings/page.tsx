"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useTransactions } from "@/context/TransactionsContext";
import { exportTransactionsToCsv, wipeAllUserData } from "@/lib/dataManagement";

export default function SettingsPage() {
  const router = useRouter();
  const { transactions, refetch: refetchTransactions } = useTransactions();
  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [usernameEdit, setUsernameEdit] = useState<string>("");
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [wipeConfirm, setWipeConfirm] = useState(false);
  const [wipeSubmitting, setWipeSubmitting] = useState(false);
  const [wipeError, setWipeError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      if (user.email) setEmail(user.email);
      // Prefer users table, fallback to user_metadata
      const { data: row } = await supabase
        .from("users")
        .select("username")
        .eq("id", user.id)
        .single();
      const name = (row?.username as string) || (user.user_metadata?.username as string) || "";
      setUsername(name);
      setUsernameEdit(name);
    }
    loadUser();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function handleExportCsv() {
    exportTransactionsToCsv(transactions);
  }

  async function handleWipeAllData() {
    if (!wipeConfirm) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setWipeError("Please sign in to wipe data");
      return;
    }
    setWipeSubmitting(true);
    setWipeError(null);
    const { error } = await wipeAllUserData(user.id);
    setWipeSubmitting(false);
    if (error) {
      setWipeError(error.message);
      return;
    }
    setWipeConfirm(false);
    await refetchTransactions();
    router.refresh();
  }

  async function handleUpdateUsername(e: React.FormEvent) {
    e.preventDefault();
    setUsernameError(null);
    const newUsername = usernameEdit.trim();
    if (!newUsername) {
      setUsernameError("Username cannot be empty");
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUsernameError("Please sign in to update your username");
      return;
    }
    setUsernameSaving(true);
    try {
      const { data: available, error: rpcError } = await supabase.rpc("check_username_available", {
        p_username: newUsername,
        p_user_id: user.id,
      });
      if (rpcError) {
        setUsernameError(rpcError.message || "Could not check username");
        return;
      }
      if (available !== true) {
        setUsernameError("That username is already taken. Please choose another.");
        return;
      }
      const { error: updateError } = await supabase
        .from("users")
        .update({ username: newUsername })
        .eq("id", user.id);
      if (updateError) {
        if (updateError.code === "23505") {
          setUsernameError("That username is already taken. Please choose another.");
          return;
        }
        setUsernameError(updateError.message || "Could not update username");
        return;
      }
      await supabase.auth.updateUser({ data: { username: newUsername } });
      setUsername(newUsername);
    } finally {
      setUsernameSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Page Header */}
        <header>
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your profile, preferences, and data
          </p>
        </header>

        {/* Profile Section */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900">Profile</h2>
          <p className="mt-1 text-sm text-gray-500">
            Your account details
          </p>
          <div className="mt-6 space-y-4">
            {/* Username – editable with update button */}
            <form onSubmit={handleUpdateUsername}>
              <label htmlFor="username" className="block text-sm font-medium text-gray-600">
                Username
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="username"
                  type="text"
                  value={usernameEdit}
                  onChange={(e) => setUsernameEdit(e.target.value)}
                  placeholder="Choose a username"
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-500 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
                <button
                  type="submit"
                  disabled={usernameSaving || usernameEdit.trim() === username}
                  className="shrink-0 rounded-xl border border-[#2E8B57] bg-[#2E8B57] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#247a4a] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {usernameSaving ? "Saving…" : "Update"}
                </button>
              </div>
              {usernameError && (
                <p className="mt-1 text-xs text-red-500">{usernameError}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Usernames must be unique. You can change yours here.
              </p>
            </form>
            {/* Email – read-only */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-600">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                readOnly
                placeholder="Not signed in"
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700 placeholder:text-gray-500 read-only:cursor-default read-only:opacity-90 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
              <p className="mt-1 text-xs text-gray-500">
                Email for this account (read-only)
              </p>
            </div>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900">Preferences</h2>
          <p className="mt-1 text-sm text-gray-500">
            Customize how the app works for you
          </p>
          <div className="mt-6 space-y-4">
            {/* Default Currency - Placeholder */}
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-600">
                Default Currency
              </label>
              <select
                id="currency"
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Account Section */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900">Account</h2>
          <p className="mt-1 text-sm text-gray-500">
            Sign out of your account on this device
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:border-gray-300"
            >
              Log out
            </button>
          </div>
        </section>

        {/* Data Section (Danger Zone) */}
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900">Data</h2>
          <p className="mt-1 text-sm text-gray-500">
            Export or delete your data
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={transactions.length === 0}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export to CSV
            </button>
            {!wipeConfirm ? (
              <button
                type="button"
                onClick={() => setWipeConfirm(true)}
                className="rounded-xl border border-red-300 bg-red-100 px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-200"
              >
                Wipe All Data
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleWipeAllData}
                  disabled={wipeSubmitting}
                  className="rounded-xl border border-red-500 bg-red-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-70"
                >
                  {wipeSubmitting ? "Wiping…" : "Confirm Wipe"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWipeConfirm(false);
                    setWipeError(null);
                  }}
                  disabled={wipeSubmitting}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-70"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          {wipeError && (
            <p className="mt-3 text-sm text-red-600">{wipeError}</p>
          )}
          {wipeConfirm && (
            <p className="mt-3 text-sm text-red-700">
              This will permanently delete all your expenses, income, budgets, and rooms you own. You will remain in rooms you joined. This cannot be undone.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
