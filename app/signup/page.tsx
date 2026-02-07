"use client";

/**
 * Sign up page – Sleto Glassmorphic Dark (DesignDoc.md).
 * Sign up with Supabase Auth (email + password).
 */

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/20";
const labelClass =
  "block text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : "";
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) {
        const isRateLimit =
          /rate limit|too many requests|too many attempts/i.test(
            error.message
          );
        setError(
          isRateLimit
            ? "Too many signup emails sent. Please wait an hour and try again, or sign in if you already have an account."
            : error.message
        );
        return;
      }
      if (data.user) {
        const { error: insertError } = await supabase.from("users").upsert(
          {
            id: data.user.id,
            email: data.user.email ?? email,
            income: 0,
            created_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
        if (insertError) {
          console.warn("Could not sync to users table:", insertError.message);
        }
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-xl transition-[transform,border-color] hover:scale-[1.02] hover:border-white/20">
        <h1 className="text-xl font-semibold text-center mb-6">
          Create account
        </h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="password" className={labelClass}>
              Password (minimum 8 characters)
            </label>
            <input
              id="password"
              type="password"
              name="password"
              autoComplete="new-password"
              placeholder="Choose a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className={labelClass}>
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl border border-white/10 bg-white/10 py-3 font-medium text-zinc-100 transition-colors hover:bg-white/20 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="text-zinc-300 hover:text-white">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
