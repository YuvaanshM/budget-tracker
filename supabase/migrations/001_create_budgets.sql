-- Budgets table for budget tracker
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- NOTE: user_id is not an FK to auth.users to avoid constraint issues in some Supabase setups.
-- RLS policies below ensure users can only access their own rows.

CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  budget_limit NUMERIC(12, 2) NOT NULL CHECK (budget_limit >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, category)
);

-- Enable Row Level Security (RLS)
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies so this migration can be re-run safely
DROP POLICY IF EXISTS "Users can view own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can insert own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can update own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can delete own budgets" ON budgets;

-- Users can only access their own budgets
CREATE POLICY "Users can view own budgets"
  ON budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets"
  ON budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
  ON budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
  ON budgets FOR DELETE
  USING (auth.uid() = user_id);
