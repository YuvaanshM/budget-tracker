-- Run this once in Supabase Dashboard → SQL Editor.
-- Fixes: "violates foreign key constraint expenses_user_id_fkey" / "income_user_id_fkey"
-- by allowing the app to create/update a row in public.users for the logged-in user.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own row" ON public.users;
CREATE POLICY "Users can insert own row"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own row" ON public.users;
CREATE POLICY "Users can update own row"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Optional: allow users to read their own row (for profile, etc.)
DROP POLICY IF EXISTS "Users can read own row" ON public.users;
CREATE POLICY "Users can read own row"
  ON public.users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
