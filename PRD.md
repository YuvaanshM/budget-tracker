# Budget Tracker Hackathon App - PRD

**Project Name:** Budget Tracker App
**Team:** 3 Members
**Tech Stack:** Next.js (frontend), Supabase (database + auth), Gemini/OpenAI (optional AI features), Vercel (deployment)

---

## 1. Overview / Purpose

The Budget Tracker App allows users to track their income, expenses, and budgets efficiently. It provides intuitive visualization of spending trends, budget alarms, historical analysis, and optional AI-driven insights to improve financial decision-making. Users can also collaborate on shared budgets (e.g., with roommates).

**Primary Goals:**

1. Provide users with real-time expense tracking and budgeting tools.
2. Enable clear visualization of spending by category and overall trends.
3. Support collaboration and notifications to encourage financial discipline.
4. Optional: Enhance UX with AI-powered categorization and spending recommendations.

---

## 2. Key Features

### 2.1 User Authentication

* Managed by Supabase Auth
* Supports:

  * Email/password login
  * Magic link login (passwordless, optional for demo)
  * OAuth (Google/GitHub) optional
* Each user has a unique `user_id` used to associate expenses and budgets.

**Edge cases:**

* Prevent duplicate emails
* Force password strength (minimum 8 chars, one number, one symbol)
* Protect routes so logged-out users cannot access dashboards

---

### 2.2 Database (Supabase)

* **Users table:** `id`, `email`, `income`, `created_at`
* **Expenses table:** `id`, `user_id`, `amount`, `category`, `subcategory`, `description`, `date`
* **Budgets table:** `id`, `user_id`, `category`, `subcategory`, `budget_limit`, `current_spent`
* **Shared Budgets table:** `id`, `budget_id`, `user_id`
* **Security:** Row Level Security (RLS) to ensure users only access their own data.

**Edge cases:**

* Limit expenses or budgets per category to prevent null/negative values
* Prevent unauthorized access to shared budgets

---

### 2.3 Expense Management

* Add/remove expenses
* Categorize expenses using tags: main category + optional subcategory
* Users can create new tags and sub-tags dynamically
* Expenses default to the current date, but users can select custom dates

**Edge cases:**

* Prevent negative or non-numeric expense amounts
* Prevent invalid dates (future dates beyond today optional)
* Prevent empty categories

---

### 2.4 Dashboard & Visualization

* Pie charts and bar graphs for category breakdowns
* Total monthly expense display
* Compare current vs previous month spending as percentages
* Optional: toggle between daily, weekly, monthly, annual views

**Edge cases:**

* If no expenses exist, display a placeholder (“No expenses yet”)
* Handle very high/low values in graphs gracefully

---

### 2.5 Budgeting & Alerts

* Users can set budgets per category and an overall expenditure budget
* Real-time calculation of category totals vs budget
* Budget alarms: Send notifications/email when user approaches max budget for category or overall
* Optional: threshold percentage for alerts (e.g., 80% of budget)

**Edge cases:**

* Prevent budget limit < 0
* Handle multiple notifications without spamming
* Secure email sending (rate limit + validate addresses)

---

### 2.6 Expense History

* Show expenses by:

  * Category, subcategory
  * Date range
  * Search by keyword
* Percent change compared to last month
* Filter by daily/weekly/monthly/yearly

**Edge cases:**

* Handle empty history gracefully
* Avoid division by zero when comparing months with no expenses

---

### 2.7 AI Features (Optional)

* Auto-categorization: AI suggests category/subcategory for each new expense
* Spending recommendations: AI analyzes monthly trends and provides tips to cut spending

**Edge cases:**

* API rate limit enforcement to avoid exceeding free tier
* Handle API failures gracefully with fallback to manual categorization

---

### 2.8 Export Feature

* Export expenses to CSV/Excel
* Include date, category, subcategory, description, and amount
* Optional: export filtered view only

---

### 2.9 Shared Budgets / Collaboration

* Users can invite others (roommates/friends) to a shared budget
* Shared budgets reflect expenses added by all participants
* Optional notifications when any participant exceeds budget

**Edge cases:**

* Prevent unauthorized edits from non-invited users
* Handle users leaving shared budget gracefully

---

### 2.10 UI Design & Navigation

* Login Page: Default page on app open
* Home/Dashboard Page: Default after login
* Left-hand tabs:

  * History – View/filter past expenses
  * Budgets – Set/view budgets and alerts
  * Settings – Manage profile, monthly income, shared budgets
* Add Expense button:

  * Opens form with: amount, category/subcategory, description, date

**Edge cases:**

* Responsive layout (mobile + desktop)
* Handle long category/subcategory names gracefully
* Input validation for all forms

---

## 3. Security & Safety

* Authentication & RLS: Users only access their own data
* Rate limiting: For AI API calls and email alerts
* Input validation: Prevent SQL injection, XSS, or invalid data in all forms
* Sensitive keys: Stored in environment variables (`.env.local`)
* Deployment: HTTPS enforced via Vercel

---

## 4. Technical Requirements

* Frontend: Next.js, Tailwind CSS (optional)
* Backend & DB: Supabase (Auth + Postgres + RLS)
* AI Integration: Gemini/OpenAI via API (optional)
* Deployment: Vercel
* Email Notifications: Use Supabase functions or an external service (SendGrid, etc.)

---

## 5. Edge Cases / Error Handling

* Prevent negative or empty expense/budget values
* Handle missing categories/subcategories
* Handle empty history gracefully
* Handle API failures for AI suggestions
* Handle concurrent edits in shared budgets

---

## 6. Milestones / MVP for Hackathon

1. User login / authentication
2. Add/remove expenses with category/subcategory
3. Display total monthly expenses and dashboard
4. Expense history with filters
5. Optional: AI features (if time permits)

**Stretch goals:**

* Budget alarms via email
* Shared budgets / collaboration
* Export to CSV/Excel

---

This PRD provides a **complete blueprint** for your team to start coding with clear features, edge cases, and security considerations.
