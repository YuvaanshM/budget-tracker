-- Room budgets: one total budget per room; expenses track against it.
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.room_budgets (
  room_id UUID PRIMARY KEY REFERENCES public.rooms(id) ON DELETE CASCADE,
  budget_limit NUMERIC(12, 2) NOT NULL CHECK (budget_limit >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.room_budgets ENABLE ROW LEVEL SECURITY;

-- Same as rooms: members can view/update; owners can insert
CREATE POLICY "Members can view room budget"
  ON public.room_budgets FOR SELECT
  USING (public.is_room_member(room_id, auth.uid()));

CREATE POLICY "Members can insert room budget"
  ON public.room_budgets FOR INSERT
  WITH CHECK (public.is_room_member(room_id, auth.uid()));

CREATE POLICY "Members can update room budget"
  ON public.room_budgets FOR UPDATE
  USING (public.is_room_member(room_id, auth.uid()));
