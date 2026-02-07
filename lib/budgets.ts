/**
 * Budget database operations via Supabase.
 */

import { supabase } from "./supabaseClient";

export type DbBudget = {
  id: string;
  user_id: string;
  category: string;
  budget_limit: number;
  created_at?: string;
};

export type Budget = {
  id: string;
  category: string;
  budgetLimit: number;
};

function toBudget(row: DbBudget): Budget {
  return {
    id: row.id,
    category: row.category,
    budgetLimit: Number(row.budget_limit),
  };
}

export async function fetchBudgets(userId: string): Promise<Budget[]> {
  const { data, error } = await supabase
    .from("budgets")
    .select("id, user_id, category, budget_limit, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(toBudget);
}

export async function createBudget(
  userId: string,
  category: string,
  budgetLimit: number
): Promise<Budget> {
  const { data, error } = await supabase
    .from("budgets")
    .insert({
      user_id: userId,
      category,
      budget_limit: budgetLimit,
    })
    .select("id, user_id, category, budget_limit, created_at")
    .single();

  if (error) {
    const msg = error.message;
    if (msg?.includes("does not exist") || msg?.includes("relation")) {
      throw new Error(
        "Budgets table not found. Run the migration in Supabase SQL Editor: supabase/migrations/001_create_budgets.sql"
      );
    }
    if (msg?.includes("row-level security") || msg?.includes("policy")) {
      throw new Error(
        "Access denied. Make sure you're signed in and the budgets table has the correct RLS policies."
      );
    }
    throw new Error(msg || "Failed to create budget");
  }
  return toBudget(data);
}
