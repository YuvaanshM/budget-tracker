-- Add budget alerts toggle. Run in Supabase SQL Editor.
ALTER TABLE budgets
  ADD COLUMN IF NOT EXISTS alerts_enabled BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN budgets.alerts_enabled IS 'When true, user can receive alerts when approaching or exceeding the budget limit.';
