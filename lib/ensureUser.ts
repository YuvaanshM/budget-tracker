import { supabase } from "@/lib/supabaseClient";

/**
 * Ensures the current auth user has a row in public.users so that
 * expenses and income (which reference public.users(id)) can be inserted.
 * Requires RLS on public.users to allow insert/update for auth.uid() = id (see supabase/README-SQL.md).
 */
export async function ensureCurrentUserInPublicUsers(): Promise<{
  userId: string | null;
  error: Error | null;
}> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  const email = session?.user?.email ?? "";
  if (!userId) {
    return { userId: null, error: new Error("Not logged in") };
  }
  const { error } = await supabase.from("users").upsert(
    {
      id: userId,
      email: email || "unknown@unknown",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (error) return { userId, error };
  return { userId, error: null };
}
