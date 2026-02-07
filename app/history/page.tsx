"use client";

import { useState } from "react";
import { useExpenseModal, type ExpenseFormData } from "@/context/ExpenseModalContext";
import { useTransactions } from "@/context/TransactionsContext";
import { deleteIncome } from "@/lib/income";
import { deleteExpense } from "@/lib/transactions";
import { type Transaction } from "@/lib/mockData";

function formatDate(iso: string) {
  const s = (iso ?? "").trim();
  const ymd = /^\d{4}-\d{2}-\d{2}$/.test(s)
    ? s
    : Number.isNaN(Date.parse(s))
      ? new Date().toISOString().slice(0, 10)
      : new Date(s).toISOString().slice(0, 10);
  const d = new Date(ymd + "T12:00:00");
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Parse transaction date string to start-of-day timestamp (local) for range checks */
function getTxDateMs(tx: Transaction): number {
  const s = (tx.date ?? "").trim();
  const ymd = /^\d{4}-\d{2}-\d{2}$/.test(s)
    ? s
    : Number.isNaN(Date.parse(s))
      ? new Date().toISOString().slice(0, 10)
      : new Date(s).toISOString().slice(0, 10);
  return new Date(ymd + "T00:00:00").getTime();
}

function getRangeForFilter(
  filter: "Daily" | "Weekly" | "Monthly" | "Yearly"
): { startMs: number; endMs: number } {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1;

  switch (filter) {
    case "Daily":
      return { startMs: startOfToday, endMs: endOfToday };
    case "Weekly": {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 6);
      const start = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate()).getTime();
      return { startMs: start, endMs: endOfToday };
    }
    case "Monthly": {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth(), lastDay.getDate(), 23, 59, 59, 999).getTime();
      return { startMs: startOfMonth, endMs: endOfMonth };
    }
    case "Yearly": {
      const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999).getTime();
      return { startMs: startOfYear, endMs: endOfYear };
    }
  }
}

const FILTER_PILLS = ["Daily", "Weekly", "Monthly", "Yearly"] as const;

export default function ExpenseHistoryPage() {
  const { transactions, loading, error, refetch } = useTransactions();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<(typeof FILTER_PILLS)[number]>("Monthly");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { openEditModal } = useExpenseModal();

  const toDateOnly = (s: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(s?.trim() ?? "")
      ? s.trim()
      : Number.isNaN(Date.parse(s ?? ""))
        ? new Date().toISOString().slice(0, 10)
        : new Date(s).toISOString().slice(0, 10);

  const transactionToFormData = (tx: Transaction): ExpenseFormData => ({
    id: tx.id,
    amount: Math.abs(tx.amount).toString(),
    category: tx.category,
    subcategory: "",
    description: tx.description,
    date: toDateOnly(tx.date),
    isIncome: tx.isIncome,
    incomeType: tx.incomeType,
  });

  const handleEditClick = () => {
    if (selectedTransaction) {
      openEditModal(transactionToFormData(selectedTransaction));
      setIsDrawerOpen(false);
      setSelectedTransaction(null);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedTransaction) return;
    setDeleteError(null);
    const isIncome = selectedTransaction.source === "income" || selectedTransaction.isIncome;
    const result = isIncome
      ? await deleteIncome(selectedTransaction.id)
      : await deleteExpense(selectedTransaction.id);
    if (result.error) {
      setDeleteError(result.error.message);
      return;
    }
    await refetch();
    setShowDeleteConfirm(false);
    setIsDrawerOpen(false);
    setSelectedTransaction(null);
  };

  const handleRowClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedTransaction(null);
    setShowDeleteConfirm(false);
    setDeleteError(null);
  };

  const searchTerm = searchQuery.trim().toLowerCase();
  const { startMs, endMs } = getRangeForFilter(activeFilter);

  const filteredTransactions = transactions.filter((tx) => {
    const txMs = getTxDateMs(tx);
    if (txMs < startMs || txMs > endMs) return false;
    if (searchTerm === "") return true;
    return (tx.description ?? "").toLowerCase().includes(searchTerm);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 md:p-8 flex items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 md:p-8 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Page Header */}
        <header>
          <h1 className="text-2xl font-semibold text-gray-900">Expense History</h1>
          <p className="mt-1 text-sm text-gray-500">
            Search, filter, and audit your transactions
          </p>
        </header>

        {/* Search + Filter Pills */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <input
              type="search"
              placeholder="Search by description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pl-10 text-gray-900 placeholder:text-gray-500 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              🔍
            </span>
          </div>
          <div className="flex gap-2">
            {FILTER_PILLS.map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() => setActiveFilter(pill)}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                  activeFilter === pill
                    ? "border-[#2E8B57] bg-[#2E8B57] text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                {pill}
              </button>
            ))}
          </div>
        </div>

        {/* Table (Desktop) / Cards (Mobile) */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Desktop: Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Description
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => handleRowClick(tx)}
                    className="cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50 last:border-b-0"
                  >
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(tx.date)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <span>{tx.categoryIcon}</span>
                        {tx.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{tx.description}</td>
                    <td
                      className={`px-6 py-4 text-right text-sm font-medium ${
                        tx.isIncome ? "text-[#2E8B57]" : "text-red-500"
                      }`}
                    >
                      {tx.isIncome ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: Card-based list */}
          <div className="md:hidden divide-y divide-gray-100">
            {filteredTransactions.map((tx) => (
              <button
                key={tx.id}
                type="button"
                onClick={() => handleRowClick(tx)}
                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-gray-50"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="text-xl">{tx.categoryIcon}</span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">{tx.description}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(tx.date)} · {tx.category}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 font-medium ${
                    tx.isIncome ? "text-[#2E8B57]" : "text-red-500"
                  }`}
                >
                  {tx.isIncome ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Slide-over Drawer (Edit/Delete) */}
        {isDrawerOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={closeDrawer}
              aria-hidden="true"
            />
            <aside
              className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-gray-200 bg-white p-6 shadow-xl"
              role="dialog"
              aria-label="Transaction details"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Transaction</h3>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              {selectedTransaction && (
                <div className="mt-6 space-y-4">
                  <div>
                    <p className="text-xs font-medium uppercase text-gray-500">Description</p>
                    <p className="mt-1 text-gray-900">{selectedTransaction.description}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-gray-500">Category</p>
                    <p className="mt-1 text-gray-900">
                      {selectedTransaction.categoryIcon} {selectedTransaction.category}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-gray-500">Amount</p>
                    <p
                      className={`mt-1 text-lg font-semibold ${
                        selectedTransaction.isIncome ? "text-[#2E8B57]" : "text-red-500"
                      }`}
                    >
                      {selectedTransaction.isIncome ? "+" : ""}$
                      {Math.abs(selectedTransaction.amount).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-gray-500">Date</p>
                    <p className="mt-1 text-gray-900">{formatDate(selectedTransaction.date)}</p>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleEditClick}
                      className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteClick}
                      className="flex-1 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                  {/* Delete confirmation */}
                  {showDeleteConfirm && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                      <p className="text-sm text-gray-700">
                        Are you sure you want to delete this transaction?
                      </p>
                      {deleteError && (
                        <p className="mt-2 text-sm text-red-600">{deleteError}</p>
                      )}
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setShowDeleteConfirm(false); setDeleteError(null); }}
                          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={confirmDelete}
                          className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </aside>
          </>
        )}
      </div>
    </div>
  );
}
