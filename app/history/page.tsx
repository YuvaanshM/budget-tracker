"use client";

import { useState } from "react";
import { useExpenseModal, type ExpenseFormData } from "@/context/ExpenseModalContext";
import { type Transaction } from "@/lib/mockData";

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const FILTER_PILLS = ["Daily", "Weekly", "Monthly", "Yearly"] as const;

export default function ExpenseHistoryPage() {
  const transactions: Transaction[] = [];
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<(typeof FILTER_PILLS)[number]>("Monthly");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { openEditModal } = useExpenseModal();

  const transactionToFormData = (tx: Transaction): ExpenseFormData => ({
    id: tx.id,
    amount: Math.abs(tx.amount).toString(),
    category: tx.category,
    subcategory: "",
    description: tx.description,
    date: tx.date,
    isIncome: tx.isIncome,
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

  const confirmDelete = () => {
    console.log("Delete transaction:", selectedTransaction?.id);
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
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6 md:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Page Header */}
        <header>
          <h1 className="text-2xl font-semibold text-zinc-50">Expense History</h1>
          <p className="mt-1 text-sm text-zinc-400">
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
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pl-10 text-zinc-100 placeholder-zinc-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
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
                    ? "border-white/20 bg-white/10 text-zinc-50"
                    : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/5 hover:text-zinc-300"
                }`}
              >
                {pill}
              </button>
            ))}
          </div>
        </div>

        {/* Table (Desktop) / Cards (Mobile) */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
          {/* Desktop: Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Description
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => handleRowClick(tx)}
                    className="cursor-pointer border-b border-white/5 transition-colors hover:bg-white/5 last:border-b-0"
                  >
                    <td className="px-6 py-4 text-sm text-zinc-300">{formatDate(tx.date)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2 text-sm text-zinc-200">
                        <span>{tx.categoryIcon}</span>
                        {tx.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-300">{tx.description}</td>
                    <td
                      className={`px-6 py-4 text-right text-sm font-medium ${
                        tx.isIncome ? "text-emerald-400" : "text-red-400"
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
          <div className="md:hidden divide-y divide-white/5">
            {transactions.map((tx) => (
              <button
                key={tx.id}
                type="button"
                onClick={() => handleRowClick(tx)}
                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-white/5"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="text-xl">{tx.categoryIcon}</span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-100">{tx.description}</p>
                    <p className="text-sm text-zinc-500">
                      {formatDate(tx.date)} · {tx.category}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 font-medium ${
                    tx.isIncome ? "text-emerald-400" : "text-red-400"
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
              className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-zinc-900 p-6 shadow-xl"
              role="dialog"
              aria-label="Transaction details"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-zinc-50">Transaction</h3>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-white/5 hover:text-zinc-50"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              {selectedTransaction && (
                <div className="mt-6 space-y-4">
                  <div>
                    <p className="text-xs font-medium uppercase text-zinc-500">Description</p>
                    <p className="mt-1 text-zinc-100">{selectedTransaction.description}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-zinc-500">Category</p>
                    <p className="mt-1 text-zinc-100">
                      {selectedTransaction.categoryIcon} {selectedTransaction.category}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-zinc-500">Amount</p>
                    <p
                      className={`mt-1 text-lg font-semibold ${
                        selectedTransaction.isIncome ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {selectedTransaction.isIncome ? "+" : ""}$
                      {Math.abs(selectedTransaction.amount).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-zinc-500">Date</p>
                    <p className="mt-1 text-zinc-100">{formatDate(selectedTransaction.date)}</p>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleEditClick}
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-white/10"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteClick}
                      className="flex-1 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/20"
                    >
                      Delete
                    </button>
                  </div>
                  {/* Delete confirmation skeleton */}
                  {showDeleteConfirm && (
                    <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                      <p className="text-sm text-zinc-300">
                        Are you sure you want to delete this transaction?
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={confirmDelete}
                          className="flex-1 rounded-lg bg-red-500/20 px-3 py-2 text-sm font-medium text-red-400"
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
