"use client";

import { useEffect, useRef, useState } from "react";
import { useExpenseModal, type ExpenseFormData } from "@/context/ExpenseModalContext";

// Placeholder categories – users can add new ones (skeleton)
const DEFAULT_CATEGORIES = [
  "Groceries",
  "Restaurants",
  "Transport",
  "Entertainment",
  "Salary",
  "Utilities",
  "Shopping",
  "Healthcare",
  "Other",
];

function getDefaultDate() {
  return new Date().toISOString().slice(0, 10);
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
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ExpenseFormData, string>>>({});
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        setFormData({
          ...initialData,
          amount: initialData.amount,
        });
      } else {
        setFormData({
          amount: "",
          category: "",
          subcategory: "",
          description: "",
          date: getDefaultDate(),
          isIncome: false,
        });
      }
      setErrors({});
      // Focus amount input after render
      requestAnimationFrame(() => amountRef.current?.focus());
    }
  }, [isOpen, mode, initialData]);

  const handleChange = (field: keyof ExpenseFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleAddCategory = () => {
    const newCat = formData.category.trim();
    if (newCat && !categories.includes(newCat)) {
      setCategories((prev) => [...prev, newCat]);
    }
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof ExpenseFormData, string>> = {};
    const amountNum = parseFloat(formData.amount);
    if (!formData.amount.trim()) {
      next.amount = "Amount is required";
    } else if (isNaN(amountNum) || amountNum <= 0) {
      next.amount = "Enter a valid positive amount";
    }
    if (!formData.category.trim()) {
      next.category = "Category is required";
    }
    if (formData.date && isNaN(Date.parse(formData.date))) {
      next.date = "Invalid date";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    // Skeleton: no actual CRUD – close modal and log
    console.log(mode === "edit" ? "Edit expense:" : "Add expense:", formData);
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
            {mode === "edit" ? "Edit Transaction" : "Add Transaction"}
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
              onClick={() => handleChange("isIncome", false)}
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
              onClick={() => handleChange("isIncome", true)}
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
              onChange={(e) => handleChange("amount", e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xl font-semibold tabular-nums text-zinc-100 placeholder-zinc-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-400">{errors.amount}</p>
            )}
          </div>

          {/* Category – creatable */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-zinc-400">
              Category *
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="category"
                list="category-list"
                placeholder="Select or type new"
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                onBlur={handleAddCategory}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
              <datalist id="category-list">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            {errors.category && (
              <p className="mt-1 text-sm text-red-400">{errors.category}</p>
            )}
          </div>

          {/* Subcategory */}
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

          {/* Description */}
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

          {/* Date – default today */}
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
              className="flex-1 rounded-xl bg-gradient-to-r from-purple-500 to-blue-600 px-4 py-3 text-sm font-medium text-white hover:opacity-90"
            >
              {mode === "edit" ? "Save" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
