-- Expenses only. Income is stored in public.income.
-- expenses.user_id references public.users(id). Ensure public.users has a row before inserting.

-- If creating from scratch, create public.users first (with id default auth.uid() or set on signup), then:

CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  category text NOT NULL DEFAULT '',
  subcategory text,
  description text,
  date timestamp without time zone DEFAULT now(),
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON public.expenses(user_id, date DESC);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own expenses"
  ON public.expenses
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
