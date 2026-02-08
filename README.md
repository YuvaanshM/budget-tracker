# BudgetBase

A personal finance app for tracking income, expenses, and budgets. Built for the hackathon.

## Team Members
- Yuvaansh Malhotra
- Abhinav Kambhampaty
- Shyleshh Kala Gopalakrishanan

## Purpose

BudgetBase helps users:

- Track income and expenses
- Set and monitor budgets by category
- Get alerts at 50%, 90%, and 100% of budget
- View analytics (spending trends, savings rate)
- Share budgets with roommates
- Export data to CSV

## Tools Utilized

- **Next.js 16** – React framework
- **Supabase** – Auth, PostgreSQL, real-time
- **Tailwind CSS** – Styling
- **Recharts** – Charts and graphs
- **Vercel** – Hosting

## Problems & Solutions

### 1. Vercel build failing – missing Supabase env vars

**Problem:** Build failed with "Missing Supabase env vars."

**Solution:** Added `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel → Settings → Environment Variables.

### 2. Friends unable to access deployed site – "Access required"

**Problem:** Users saw "Access required" and couldn’t sign in.

**Solution:** Turned off Vercel Deployment Protection in Vercel → Settings → Deployment Protection, so the app is publicly accessible.

### 3. Sign-in redirects not working for deployed URL

**Problem:** Auth redirects didn’t work on the Vercel domain.

**Solution:** Updated Supabase Authentication → URL Configuration with the correct Site URL and Redirect URLs for the Vercel deployment.

## Credits & Frameworks

- [Next.js](https://nextjs.org/) – React framework
- [Supabase](https://supabase.com/) – Auth and backend
- [Recharts](https://recharts.org/) – Chart library
- [Tailwind CSS](https://tailwindcss.com/) – CSS framework
- [Vercel](https://vercel.com/) – Hosting
