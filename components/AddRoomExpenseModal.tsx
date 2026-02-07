"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ensureCurrentUserInPublicUsers } from "@/lib/ensureUser";
import { insertSharedExpense } from "@/lib/rooms";
import { getCategoryIcon } from "@/lib/mockData";
import type { RoomMember } from "@/lib/rooms";

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

type SplitType = "full" | "equal" | "custom";

type Props = {
  roomId: string;
  members: RoomMember[];
  onClose: () => void;
  onSaved: () => void;
};

function getDefaultDate() {
  return new Date().toISOString().slice(0, 10);
}

export function AddRoomExpenseModal({ roomId, members, onClose, onSaved }: Props) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Other");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(getDefaultDate());
  const [paidBy, setPaidBy] = useState<string>("");
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        if (members.length > 0 && !paidBy) {
          setPaidBy(user.id);
        }
      }
    }
    init();
  }, [members, paidBy]);

  useEffect(() => {
    if (members.length > 0 && !paidBy && currentUserId) {
      setPaidBy(currentUserId);
    }
  }, [members, paidBy, currentUserId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { userId, error: ensureError } = await ensureCurrentUserInPublicUsers();
    if (!userId) {
      setError("You must be logged in to add an expense.");
      return;
    }
    if (ensureError) {
      setError("Account sync failed. Please try again.");
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amount.trim() || isNaN(amountNum) || amountNum <= 0) {
      setError("Enter a valid positive amount.");
      return;
    }
    if (!category.trim()) {
      setError("Category is required.");
      return;
    }
    if (!paidBy) {
      setError("Select who paid.");
      return;
    }
    if (members.every((m) => m.userId !== paidBy)) {
      setError("Invalid payer selected.");
      return;
    }

    if (splitType === "custom") {
      const splits: { userId: string; amount: number }[] = [];
      let total = 0;
      for (const m of members) {
        const val = customSplits[m.userId] ?? "0";
        const num = parseFloat(val) || 0;
        if (num > 0) {
          splits.push({ userId: m.userId, amount: num });
          total += num;
        }
      }
      if (Math.abs(total - amountNum) > 0.01) {
        setError(`Custom splits must sum to ${amountNum.toFixed(2)}.`);
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    const splits =
      splitType === "custom"
        ? members
            .map((m) => {
              const val = customSplits[m.userId] ?? "0";
              const num = parseFloat(val) || 0;
              return num > 0 ? { userId: m.userId, amount: num } : null;
            })
            .filter((s): s is { userId: string; amount: number } => s !== null)
        : undefined;

    const { id, error: insertError } = await insertSharedExpense({
      roomId,
      amount: amountNum,
      category,
      description: description.trim() || undefined,
      date: date || getDefaultDate(),
      paidBy,
      splitType,
      splits,
    });

    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    if (id) {
      onSaved();
    }
  };

  const memberDisplay = (m: RoomMember) => {
    if (m.userId === currentUserId) return "You";
    return m.username ?? "Member";
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => !submitting && onClose()}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-expense-modal-title"
        className="fixed inset-x-4 bottom-4 z-50 mx-auto max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-xl md:bottom-auto md:left-1/2 md:top-1/2 md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2"
      >
        <div className="flex items-center justify-between">
          <h2 id="room-expense-modal-title" className="text-lg font-semibold text-gray-900">
            Add Expense
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Amount *
            </label>
            <input
              id="amount"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#2E8B57] focus:outline-none focus:ring-1 focus:ring-[#2E8B57]"
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700">Category</span>
            <div className="mt-1 grid grid-cols-4 gap-2">
              {EXPENSE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`flex items-center gap-1 rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                    category === cat
                      ? "border-[#2E8B57] bg-[#2E8B57]/10 text-[#2E8B57]"
                      : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span>{getCategoryIcon(cat, false)}</span>
                  <span className="truncate">{cat}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description (optional)
            </label>
            <input
              id="description"
              type="text"
              placeholder="e.g. Weekly groceries"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#2E8B57] focus:outline-none focus:ring-1 focus:ring-[#2E8B57]"
            />
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#2E8B57] focus:outline-none focus:ring-1 focus:ring-[#2E8B57]"
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700">Who paid?</span>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#2E8B57] focus:outline-none focus:ring-1 focus:ring-[#2E8B57]"
            >
              <option value="">Select…</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {memberDisplay(m)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700">How to split?</span>
            <div className="mt-1 flex gap-2 rounded-lg border border-gray-200 bg-gray-50 p-1">
              {(["full", "equal", "custom"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSplitType(type)}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                    splitType === type
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {type === "full" ? "I paid all" : type === "equal" ? "Split equally" : "Custom"}
                </button>
              ))}
            </div>
          </div>

          {splitType === "equal" && members.length > 0 && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
            <p className="text-sm text-gray-500">
              {members.length} members × {((parseFloat(amount) || 0) / members.length).toFixed(2)} each
            </p>
          )}

          {splitType === "custom" && (
            <div className="space-y-2">
              <span className="block text-sm font-medium text-gray-700">Amount per person</span>
              {members.map((m) => (
                <div key={m.userId} className="flex items-center gap-2">
                  <span className="w-24 truncate text-sm text-gray-600">{memberDisplay(m)}</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={customSplits[m.userId] ?? ""}
                    onChange={(e) =>
                      setCustomSplits((prev) => ({ ...prev, [m.userId]: e.target.value }))
                    }
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-[#2E8B57] focus:outline-none focus:ring-1 focus:ring-[#2E8B57]"
                  />
                </div>
              ))}
              <p className="text-xs text-gray-500">Amounts must sum to the total.</p>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#2E8B57] px-4 py-2 text-sm font-medium text-white hover:bg-[#247a4a] disabled:opacity-70"
            >
              {submitting ? "Adding…" : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
