-- 1. RPC: Get display names for users (bypasses RLS - users can only read own row)
-- Returns (user_id, display_name) - uses username, else email, else 'Member'

CREATE OR REPLACE FUNCTION public.get_member_display_names(p_user_ids UUID[])
RETURNS TABLE (user_id UUID, display_name TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT u.id AS user_id,
    COALESCE(NULLIF(TRIM(u.username), ''), u.email, 'Member') AS display_name
  FROM public.users u
  WHERE u.id = ANY(p_user_ids);
$$;

GRANT EXECUTE ON FUNCTION public.get_member_display_names(UUID[]) TO authenticated;


-- 2. Settlements: when user A pays user B, reduces "what A owes B"

CREATE TABLE IF NOT EXISTS public.settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_settlements_room ON public.settlements(room_id);

ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view settlements"
  ON public.settlements FOR SELECT
  USING (public.is_room_member(room_id, auth.uid()));

CREATE POLICY "Members can insert settlements"
  ON public.settlements FOR INSERT
  WITH CHECK (
    from_user_id = auth.uid()
    AND public.is_room_member(room_id, auth.uid())
  );


-- 3. Room budgets: support category or general (category '' = general)

-- Drop old room_budgets if it exists with old schema
DROP TABLE IF EXISTS public.room_budgets CASCADE;

CREATE TABLE public.room_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT '',
  budget_limit NUMERIC(12, 2) NOT NULL CHECK (budget_limit >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (room_id, category)
);

CREATE INDEX IF NOT EXISTS idx_room_budgets_room ON public.room_budgets(room_id);

ALTER TABLE public.room_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view room budget"
  ON public.room_budgets FOR SELECT
  USING (public.is_room_member(room_id, auth.uid()));

CREATE POLICY "Members can insert room budget"
  ON public.room_budgets FOR INSERT
  WITH CHECK (public.is_room_member(room_id, auth.uid()));

CREATE POLICY "Members can update room budget"
  ON public.room_budgets FOR UPDATE
  USING (public.is_room_member(room_id, auth.uid()));

CREATE POLICY "Members can delete room budget"
  ON public.room_budgets FOR DELETE
  USING (public.is_room_member(room_id, auth.uid()));
