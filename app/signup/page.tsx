"use client";

/**
 * Sign up page – Sleto Glassmorphic Dark (DesignDoc.md).
 * Sign up with username or email + password.
 */

import Link from "next/link";

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/20";
const labelClass =
  "block text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-xl transition-[transform,border-color] hover:scale-[1.02] hover:border-white/20">
        <h1 className="text-xl font-semibold text-center mb-6">
          Create account
        </h1>
        <form
          className="space-y-4"
          onSubmit={(e) => e.preventDefault()}
        >
          <div>
            <label htmlFor="username" className={labelClass}>
              Username
            </label>
            <input
              id="username"
              type="text"
              name="username"
              autoComplete="username"
              placeholder="Choose a username"
              className={inputClass}
            />
          </div>
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
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              autoComplete="new-password"
              placeholder="Choose a password"
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
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-2xl border border-white/10 bg-white/10 py-3 font-medium text-zinc-100 transition-colors hover:bg-white/20 hover:border-white/20"
          >
            Sign up
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
