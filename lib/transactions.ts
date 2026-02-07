import { supabase } from "@/lib/supabaseClient";
import { getCategoryIcon, type Transaction } from "@/lib/mockData";

export type { Transaction } from "@/lib/mockData";

export type ExpenseRow = {
  id: string;
  user_id: string;
  amount: number;
  category: string | null;
  subcategory: string | null;
  description: string | null;
  date: string | null;
  created_at?: string;
};

function normalizeDateFromApi(value: string | null | undefined): string {
  if (value == null || value === "") return new Date().toISOString().slice(0, 10);
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const t = Date.parse(s);
  if (!Number.isNaN(t)) return new Date(t).toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

export function mapExpenseRowToTransaction(row: ExpenseRow): Transaction {
  const category = row.category ?? "Other";
  return {
    id: row.id,
    date: normalizeDateFromApi(row.date),
    category,
    categoryIcon: getCategoryIcon(category, false),
    description: row.description ?? "",
    amount: -Math.abs(row.amount),
    isIncome: false,
    incomeType: undefined,
    source: "expense",
  };
}

export async function fetchExpensesForUser(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapExpenseRowToTransaction);
}

export type InsertExpense = {
  user_id: string;
  amount: number;
  category?: string;
  subcategory?: string;
  description?: string;
  date: string;
};

function toISODateOnly(s: string): string {
  const trimmed = s?.trim() ?? "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const t = Date.parse(trimmed);
  if (!Number.isNaN(t)) return new Date(t).toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

export async function insertExpense(row: InsertExpense): Promise<{ error: Error | null }> {
  const date = toISODateOnly(row.date);
  const { error } = await supabase.from("expenses").insert({
    user_id: row.user_id,
    amount: Math.abs(row.amount),
    category: row.category ?? "Other",
    subcategory: row.subcategory ?? "",
    description: row.description ?? "",
    date,
  });
  return { error: error ?? null };
}

export type UpdateExpense = {
  amount: number;
  category?: string;
  subcategory?: string;
  description?: string;
  date: string;
};

export async function updateExpense(
  id: string,
  row: UpdateExpense
): Promise<{ error: Error | null }> {
  const date = toISODateOnly(row.date);
  const { error } = await supabase
    .from("expenses")
    .update({
      amount: Math.abs(row.amount),
      category: row.category ?? "Other",
      subcategory: row.subcategory ?? "",
      description: row.description ?? "",
      date,
    })
    .eq("id", id);
  return { error: error ?? null };
}

export async function deleteExpense(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  return { error: error ?? null };
}
