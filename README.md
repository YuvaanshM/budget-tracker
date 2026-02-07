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

### 4. (Optional) Budget alert emails

To send email notifications when budgets hit 50%, 90%, or 100%, see [docs/BUDGET_ALERTS_EMAIL_SETUP.md](docs/BUDGET_ALERTS_EMAIL_SETUP.md).

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
