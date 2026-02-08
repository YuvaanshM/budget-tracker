/**
 * Export and wipe user data.
 */

import type { Transaction } from "@/lib/mockData";
import { supabase } from "./supabaseClient";

/** Generate CSV content from transactions and trigger download. */
export function exportTransactionsToCsv(transactions: Transaction[]): void {
  const headers = ["Date", "Type", "Category", "Description", "Amount"];
  const rows = transactions.map((t) => {
    const type = t.isIncome ? "Income" : "Expense";
    const amount = t.isIncome ? t.amount : Math.abs(t.amount);
    return [t.date, type, t.category, t.description ?? "", amount.toFixed(2)];
  });
  const csvContent = [
    headers.join(","),
    ...rows.map((r) =>
      r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `budget-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Delete all user data: expenses, income, budgets, and rooms owned. Does NOT leave rooms or delete room memberships. */
export async function wipeAllUserData(userId: string): Promise<{ error: Error | null }> {
  try {
    // 1. Personal data
    await supabase.from("expenses").delete().eq("user_id", userId);
    await supabase.from("income").delete().eq("user_id", userId);
    await supabase.from("budgets").delete().eq("user_id", userId);

    // 2. Delete only rooms owned by user (cascades: room_members, shared_expenses, expense_splits, room_budgets, settlements for those rooms)
    await supabase.from("rooms").delete().eq("created_by", userId);

    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e : new Error("Failed to wipe data") };
  }
}
