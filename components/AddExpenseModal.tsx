"use client";

import { useEffect, useRef, useState } from "react";
import { useExpenseModal, type ExpenseFormData, type IncomeType } from "@/context/ExpenseModalContext";
import { useTransactions } from "@/context/TransactionsContext";
import { supabase } from "@/lib/supabaseClient";
import { ensureCurrentUserInPublicUsers } from "@/lib/ensureUser";
import { getCategoryIcon } from "@/lib/mockData";
import { insertIncome, updateIncome } from "@/lib/income";
import { insertExpense, updateExpense } from "@/lib/transactions";

const EXPENSE_CATEGORIES = [
  "Groceries",
  "Restaurants",
  "Transport",
  "Entertainment",
  "Utilities",
  "Shopping",
  "Healthcare",
  "Other",
] as const;

/** Today in local timezone (YYYY-MM-DD). Avoids UTC making it "tomorrow" in some timezones. */
function getDefaultDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Sanitize amount input: digits and one ".", max 2 digits after decimal. Cents only allowed after "." */
function sanitizeAmountInput(value: string): string {
  if (value === "") return "";
  const cleaned = value.replace(/[^\d.]/g, "");
  const dotIndex = cleaned.indexOf(".");
  if (dotIndex === -1) return cleaned;
  const beforeDot = cleaned.slice(0, dotIndex);
  const afterDot = cleaned.slice(dotIndex + 1).slice(0, 2);
  return afterDot === "" ? beforeDot + "." : beforeDot + "." + afterDot;
}

