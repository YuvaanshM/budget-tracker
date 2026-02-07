# Supabase SQL – run manually

**Nothing here runs automatically.** You run SQL in **Supabase Dashboard → SQL Editor** when needed.

## Fix “foreign key constraint” errors (do this first)

If you get `expenses_user_id_fkey` or `income_user_id_fkey` when adding an expense or income:

1. Open your project in [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor**.
2. Copy the contents of **`public-users-rls.sql`** and run it once.

That adds RLS policies so the app can create/update your row in `public.users` (which `expenses` and `income` reference).

## Other SQL files (only if you need them)

- **`expenses-table.sql`** – Run only if you are creating the `expenses` table from scratch (you may already have it).
- **`income-table.sql`** – Run only if you are creating the `income` table from scratch (you may already have it).

You can ignore **`add-income-type-column.sql`**; it was for an older design.
