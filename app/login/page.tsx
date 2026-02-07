"use client";

/**
 * Login page – Sleto Glassmorphic Dark (DesignDoc.md).
 * Sign in with username or email + password.
 */

import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-xl transition-[transform,border-color] hover:scale-[1.02] hover:border-white/20">
        <h1 className="text-xl font-semibold text-center mb-6">
          Log in
        </h1>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label
              htmlFor="username-or-email"
              className="block text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2"
            >
              Username or email
            </label>
            <input
              id="username-or-email"
              type="text"
              name="usernameOrEmail"
              autoComplete="username"
              placeholder="Enter username or email"
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
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-2xl border border-white/10 bg-white/10 py-3 font-medium text-zinc-100 transition-colors hover:bg-white/20 hover:border-white/20"
          >
            Sign in
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