/** Normalize to YYYY-MM-DD for inputs and API; fallback to today if invalid. */
function toDateOnly(s: string | undefined): string {
  if (!s || !s.trim()) return getDefaultDate();
  const trimmed = s.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const t = Date.parse(trimmed);
  if (!Number.isNaN(t)) {
    const d = new Date(t);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  return getDefaultDate();
}

export function AddExpenseModal() {
  const { isOpen, mode, initialData, closeModal } = useExpenseModal();
  const amountRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<ExpenseFormData>({
    amount: "",
    category: "",
    subcategory: "",
    description: "",
    date: getDefaultDate(),
    isIncome: false,
    incomeType: undefined,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ExpenseFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const { refetch } = useTransactions();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        setFormData({
          ...initialData,
          amount: initialData.amount,
          date: toDateOnly(initialData.date),
        });
      } else {
        setFormData({
          amount: "",
          category: "",
          subcategory: "",
          description: "",
          date: getDefaultDate(),
          isIncome: false,
          incomeType: undefined,
        });
      }
      setErrors({});
      // Focus amount input after render
      requestAnimationFrame(() => amountRef.current?.focus());
    }
  }, [isOpen, mode, initialData]);

  const handleChange = (field: keyof ExpenseFormData, value: string | boolean | IncomeType | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof ExpenseFormData, string>> = {};
    const amountNum = parseFloat(formData.amount);
    if (!formData.amount.trim()) {
      next.amount = "Amount is required";
    } else if (isNaN(amountNum) || amountNum <= 0) {
      next.amount = "Enter a valid positive amount";
    }
    if (formData.isIncome) {
      if (!formData.incomeType) {
        next.incomeType = "Select income type";
      }
      if (formData.incomeType === "one_time" && (!formData.date || isNaN(Date.parse(formData.date)))) {
        next.date = "Date is required for one-time income";
      }
    } else {
      if (!formData.category.trim()) {
        next.category = "Category is required";
      }
      if (!formData.date?.trim()) {
        next.date = "Date is required";
      } else if (Number.isNaN(Date.parse(formData.date.trim()))) {
        next.date = "Invalid date";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const { userId, error: ensureError } = await ensureCurrentUserInPublicUsers();
    if (!userId) {
      setErrors({ amount: "You must be logged in to add a transaction." });
      return;
    }
    if (ensureError) {
      setErrors({
        amount:
          "Your account could not be synced. In Supabase Dashboard → SQL Editor, run the SQL in supabase/public-users-rls.sql once, then try again.",
      });
      return;
    }
    setSubmitting(true);
    setErrors({});
    const amountNum = parseFloat(formData.amount);
    const date =
      formData.isIncome && formData.incomeType !== "one_time"
        ? getDefaultDate()
        : toDateOnly(formData.date);
    let err: Error | null = null;
    if (formData.isIncome) {
      const incomeType = formData.incomeType ?? "one_time";
      if (mode === "edit" && formData.id) {
        const result = await updateIncome(formData.id, {
          amount: amountNum,
          income_type: incomeType,
          description: formData.description || undefined,
          date,
        });
        err = result.error;
      } else {
        const result = await insertIncome({
          user_id: userId,
          amount: amountNum,
          income_type: incomeType,
          description: formData.description || undefined,
          date,
        });
        err = result.error;
      }
    } else {
      if (mode === "edit" && formData.id) {
        const result = await updateExpense(formData.id, {
          amount: amountNum,
          category: formData.category,
          subcategory: formData.subcategory,
          description: formData.description || undefined,
          date,
        });
        err = result.error;
      } else {
        const result = await insertExpense({
          user_id: userId,
          amount: amountNum,
          category: formData.category,
          subcategory: formData.subcategory,
          description: formData.description || undefined,
          date,
        });
        err = result.error;
      }
    }
    setSubmitting(false);
    if (err) {
      setErrors({ amount: err.message });
      return;
    }
    await refetch();
    closeModal();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={closeModal}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-modal-title"
        className="fixed inset-x-4 bottom-4 z-50 mx-auto max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-xl md:bottom-auto md:left-1/2 md:top-1/2 md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2"
      >
        <div className="flex items-center justify-between">
          <h2 id="expense-modal-title" className="text-lg font-semibold text-zinc-50">
            {mode === "edit"
              ? "Edit Transaction"
              : formData.isIncome
                ? "Add to Income"
                : "Add to Expenses"}
          </h2>
          <button
            type="button"
            onClick={closeModal}
            className="rounded-lg p-1 text-zinc-400 hover:bg-white/5 hover:text-zinc-50"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Type toggle */}
          <div className="flex gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => {
                handleChange("isIncome", false);
                handleChange("incomeType", undefined);
              }}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                !formData.isIncome
                  ? "bg-white/10 text-zinc-50"
                  : "text-zinc-400 hover:text-zinc-300"
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => {
                handleChange("isIncome", true);
                setFormData((prev) => ({ ...prev, category: "", subcategory: "" }));
              }}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                formData.isIncome
                  ? "bg-white/10 text-zinc-50"
                  : "text-zinc-400 hover:text-zinc-300"
              }`}
            >
              Income
            </button>
          </div>

          {/* Amount – immediate focus */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-zinc-400">
              Amount *
            </label>
            <input
              ref={amountRef}
              id="amount"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => handleChange("amount", sanitizeAmountInput(e.target.value))}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xl font-semibold tabular-nums text-zinc-100 placeholder-zinc-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-400">{errors.amount}</p>
            )}
          </div>

          {formData.isIncome ? (
            <>
              {/* Income type: Yearly salary, Monthly salary, One-time */}
              <div>
                <span className="block text-sm font-medium text-zinc-400">
                  Income type *
                </span>
                <div className="mt-2 flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-2">
                  {(
                    [
                      { value: "yearly_salary" as const, label: "Yearly salary" },
                      { value: "monthly_salary" as const, label: "Monthly salary" },
                      { value: "one_time" as const, label: "One-time (e.g. survey, bonus)" },
                    ] as const
                  ).map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleChange("incomeType", value)}
                      className={`rounded-lg py-2.5 px-3 text-left text-sm font-medium transition-colors ${
                        formData.incomeType === value
                          ? "bg-white/10 text-zinc-50"
                          : "text-zinc-400 hover:bg-white/5 hover:text-zinc-300"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {errors.incomeType && (
                  <p className="mt-1 text-sm text-red-400">{errors.incomeType}</p>
                )}
              </div>

              {/* Description – optional for income */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-zinc-400">
                  Description (optional)
                </label>
                <input
                  id="description"
                  type="text"
                  placeholder="e.g. Main job, Survey payment"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>

              {/* Date – only for one-time income */}
              {formData.incomeType === "one_time" && (
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-zinc-400">
                    Date received *
                  </label>
                  <input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleChange("date", e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-100 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                  />
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-400">{errors.date}</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Category – grid with icons (expense only) */}
              <div>
                <span className="block text-sm font-medium text-zinc-400">
                  Category *
                </span>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        handleChange("category", cat);
                        if (cat !== "Other") setCustomCategory("");
                      }}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                        formData.category === cat
                          ? "border-white/30 bg-white/15 text-zinc-50"
                          : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:bg-white/10"
                      }`}
                    >
                      <span className="text-lg leading-none" aria-hidden>
                        {getCategoryIcon(cat, false)}
                      </span>
                      <span className="truncate">{cat}</span>
                    </button>
                  ))}
                </div>
                {formData.category === "Other" && (
                  <input
                    type="text"
                    placeholder="Custom category name"
                    value={customCategory}
                    onChange={(e) => {
                      setCustomCategory(e.target.value);
                      handleChange("category", e.target.value.trim() || "Other");
                    }}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                  />
                )}
                {errors.category && (
                  <p className="mt-1 text-sm text-red-400">{errors.category}</p>
                )}
              </div>

              {/* Subcategory (expense only) */}
              <div>
                <label htmlFor="subcategory" className="block text-sm font-medium text-zinc-400">
                  Subcategory
                </label>
                <input
                  id="subcategory"
                  type="text"
                  placeholder="Optional"
                  value={formData.subcategory}
                  onChange={(e) => handleChange("subcategory", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>

              {/* Description (expense only) */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-zinc-400">
                  Description
                </label>
                <input
                  id="description"
                  type="text"
                  placeholder="What was this for?"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>

              {/* Date (expense only) */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-zinc-400">
                  Date *
                </label>
                <input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-100 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-400">{errors.date}</p>
                )}
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-gradient-to-r from-purple-500 to-blue-600 px-4 py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? "Adding…"
                : mode === "edit"
                  ? "Save"
                  : formData.isIncome
                    ? "Add to Income"
                    : "Add to Expenses"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
