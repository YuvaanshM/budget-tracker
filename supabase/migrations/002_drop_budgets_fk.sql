-- Fix: Remove FK constraint that causes "violates foreign key constraint budgets_user_id_fkey"
-- Run this in Supabase SQL Editor if you already have the budgets table with the FK.

ALTER TABLE budgets
  DROP CONSTRAINT IF EXISTS budgets_user_id_fkey;
