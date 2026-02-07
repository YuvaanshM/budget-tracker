/**
 * Homepage – black background, white CTA boxes.
 * Choose between Sign up and Log in.
 */

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-4xl px-4 py-16 md:py-24">
        {/* Hero */}
        <header className="text-center mb-16 md:mb-20">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            BudgetBase
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-xl mx-auto">
            Track spending, set budgets, and stay on top of your finances.
          </p>
        </header>

        {/* CTA cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <Link
            href="/signup"
            className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xl transition-[transform,box-shadow] hover:scale-[1.02] hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Sign up
            </h2>
            <p className="text-sm text-gray-500">
              Create an account with username or email
            </p>
          </Link>
          <Link
            href="/login"
            className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xl transition-[transform,box-shadow] hover:scale-[1.02] hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Log in
            </h2>
            <p className="text-sm text-gray-500">
              Sign in with your username or email
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
