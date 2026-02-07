"use client";

/**
 * Login page – Sleto Glassmorphic Dark (DesignDoc.md).
 * Sign in with Supabase Auth (email + password).
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        return;
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
          Log in
        </h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2"
            >
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
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl border border-white/10 bg-white/10 py-3 font-medium text-zinc-100 transition-colors hover:bg-white/20 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-zinc-300 hover:text-white">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
