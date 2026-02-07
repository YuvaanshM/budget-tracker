"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/formatCurrency";
import { fetchBudgets, createBudget, type Budget } from "@/lib/budgets";
import { getBudgetsWithSpent, MOCK_TRANSACTIONS, type BudgetWithSpent } from "@/lib/mockData";
import { supabase } from "@/lib/supabaseClient";

const CATEGORY_ICONS: Record<string, string> = {
  Groceries: "🛒",
  Restaurants: "🍽️",
  Transport: "🚗",
  Entertainment: "🎬",
  Utilities: "💡",
  Shopping: "🛍️",
  Healthcare: "⚕️",
  Other: "📦",
};

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const data = await fetchBudgets(user.id);
        setBudgets(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load budgets");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const budgetsWithSpent = getBudgetsWithSpent(MOCK_TRANSACTIONS, budgets);

  return (
    <div className="min-h-screen bg-zinc-950 p-6 md:p-8">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-50">Budgets & Alerts</h1>
            <p className="mt-1 text-sm text-zinc-400">Manage your spending limits</p>
          </div>
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-xl bg-gradient-to-r from-purple-500 to-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            Create New Budget
          </button>
        </header>

        {loading ? (
          <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-md">
            <p className="text-zinc-500">Loading budgets…</p>
          </div>
        ) : (
          <>
            {/* Grid of Progress Cards */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {budgetsWithSpent.map((b) => (
                <ProgressCard key={b.id} budget={b} />
              ))}
            </div>

            {budgetsWithSpent.length === 0 && (
          <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-md">
            <p className="text-zinc-500">No budgets yet. Create one to track spending limits.</p>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-600 px-4 py-2 text-sm font-medium text-white"
            >
              Create New Budget
            </button>
          </div>
            )}
          </>
        )}
      </div>

      {/* Create New Budget Modal */}
      {isCreateModalOpen && (
        <CreateBudgetModal
          onClose={() => setIsCreateModalOpen(false)}
          onSave={async (newBudget) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
              throw new Error("Please sign in to create a budget");
            }
            const created = await createBudget(user.id, newBudget.category, newBudget.budgetLimit);
            setBudgets((prev) => [...prev, created]);
            setIsCreateModalOpen(false);
          }}
          existingCategories={budgets.map((b) => b.category)}
        />
      )}
    </div>
  );
}

function ProgressCard({ budget }: { budget: BudgetWithSpent }) {
  const { category, budgetLimit, currentSpent } = budget;
  const remaining = Math.max(0, budgetLimit - currentSpent);
  const percentUsed = budgetLimit > 0 ? (currentSpent / budgetLimit) * 100 : 0;
  const isExceeded = percentUsed >= 100;

  // Green < 50%, Yellow 50–80%, Red > 80%
  const getBarColor = () => {
    if (percentUsed >= 100) return "bg-red-500";
    if (percentUsed >= 80) return "bg-red-500";
    if (percentUsed >= 50) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const icon = CATEGORY_ICONS[category] ?? "📦";

  return (
    <article
      className={`rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition-[transform,border-color] hover:scale-[1.02] hover:border-white/20 ${
        isExceeded ? "animate-pulse-subtle" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-zinc-100">
          <span>{icon}</span>
          {category}
        </span>
        <span
          className={`text-sm font-semibold tabular-nums ${
            remaining <= 0 ? "text-red-400" : "text-zinc-300"
          }`}
        >
          {remaining <= 0 ? "$0" : formatCurrency(remaining)} left
        </span>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all ${getBarColor()} ${
            isExceeded ? "animate-pulse-subtle" : ""
          }`}
          style={{ width: `${Math.min(percentUsed, 100)}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-zinc-500">
        {formatCurrency(currentSpent)} of {formatCurrency(budgetLimit)} spent
      </p>
    </article>
  );
}

function CreateBudgetModal({
  onClose,
  onSave,
  existingCategories,
}: {
  onClose: () => void;
  onSave: (budget: { category: string; budgetLimit: number }) => Promise<void>;
  existingCategories: string[];
}) {
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const categories = [
    "Groceries",
    "Restaurants",
    "Transport",
    "Entertainment",
    "Utilities",
    "Shopping",
    "Healthcare",
    "Other",
  ].filter((c) => !existingCategories.includes(c));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const num = parseFloat(limit);
    if (!category.trim()) {
      setError("Please select a category");
      return;
    }
    if (isNaN(num) || num < 0) {
      setError("Budget limit must be 0 or greater");
      return;
    }
    if (existingCategories.includes(category)) {
      setError("A budget for this category already exists");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        category: category.trim(),
        budgetLimit: num,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create budget");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-budget-title"
        className="fixed inset-x-4 bottom-4 z-50 mx-auto max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-xl md:bottom-auto md:left-1/2 md:top-1/2 md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2"
      >
        <div className="flex items-center justify-between">
          <h2 id="create-budget-title" className="text-lg font-semibold text-zinc-50">
            Create New Budget
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-white/5 hover:text-zinc-50"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="budget-category" className="block text-sm font-medium text-zinc-400">
              Category *
            </label>
            <select
              id="budget-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-100 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_ICONS[c] ?? "📦"} {c}
                </option>
              ))}
              {categories.length === 0 && (
                <option value="" disabled>
                  All categories have budgets
                </option>
              )}
            </select>
          </div>

          <div>
            <label htmlFor="budget-limit" className="block text-sm font-medium text-zinc-400">
              Monthly limit ($) *
            </label>
            <input
              id="budget-limit"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-gradient-to-r from-purple-500 to-blue-600 px-4 py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
