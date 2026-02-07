import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. In .env.local add:\n' +
      '  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\n' +
      '  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key\n' +
      '(or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)'
  )
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)