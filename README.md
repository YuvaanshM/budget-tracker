# Budget Tracker

A budget tracking app built with Next.js, Supabase, and Tailwind.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Create `.env.local` in the project root with:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Database schema

Run the migrations in your Supabase project. In the [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql), execute the contents of:

- `supabase/migrations/001_create_budgets.sql`

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
