"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [usernameEdit, setUsernameEdit] = useState<string>("");
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

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
            Your account details
          </p>
          <div className="mt-6 space-y-4">
            {/* Username – editable with update button */}
            <form onSubmit={handleUpdateUsername}>
              <label htmlFor="username" className="block text-sm font-medium text-zinc-400">
                Username
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="username"
                  type="text"
                  value={usernameEdit}
                  onChange={(e) => setUsernameEdit(e.target.value)}
                  placeholder="Choose a username"
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
                <button
                  type="submit"
                  disabled={usernameSaving || usernameEdit.trim() === username}
                  className="shrink-0 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {usernameSaving ? "Saving…" : "Update"}
                </button>
              </div>
              {usernameError && (
                <p className="mt-1 text-xs text-red-400">{usernameError}</p>
              )}
              <p className="mt-1 text-xs text-zinc-500">
                Usernames must be unique. You can change yours here.
              </p>
            </form>
            {/* Email – read-only */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-400">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                readOnly
                placeholder="Not signed in"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 read-only:cursor-default read-only:opacity-90 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
              <p className="mt-1 text-xs text-zinc-500">
                Email for this account (read-only)
              </p>
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
