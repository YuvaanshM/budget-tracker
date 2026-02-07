import { supabase } from "@/lib/supabaseClient";
import { getCategoryIcon, type IncomeType, type Transaction } from "@/lib/mockData";

export type IncomeRow = {
  id: string;
  user_id: string;
  amount: number;
  income_type: string;
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

const INCOME_TYPE_TO_CATEGORY: Record<string, string> = {
  yearly_salary: "Yearly salary",
  monthly_salary: "Monthly salary",
  one_time: "One-time",
};

export function mapIncomeRowToTransaction(row: IncomeRow): Transaction {
  const category = INCOME_TYPE_TO_CATEGORY[row.income_type] ?? "One-time";
  return {
    id: row.id,
    date: normalizeDateFromApi(row.date),
    category,
    categoryIcon: getCategoryIcon(category, true),
    description: row.description ?? "",
    amount: row.amount,
    isIncome: true,
    incomeType: row.income_type as IncomeType,
    source: "income",
  };
}

export async function fetchIncomeForUser(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("income")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapIncomeRowToTransaction);
}

export type InsertIncome = {
  user_id: string;
  amount: number;
  income_type: "yearly_salary" | "monthly_salary" | "one_time";
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

export async function insertIncome(row: InsertIncome): Promise<{ error: Error | null }> {
  const date = toISODateOnly(row.date);
  const { error } = await supabase.from("income").insert({
    user_id: row.user_id,
    amount: Math.abs(row.amount),
    income_type: row.income_type,
    description: row.description ?? "",
    date,
  });
  return { error: error ?? null };
}

export type UpdateIncome = {
  amount: number;
  income_type: "yearly_salary" | "monthly_salary" | "one_time";
  description?: string;
  date: string;
};

export async function updateIncome(
  id: string,
  row: UpdateIncome
): Promise<{ error: Error | null }> {
  const date = toISODateOnly(row.date);
  const { error } = await supabase
    .from("income")
    .update({
      amount: Math.abs(row.amount),
      income_type: row.income_type,
      description: row.description ?? "",
      date,
    })
    .eq("id", id);
  return { error: error ?? null };
}

export async function deleteIncome(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("income").delete().eq("id", id);
  return { error: error ?? null };
}
