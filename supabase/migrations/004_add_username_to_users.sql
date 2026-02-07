-- Add unique username to public.users and RPC for availability check.
-- Run in Supabase Dashboard → SQL Editor.

-- Add column (allow NULL for existing rows)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS username TEXT;

-- Uniqueness: no two users can have the same username (NULLs allowed)
CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON public.users (username)
  WHERE username IS NOT NULL;

-- RPC: returns true if username is available for the given user (not taken by someone else)
CREATE OR REPLACE FUNCTION public.check_username_available(
  p_username TEXT,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE username = NULLIF(TRIM(p_username), '')
      AND id != p_user_id
  );
$$;

-- Allow authenticated users to call the function
GRANT EXECUTE ON FUNCTION public.check_username_available(TEXT, UUID) TO authenticated;
