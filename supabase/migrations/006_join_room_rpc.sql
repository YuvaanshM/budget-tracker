-- RPC to join a room by invite code (bypasses RLS for room lookup + room_members insert)
-- Run in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.join_room_by_invite_code(p_invite_code TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  created_by UUID,
  invite_code TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room RECORD;
BEGIN
  -- Find room by invite code (case-insensitive)
  SELECT r.id, r.name, r.created_by, r.invite_code, r.created_at
  INTO v_room
  FROM public.rooms r
  WHERE r.invite_code = NULLIF(TRIM(UPPER(p_invite_code)), '');

  IF v_room.id IS NULL THEN
    RETURN;  -- Room not found
  END IF;

  -- Insert current user as member (bypasses RLS)
  INSERT INTO public.room_members (room_id, user_id, role)
  VALUES (v_room.id, auth.uid(), 'member')
  ON CONFLICT (room_id, user_id) DO NOTHING;

  RETURN QUERY SELECT v_room.id, v_room.name, v_room.created_by, v_room.invite_code, v_room.created_at;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_room_by_invite_code(TEXT) TO authenticated;
