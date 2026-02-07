"use client";

import { useEffect, useState } from "react";
import { useTransactions } from "@/context/TransactionsContext";
import { formatCurrency } from "@/lib/formatCurrency";
import { fetchBudgets, createBudget, updateBudget, type Budget } from "@/lib/budgets";
import { getBudgetsWithSpent, type BudgetWithSpent } from "@/lib/mockData";
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
  const { transactions } = useTransactions();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);
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

  const budgetsWithSpent = getBudgetsWithSpent(transactions, budgets);

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Budgets & Alerts</h1>
            <p className="mt-1 text-sm text-gray-500">Manage your spending limits</p>
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-xl bg-[#2E8B57] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#247a4a] transition-colors"
          >
            Create New Budget
          </button>
        </header>

        {loading ? (
          <div className="mt-12 rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <p className="text-gray-500">Loading budgets…</p>
          </div>
        ) : (
          <>
            {/* Grid of Progress Cards */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {budgetsWithSpent.map((b) => (
                <ProgressCard
                  key={b.id}
                  budget={b}
                  onEdit={() => setBudgetToEdit({ id: b.id, category: b.category, budgetLimit: b.budgetLimit, alertsEnabled: b.alertsEnabled ?? false })}
                />
              ))}
            </div>

            {budgetsWithSpent.length === 0 && (
          <div className="mt-12 rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <p className="text-gray-500">No budgets yet. Create one to track spending limits.</p>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 rounded-xl bg-[#2E8B57] px-4 py-2 text-sm font-medium text-white hover:bg-[#247a4a]"
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
            const created = await createBudget(user.id, newBudget.category, newBudget.budgetLimit, newBudget.alertsEnabled);
            setBudgets((prev) => [...prev, created]);
            setIsCreateModalOpen(false);
          }}
          existingCategories={budgets.map((b) => b.category)}
        />
      )}

      {/* Edit Budget Modal */}
      {budgetToEdit && (
        <EditBudgetModal
          budget={budgetToEdit}
          onClose={() => setBudgetToEdit(null)}
          onSave={async (updates) => {
            const updated = await updateBudget(budgetToEdit.id, updates);
            setBudgets((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
            setBudgetToEdit(null);
          }}
          existingCategories={budgets.filter((b) => b.id !== budgetToEdit.id).map((b) => b.category)}
        />
      )}
    </div>
  );
}

function ProgressCard({ budget, onEdit }: { budget: BudgetWithSpent; onEdit: () => void }) {
  const { category, budgetLimit, currentSpent, alertsEnabled } = budget;
  const remaining = Math.max(0, budgetLimit - currentSpent);
  const percentUsed = budgetLimit > 0 ? (currentSpent / budgetLimit) * 100 : 0;
  const isExceeded = percentUsed >= 100;

  const getBarColor = () => {
    if (percentUsed >= 100) return "bg-red-500";
    if (percentUsed >= 80) return "bg-red-500";
    if (percentUsed >= 50) return "bg-amber-500";
    return "bg-[#2E8B57]";
  };

  const icon = CATEGORY_ICONS[category] ?? "📦";

  return (
    <article
      className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-gray-300 hover:shadow-md ${
        isExceeded ? "border-red-300 bg-red-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
          <span className="text-lg">{icon}</span>
          {category}
        </span>
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-semibold tabular-nums ${
              remaining <= 0 ? "text-red-500" : "text-[#2E8B57]"
            }`}
          >
            {remaining <= 0 ? "$0" : formatCurrency(remaining)} left
          </span>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label={`Edit ${category} budget`}
          >
            Edit
          </button>
        </div>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all duration-300 ${getBarColor()}`}
          style={{ width: `${Math.min(percentUsed, 100)}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {formatCurrency(currentSpent)} of {formatCurrency(budgetLimit)} spent this month
        </p>
        {alertsEnabled && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500" title="Alerts on">
            <span className="text-amber-600">🔔</span> Alerts on
          </span>
        )}
      </div>
    </article>
  );
}

function CreateBudgetModal({
  onClose,
  onSave,
  existingCategories,
}: {
  onClose: () => void;
  onSave: (budget: { category: string; budgetLimit: number; alertsEnabled: boolean }) => Promise<void>;
  existingCategories: string[];
}) {
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");
  const [alertsEnabled, setAlertsEnabled] = useState(false);
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
        alertsEnabled,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create budget";
      setError(msg);
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
        className="fixed inset-x-4 bottom-4 z-50 mx-auto max-h-[85vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-xl md:bottom-auto md:left-1/2 md:top-1/2 md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2"
      >
        <div className="flex items-center justify-between">
          <h2 id="create-budget-title" className="text-lg font-semibold text-gray-900">
            Create New Budget
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="budget-category" className="block text-sm font-medium text-gray-600">
              Category *
            </label>
            <select
              id="budget-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
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
            <label htmlFor="budget-limit" className="block text-sm font-medium text-gray-600">
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
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <div>
              <p className="font-medium text-gray-900">Budget alerts</p>
              <p className="text-xs text-gray-500">Notify when approaching or exceeding limit</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={alertsEnabled}
              onClick={() => setAlertsEnabled((v) => !v)}
              className={`relative h-7 w-14 shrink-0 rounded-full border transition-colors ${
                alertsEnabled
                  ? "border-[#2E8B57] bg-[#2E8B57]/20"
                  : "border-gray-200 bg-gray-100"
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 ${
                  alertsEnabled ? "left-auto right-1" : "left-1 right-auto"
                }`}
              />
            </button>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-[#2E8B57] px-4 py-3 text-sm font-medium text-white hover:bg-[#247a4a] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function EditBudgetModal({
  budget,
  onClose,
  onSave,
  existingCategories,
}: {
  budget: Budget;
  onClose: () => void;
  onSave: (updates: { category?: string; budgetLimit?: number; alertsEnabled?: boolean }) => Promise<void>;
  existingCategories: string[];
}) {
  const [category, setCategory] = useState(budget.category);
  const [limit, setLimit] = useState(String(budget.budgetLimit));
  const [alertsEnabled, setAlertsEnabled] = useState(budget.alertsEnabled ?? false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const allCategories = [
    "Groceries",
    "Restaurants",
    "Transport",
    "Entertainment",
    "Utilities",
    "Shopping",
    "Healthcare",
    "Other",
  ];
  const categoryOptions = allCategories.filter(
    (c) => c === budget.category || !existingCategories.includes(c)
  );

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
    if (category !== budget.category && existingCategories.includes(category)) {
      setError("A budget for this category already exists");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        category: category.trim(),
        budgetLimit: num,
        alertsEnabled,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to update budget";
      setError(msg);
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
        aria-labelledby="edit-budget-title"
        className="fixed inset-x-4 bottom-4 z-50 mx-auto max-h-[85vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-xl md:bottom-auto md:left-1/2 md:top-1/2 md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2"
      >
        <div className="flex items-center justify-between">
          <h2 id="edit-budget-title" className="text-lg font-semibold text-gray-900">
            Edit Budget
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="edit-budget-category" className="block text-sm font-medium text-gray-600">
              Category *
            </label>
            <select
              id="edit-budget-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
            >
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_ICONS[c] ?? "📦"} {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="edit-budget-limit" className="block text-sm font-medium text-gray-600">
              Monthly limit ($) *
            </label>
            <input
              id="edit-budget-limit"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <div>
              <p className="font-medium text-gray-900">Budget alerts</p>
              <p className="text-xs text-gray-500">Notify when approaching or exceeding limit</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={alertsEnabled}
              onClick={() => setAlertsEnabled((v) => !v)}
              className={`relative h-7 w-14 shrink-0 rounded-full border transition-colors ${
                alertsEnabled
                  ? "border-[#2E8B57] bg-[#2E8B57]/20"
                  : "border-gray-200 bg-gray-100"
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 ${
                  alertsEnabled ? "left-auto right-1" : "left-1 right-auto"
                }`}
              />
            </button>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-[#2E8B57] px-4 py-3 text-sm font-medium text-white hover:bg-[#247a4a] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
