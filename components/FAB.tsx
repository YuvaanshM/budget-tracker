"use client";

import { useExpenseModal } from "@/context/ExpenseModalContext";

/** Mobile: fixed bottom-right (above bottom nav) */
export function FABMobile() {
  const { openAddModal } = useExpenseModal();
  return (
    <button
      type="button"
      onClick={openAddModal}
      className="fixed bottom-24 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-600 text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950 md:hidden"
      aria-label="Add expense or income"
    >
      <PlusIcon className="h-7 w-7" />
    </button>
  );
}

/** Desktop: inside header, top-right */
export function FABDesktop() {
  const { openAddModal } = useExpenseModal();
  return (
    <button
      type="button"
      onClick={openAddModal}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 text-white transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
      aria-label="Add expense or income"
    >
      <PlusIcon className="h-6 w-6" />
    </button>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
    </svg>
  );
}
