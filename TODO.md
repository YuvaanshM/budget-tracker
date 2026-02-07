# Budget Tracker – TODO

> **When developing features:** Work from this list in order. Reference [PRD.md](PRD.md) and [DesignDoc.md](DesignDoc.md) for specs. Mark tasks `[x]` when done, `[~]` when in progress.

**Tech stack:** Next.js · Supabase · Tailwind · Vercel  
**Team:** 3 members (Member 1: Auth+DB, Expenses, Budgets, Shared | Member 2: Layout, Dashboard | Member 3: Expense History, Settings, Export)

| Status | Legend |
|--------|--------|
| `[ ]` | Pending |
| `[~]` | In progress |
| `[x]` | Done |

---

## Phase 1: Foundation

### 1. Auth & Database
- [ ] Configure Supabase Auth (email/password)
  - [ ] Password validation: min 8 chars, one number, one symbol
  - [ ] Prevent duplicate emails on signup
- [ ] Create database schema in Supabase
  - [ ] `users` table: `id`, `email`, `income`, `created_at`
  - [ ] `expenses` table: `id`, `user_id`, `amount`, `category`, `subcategory`, `description`, `date`
  - [ ] `budgets` table: `id`, `user_id`, `category`, `subcategory`, `budget_limit`, `current_spent`
  - [ ] `shared_budgets` table: `id`, `budget_id`, `user_id`
- [ ] Implement Row Level Security (RLS) policies
  - [ ] Users can only access their own data
  - [ ] Prevent unauthorized access to shared budgets
- [ ] Build route protection middleware (redirect logged-out users to login)
- [ ] Create Login page UI
- [ ] Create Register page UI

### 2. Global Layout & Navigation
- [x] Implement fixed left sidebar (desktop)
  - [x] Icons only on smaller desktops, icons + labels on large screens
- [x] Implement bottom tab bar (mobile): Home, History, Budgets, Settings
- [x] Apply theme: Sleto glassmorphic dark
  - [x] 1px borders (`border-white/10`), `backdrop-blur-md`, 16px border-radius
- [ ] Add Framer Motion base (page transitions, hover states)

---

## Phase 2: Core Features

### 3. Expense Management
- [x] Add Universal Add FAB (Floating Action Button)
  - [x] Bottom-right on mobile, top-right header on desktop
  - [x] Purple-to-blue gradient, large `+` icon
- [x] Build Add Expense modal
  - [x] Immediate focus on Amount input
  - [x] Fields: amount, category, subcategory, description, date
  - [x] Users can create new categories/subcategories dynamically
  - [x] Default date: today
- [~] Implement expense CRUD (create, read, update, delete) — skeleton UI done
- [~] Validation & edge cases — skeleton structure in place
  - [x] Prevent negative or non-numeric amounts
  - [x] Prevent invalid dates
  - [x] Prevent empty categories

### 4. Dashboard
- [ ] Top row: three summary cards
  - [ ] Total Income
  - [ ] Total Expenses
  - [ ] Remaining Budget
- [ ] Middle row: charts
  - [ ] Area chart: 30-day spending trends (left 60%)
  - [ ] Donut chart: spending by category (right 40%)
  - [ ] Side-by-side on desktop, stacked on mobile
- [ ] Bottom row
  - [ ] Upcoming Bills or Budget Alerts (left 50%)
  - [ ] Mini-table: 5 most recent transactions (right 50%)
- [ ] Empty states: "No expenses yet" when no data
- [ ] Handle very high/low values in charts

### 5. Expense History
- [ ] Header: search bar (by description) + filter pills (Daily, Weekly, Monthly, Yearly)
- [ ] Table view (desktop) / card-based list (mobile)
  - [ ] Columns: Date, Category (with icon), Description, Amount (red expense, green income)
- [ ] Click row → slide-over drawer to edit or delete
- [ ] Percent change vs last month (avoid division by zero)
- [ ] Filter by category, subcategory, date range
- [ ] Empty history state

---

## Phase 3: Budgets & Configuration

### 6. Budgets & Alerts
- [ ] Grid of progress cards
  - [ ] Category name (top left), $ remaining (top right)
  - [ ] Progress bar: green < 50%, yellow 50–80%, red > 80%
  - [ ] Pulse animation when budget exceeded
- [ ] "Create New Budget" button → modal
  - [ ] Link category to monthly limit
  - [ ] Prevent budget limit < 0
- [ ] Real-time category totals vs budget

### 7. Settings & Profile
- [ ] Profile section: avatar upload, email update
- [ ] Preferences: default currency
- [ ] Data section: Export to CSV, Wipe All Data (danger zone)
- [ ] Toggle for AI Auto-Categorization (placeholder for optional feature)

### 8. Export to CSV
- [ ] Export expenses with: date, category, subcategory, description, amount
- [ ] Trigger from Settings page

---

## Phase 4: Collaboration

### 9. Shared Budgets
- [ ] Tabs: Personal vs Shared
- [ ] Collaborator bar: row of user avatars
- [ ] Activity feed: e.g. "Sarah added $40 for Groceries"
- [ ] Invite others to shared budget
- [ ] Shared budgets reflect expenses from all participants
- [ ] RLS: prevent unauthorized edits from non-invited users

---

## Phase 5: Optional

- [ ] Magic link login (passwordless)
- [ ] OAuth (Google, GitHub)
- [ ] AI auto-categorization for new expenses
- [ ] AI spending recommendations
- [ ] Budget alarms via email (rate limit, validate addresses)
- [ ] Export filtered view only
- [ ] Handle users leaving shared budget
