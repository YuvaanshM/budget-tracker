"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/lib/supabaseClient";
import { formatCurrency } from "@/lib/formatCurrency";
import {
  ActiveRoomProvider,
  useActiveRoom,
} from "@/context/RoomsContext";
import {
  computeOwedToEach,
  deleteRoom,
  fetchMemberDisplayNames,
  upsertRoomBudget,
} from "@/lib/rooms";
import { AddRoomExpenseModal } from "@/components/AddRoomExpenseModal";
import { SettleUpModal } from "@/components/SettleUpModal";

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

const EXPENSE_CATEGORIES = [
  "Groceries",
  "Restaurants",
  "Transport",
  "Entertainment",
  "Utilities",
  "Shopping",
  "Healthcare",
  "Other",
];

const ACCENT_GREEN = "#2E8B57";
const CHART_COLORS = [
  ACCENT_GREEN,
  "#059669",
  "#0d9488",
  "#047857",
  "#065f46",
  "#134e4a",
  "#15803d",
  "#166534",
];

function RoomDetailContent() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.id as string;
  const { room, members, expenses, roomBudgets, splits, settlements, loading, error, refetch } =
    useActiveRoom();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [memberDisplayNames, setMemberDisplayNames] = useState<Record<string, string>>({});
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState<string>("");
  const [budgetLimit, setBudgetLimit] = useState("");
  const [budgetSubmitting, setBudgetSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (members.length > 0) {
      fetchMemberDisplayNames(members.map((m) => m.userId)).then(setMemberDisplayNames);
    }
  }, [members]);

  const isOwner = room && currentUserId && room.createdBy === currentUserId;

  const handleDeleteRoom = async () => {
    if (!roomId || !deleteConfirm) return;
    setDeleteSubmitting(true);
    const { error: err } = await deleteRoom(roomId);
    setDeleteSubmitting(false);
    if (err) {
      setDeleteConfirm(false);
      return;
    }
    router.push("/rooms");
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(budgetLimit);
    if (isNaN(num) || num < 0) return;
    setBudgetSubmitting(true);
    const { error: err } = await upsertRoomBudget(roomId, num, budgetCategory);
    setBudgetSubmitting(false);
    if (!err) {
      setShowBudgetForm(false);
      setBudgetLimit("");
      setBudgetCategory("");
      await refetch();
    }
  };

  if (loading && !room) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 md:p-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-gray-500">Loading room…</p>
        </div>
      </div>
    );
  }

  if (!room || error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 md:p-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-red-500">{error ?? "Room not found"}</p>
          <Link href="/rooms" className="mt-4 inline-block text-[#2E8B57] hover:underline">
            Back to Rooms
          </Link>
        </div>
      </div>
    );
  }

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const owedToEach = currentUserId
    ? computeOwedToEach(expenses, members, splits, settlements, memberDisplayNames, currentUserId)
    : [];
  const youOwe = owedToEach.reduce((sum, o) => sum + o.amount, 0);

  // Spending by category
  const spendingByCategory = expenses.reduce<Record<string, number>>((acc, exp) => {
    acc[exp.category] = (acc[exp.category] ?? 0) + exp.amount;
    return acc;
  }, {});
  const categoryChartData = Object.entries(spendingByCategory).map(([name, value]) => ({
    name,
    value,
  }));

  const memberNamesForTooltip = members
    .map((m) => (m.userId === currentUserId ? "You" : memberDisplayNames[m.userId] ?? "Member"))
    .join(", ");

  const generalBudget = roomBudgets.find((b) => b.category === "");
  const categoryBudgets = roomBudgets.filter((b) => b.category !== "");

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/rooms"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
            aria-label="Back to rooms"
          >
            ←
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-900">{room.name}</h1>
            <p className="text-sm text-gray-500">
              Code: {room.inviteCode} ·{" "}
              <span
                className="cursor-help underline decoration-dotted"
                title={memberNamesForTooltip || undefined}
              >
                {members.length} member{members.length !== 1 ? "s" : ""}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsAddExpenseOpen(true)}
              className="rounded-xl bg-[#2E8B57] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#247a4a]"
            >
              Add Expense
            </button>
            {isOwner && (
              <>
                {!deleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(true)}
                    className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete Room
                  </button>
                ) : (
                  <span className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDeleteRoom}
                      disabled={deleteSubmitting}
                      className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-70"
                    >
                      {deleteSubmitting ? "Deleting…" : "Confirm Delete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(false)}
                      disabled={deleteSubmitting}
                      className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Summary: Total + You owe */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-medium text-gray-500">Total shared expenses</h2>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {formatCurrency(totalSpent)}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium text-gray-500">What you owe</h2>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {formatCurrency(youOwe)}
                </p>
              </div>
              {youOwe > 0 && (
                <button
                  type="button"
                  onClick={() => setIsSettleUpOpen(true)}
                  className="rounded-lg bg-[#2E8B57] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#247a4a]"
                >
                  Settle Up
                </button>
              )}
            </div>
            {/* Breakdown: how much you owe to each person */}
            {owedToEach.length > 0 && (
              <div className="mt-3 border-t border-gray-100 pt-3">
                <p className="mb-2 text-xs font-medium text-gray-500">Owed to each person:</p>
                <ul className="space-y-1 text-sm text-gray-600">
                  {owedToEach.map((o) => (
                    <li key={o.toUserId} className="flex justify-between">
                      <span>{o.displayName}</span>
                      <span>{formatCurrency(o.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Room Budgets (general + category) */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-700">Room Budgets</h2>
            {!showBudgetForm ? (
              <button
                type="button"
                onClick={() => {
                  setShowBudgetForm(true);
                  setBudgetCategory("");
                  setBudgetLimit(generalBudget?.budgetLimit?.toString() ?? "");
                }}
                className="text-sm text-[#2E8B57] hover:underline"
              >
                Add Budget
              </button>
            ) : (
              <form onSubmit={handleSaveBudget} className="flex flex-wrap items-center gap-2">
                <select
                  value={budgetCategory}
                  onChange={(e) => setBudgetCategory(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-[#2E8B57] focus:outline-none focus:ring-1 focus:ring-[#2E8B57]"
                >
                  <option value="">General (total)</option>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="Limit"
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(e.target.value)}
                  className="w-24 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-[#2E8B57] focus:outline-none focus:ring-1 focus:ring-[#2E8B57]"
                />
                <button
                  type="submit"
                  disabled={budgetSubmitting}
                  className="rounded-lg bg-[#2E8B57] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#247a4a] disabled:opacity-70"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBudgetForm(false);
                    setBudgetLimit("");
                    setBudgetCategory("");
                  }}
                  className="rounded-lg px-2 text-sm text-gray-500 hover:bg-gray-100"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
          <div className="mt-4 space-y-3">
            {generalBudget && (
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <span className="font-medium text-gray-700">General</span>
                <span className="text-gray-600">
                  {formatCurrency(totalSpent)} / {formatCurrency(generalBudget.budgetLimit)}
                  {generalBudget.budgetLimit > 0 &&
                    ` (${Math.round((totalSpent / generalBudget.budgetLimit) * 100)}%)`}
                </span>
              </div>
            )}
            {categoryBudgets.map((b) => {
              const spent = spendingByCategory[b.category] ?? 0;
              return (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                >
                  <span className="font-medium text-gray-700">{b.category}</span>
                  <span className="text-gray-600">
                    {formatCurrency(spent)} / {formatCurrency(b.budgetLimit)}
                    {b.budgetLimit > 0 &&
                      ` (${Math.round((spent / b.budgetLimit) * 100)}%)`}
                  </span>
                </div>
              );
            })}
            {roomBudgets.length === 0 && !showBudgetForm && (
              <p className="text-sm text-gray-500">No budgets set. Add a general or category budget.</p>
            )}
          </div>
        </div>

        {/* Spending by category */}
        {categoryChartData.length > 0 && (
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-medium text-gray-700">Spending by category</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {categoryChartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Expenses list */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <h2 className="border-b border-gray-200 px-4 py-3 text-sm font-medium text-gray-700">
            Expenses
          </h2>
          {expenses.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No expenses yet. Add one to get started.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {expenses.map((exp) => (
                <li
                  key={exp.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {CATEGORY_ICONS[exp.category] ?? "📦"}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">
                        {exp.description || exp.category}
                      </p>
                      <p className="text-sm text-gray-500">
                        {exp.date} · Split {exp.splitType}
                      </p>
                    </div>
                  </div>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(exp.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {isAddExpenseOpen && (
        <AddRoomExpenseModal
          roomId={roomId}
          members={members}
          onClose={() => setIsAddExpenseOpen(false)}
          onSaved={() => {
            setIsAddExpenseOpen(false);
            refetch();
          }}
        />
      )}

      {isSettleUpOpen && currentUserId && (
        <SettleUpModal
          roomId={roomId}
          currentUserId={currentUserId}
          owedTo={owedToEach}
          onClose={() => setIsSettleUpOpen(false)}
          onSaved={() => {
            setIsSettleUpOpen(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

export default function RoomDetailPage() {
  const params = useParams();
  const roomId = (params?.id as string) ?? null;

  return (
    <ActiveRoomProvider roomId={roomId}>
      <RoomDetailContent />
    </ActiveRoomProvider>
  );
}
