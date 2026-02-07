-- Income table. user_id references public.users(id).
-- Run after public.users exists. Ensure user row exists (e.g. ensureCurrentUserInPublicUsers) before inserting.

CREATE TABLE IF NOT EXISTS public.income (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  income_type text NOT NULL CHECK (income_type IN ('yearly_salary', 'monthly_salary', 'one_time')),
  description text,
  date timestamp without time zone DEFAULT now(),
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_income_user_date ON public.income(user_id, date DESC);

ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own income"
  ON public.income
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
