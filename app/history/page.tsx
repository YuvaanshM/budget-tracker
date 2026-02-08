"use client";

import { useState, useMemo } from "react";
import { useExpenseModal, type ExpenseFormData } from "@/context/ExpenseModalContext";
import { useTransactions } from "@/context/TransactionsContext";
import { deleteIncome } from "@/lib/income";
import { deleteExpense } from "@/lib/transactions";
import { formatCurrency } from "@/lib/formatCurrency";
import { type Transaction } from "@/lib/mockData";

const SECTIONS_PER_PAGE = 6;
const FILTER_PILLS = ["Daily", "Weekly", "Monthly", "Yearly"] as const;
type FilterMode = (typeof FILTER_PILLS)[number];

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

function toDateOnly(s: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(s?.trim() ?? "")
    ? s.trim()
    : Number.isNaN(Date.parse(s ?? ""))
      ? new Date().toISOString().slice(0, 10)
      : new Date(s).toISOString().slice(0, 10);
}

/** Get Monday (start of week) for a given date string */
function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday = 1
  const mon = new Date(d.setDate(diff));
  return mon.toISOString().slice(0, 10);
}

function formatWeekTitle(weekKey: string): string {
  const d = new Date(weekKey + "T12:00:00");
  return "Week of " + d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatMonthTitle(yearMonth: string): string {
  const [y, m] = yearMonth.split("-");
  const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export type GroupedSection = {
  key: string;
  title: string;
  transactions: Transaction[];
  totalExpenses: number;
  totalIncome: number;
};

function groupTransactions(
  transactions: Transaction[],
  filter: FilterMode
): GroupedSection[] {
  const searchable = transactions;
  const byKey = new Map<string, Transaction[]>();

  for (const tx of searchable) {
    const dateStr = toDateOnly(tx.date);
    let key: string;
    switch (filter) {
      case "Daily":
        key = dateStr;
        break;
      case "Weekly":
        key = getWeekKey(dateStr);
        break;
      case "Monthly":
        key = dateStr.slice(0, 7); // YYYY-MM
        break;
      case "Yearly":
        key = dateStr.slice(0, 4); // YYYY
        break;
    }
    const list = byKey.get(key) ?? [];
    list.push(tx);
    byKey.set(key, list);
  }

  const sections: GroupedSection[] = [];
  for (const [key, txs] of byKey.entries()) {
    const sorted = [...txs].sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
    let totalExpenses = 0;
    let totalIncome = 0;
    for (const t of sorted) {
      if (t.isIncome) totalIncome += t.amount;
      else totalExpenses += Math.abs(t.amount);
    }
    let title: string;
    switch (filter) {
      case "Daily":
        title = formatDate(key);
        break;
      case "Weekly":
        title = formatWeekTitle(key);
        break;
      case "Monthly":
        title = formatMonthTitle(key);
        break;
      case "Yearly":
        title = key;
        break;
    }
    sections.push({ key, title, transactions: sorted, totalExpenses, totalIncome });
  }
  sections.sort((a, b) => (b.key > a.key ? 1 : b.key < a.key ? -1 : 0));
  return sections;
}

export default function ExpenseHistoryPage() {
  const { transactions, loading, error, refetch } = useTransactions();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterMode>("Monthly");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const { openEditModal } = useExpenseModal();

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

  const handleDeleteClick = () => setShowDeleteConfirm(true);

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

  const handleRowClick = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedTransaction(null);
    setShowDeleteConfirm(false);
    setDeleteError(null);
  };

  const searchTerm = searchQuery.trim().toLowerCase();
  const filteredTransactions = useMemo(
    () =>
      searchTerm === ""
        ? transactions
        : transactions.filter((t) =>
            (t.description ?? "").toLowerCase().includes(searchTerm)
          ),
    [transactions, searchTerm]
  );

  const sections = useMemo(
    () => groupTransactions(filteredTransactions, activeFilter),
    [filteredTransactions, activeFilter]
  );

  const totalPages = Math.max(1, Math.ceil(sections.length / SECTIONS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages - 1);
  const startIdx = safePage * SECTIONS_PER_PAGE;
  const visibleSections = sections.slice(startIdx, startIdx + SECTIONS_PER_PAGE);

  const handleFilterChange = (filter: FilterMode) => {
    setActiveFilter(filter);
    setCurrentPage(0);
  };


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
        <header>
          <h1 className="text-2xl font-semibold text-gray-900">Expense History</h1>
          <p className="mt-1 text-sm text-gray-500">
            Search, filter, and audit your transactions
          </p>
        </header>

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
                onClick={() => handleFilterChange(pill)}
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

        {/* Grouped sections with pagination */}
        <div className="mt-6 space-y-4">
          {visibleSections.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-500 shadow-sm">
              No transactions found
            </div>
          ) : (
            visibleSections.map((section) => (
              <section
                key={section.key}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                  <h2 className="text-sm font-semibold text-gray-900">
                    {activeFilter === "Yearly" ? `${section.title} – Total for year` : section.title}
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Expenses: {formatCurrency(section.totalExpenses, { exact: true })}
                    {section.totalIncome > 0 && (
                      <> · Income: {formatCurrency(section.totalIncome, { exact: true })}</>
                    )}
                  </p>
                </div>
                <div>
                  {/* Desktop: table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <tbody>
                        {section.transactions.map((tx) => (
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
                              {tx.isIncome ? "+" : ""}
                              {formatCurrency(Math.abs(tx.amount), { exact: true })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile: cards */}
                  <div className="md:hidden divide-y divide-gray-100">
                    {section.transactions.map((tx) => (
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
                          {tx.isIncome ? "+" : ""}
                          {formatCurrency(Math.abs(tx.amount), { exact: true })}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 py-4">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                ← Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {safePage + 1} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={safePage >= totalPages - 1}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Slide-over Drawer */}
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
                      {selectedTransaction.isIncome ? "+" : ""}
                      {formatCurrency(Math.abs(selectedTransaction.amount), { exact: true })}
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
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeleteError(null);
                          }}
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

