import { supabase } from "@/lib/supabaseClient";
import { getCategoryIcon, type Transaction } from "@/lib/mockData";

export type ExpenseRow = {
  id: string;
  user_id: string;
  amount: number;
  category: string | null;
  subcategory: string | null;
  description: string | null;
  date: string;
  created_at?: string;
};

export function mapExpenseRowToTransaction(row: ExpenseRow): Transaction {
  const category = row.category ?? "Other";
  return {
    id: row.id,
    date: row.date,
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

export async function insertExpense(row: InsertExpense): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("expenses").insert({
    user_id: row.user_id,
    amount: Math.abs(row.amount),
    category: row.category ?? "Other",
    subcategory: row.subcategory ?? "",
    description: row.description ?? "",
    date: row.date,
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
  const { error } = await supabase
    .from("expenses")
    .update({
      amount: Math.abs(row.amount),
      category: row.category ?? "Other",
      subcategory: row.subcategory ?? "",
      description: row.description ?? "",
      date: row.date,
    })
    .eq("id", id);
  return { error: error ?? null };
}
