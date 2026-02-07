# Budget Alerts – Email Setup (Supabase)

This app sends **in-app notifications** and **emails** when a budget with alerts enabled reaches 50%, 90%, or 100%.

In-app notifications work out of the box. For **email notifications**, choose one:

- **Option A: Gmail SMTP** – Sends to any user, no domain needed. Best before deployment.
- **Option B: Resend API** – Requires domain verification for arbitrary recipients.

---

## Option A: Gmail SMTP (Recommended Before You Have a Domain)

Sends to each user's real email. No domain or Resend needed.

### 1. Create a Gmail App Password

1. Go to [Google Account](https://myaccount.google.com/) → Security.
2. Enable 2-Step Verification if not already.
3. Under "App passwords", create a new app password for "Mail".
4. Copy the 16-character password.

### 2. Set Supabase Secrets

```bash
supabase secrets set GMAIL_USER=budgetbase@gmail.com
supabase secrets set GMAIL_APP_PASSWORD=your-16-char-app-password
```

### 3. Deploy the Edge Function

```bash
supabase functions deploy send-budget-alert
```

Done. Emails will go to each user's Supabase auth email.

---

## Option B: Resend API

### 1. Create a Resend Account & API Key

1. Go to [resend.com](https://resend.com) and sign up (free tier available).
2. Create an API key: **Resend Dashboard → API Keys → Create API Key**.
3. Copy the API key (starts with `re_`).

### 2. Configure Supabase Edge Function Secret

Add your Resend API key as a Supabase secret:

```bash
supabase secrets set RESEND_API_KEY=re_your_api_key_here
```

Or via the Supabase Dashboard:

1. Go to **Project Settings → Edge Functions**.
2. Add a secret: `RESEND_API_KEY` = your Resend API key.

### 3. Deploy the Edge Function

Deploy the `send-budget-alert` function:

```bash
supabase functions deploy send-budget-alert
```

Make sure you have the [Supabase CLI](https://supabase.com/docs/guides/cli) installed and linked to your project.

### 4. Resend Recipient Restriction (Important)

Resend limits `onboarding@resend.dev` to only send to your Resend signup email. For testing:

For production: [verify your domain](https://resend.com/domains), then set BUDGET_ALERT_FROM_EMAIL and remove BUDGET_ALERT_TEST_EMAIL.

```bash
supabase secrets set BUDGET_ALERT_TEST_EMAIL="your-resend-signup@email.com"
```

---

## Summary Checklist

**Gmail SMTP (Option A):**

- [ ] Create Gmail App Password
- [ ] Set `GMAIL_USER` and `GMAIL_APP_PASSWORD` in Supabase secrets
- [ ] Deploy: `supabase functions deploy send-budget-alert`

**Resend (Option B):**

- [ ] Create Resend account
- [ ] Create Resend API key
- [ ] Set `RESEND_API_KEY` in Supabase secrets
- [ ] Deploy: `supabase functions deploy send-budget-alert`
- [ ] Set `BUDGET_ALERT_TEST_EMAIL` (testing) OR verify domain (production)

---

## How It Works

1. **In-app**: When a user’s budget (with alerts on) hits 50%, 90%, or 100%, a notification appears in the bell icon dropdown in the header.
2. **Email**: The app calls the Supabase Edge Function `send-budget-alert`, which uses Resend to send an email to the user’s registered email address.
3. **Deduplication**: Each budget + month + threshold is only notified once (tracked in `localStorage` in the app).

---

## Troubleshooting

- **Emails not arriving?**  
  - **Gmail**: Use an App Password, not your normal Gmail password. Enable 2-Step Verification first.  
  - **Resend restriction**: With `onboarding@resend.dev`, you can only send to your Resend signup email. Set `BUDGET_ALERT_TEST_EMAIL` to that email, or verify a domain.  
  - Check spam/junk folder.  
  - Open the browser console (F12) when an alert fires—errors are logged there.  
  - Inspect Edge Function logs in Supabase Dashboard → Edge Functions → Logs.

- **"Email send failed" / Resend errors?**  
  - Resend returns specific errors (e.g. "You can only send to your own email"). Check the browser console or Supabase Edge Function logs for the exact message.

- **CORS errors?**  
  - The function sets `Access-Control-Allow-Origin: *` for all responses.
