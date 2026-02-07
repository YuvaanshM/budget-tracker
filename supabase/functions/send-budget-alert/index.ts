// Supabase Edge Function: Send budget alert email via Resend
// Deploy: supabase functions deploy send-budget-alert
// Set secret: supabase secrets set RESEND_API_KEY=re_xxxxx
//
// Resend onboarding@resend.dev can only send to your Resend signup email.
// Set BUDGET_ALERT_TEST_EMAIL to that email for testing, or verify a domain for production.

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("BUDGET_ALERT_FROM_EMAIL") ?? "Budget Tracker <onboarding@resend.dev>";
const TEST_EMAIL = Deno.env.get("BUDGET_ALERT_TEST_EMAIL");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BudgetAlertRequest {
  userEmail: string;
  category: string;
  budgetLimit: number;
  currentSpent: number;
  percentUsed: number;
  threshold: 50 | 90 | 100;
}

function jsonResponse(data: unknown, status: number, extraHeaders?: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...extraHeaders },
  });
}

function getThresholdMessage(threshold: 50 | 90 | 100): string {
  if (threshold === 50) return "50% of your budget used";
  if (threshold === 90) return "90% of your budget used – almost at your limit";
  return "100% of your budget reached";
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set");
    return jsonResponse({ error: "Email service not configured. Set RESEND_API_KEY secret." }, 500);
  }

  let body: BudgetAlertRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const { userEmail, category, budgetLimit, currentSpent, percentUsed, threshold } = body;

  if (
    !userEmail ||
    typeof category !== "string" ||
    typeof budgetLimit !== "number" ||
    typeof currentSpent !== "number" ||
    typeof threshold !== "number"
  ) {
    return jsonResponse({ error: "Missing or invalid fields" }, 400);
  }

  const toEmail = TEST_EMAIL?.trim() || userEmail;

  const subject = `Budget Alert: ${category} – ${getThresholdMessage(threshold as 50 | 90 | 100)}`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #27272a; max-width: 480px; margin: 0 auto; padding: 24px;">
  <h1 style="color: #18181b; font-size: 20px; margin-bottom: 16px;">Budget Alert</h1>
  <p style="margin-bottom: 16px;">Your <strong>${category}</strong> budget has reached <strong>${threshold}%</strong>.</p>
  <p style="margin-bottom: 16px;">${getThresholdMessage(threshold as 50 | 90 | 100)}.</p>
  <div style="background: #f4f4f5; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
    <p style="margin: 0 0 8px 0;"><strong>Spent:</strong> ${formatCurrency(currentSpent)}</p>
    <p style="margin: 0;"><strong>Limit:</strong> ${formatCurrency(budgetLimit)}</p>
  </div>
  <p style="font-size: 14px; color: #71717a;">Manage your budgets in the app to stay on track.</p>
</body>
</html>
`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [toEmail],
      subject,
      html,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("Resend API error:", res.status, data);
    return jsonResponse(
      { error: "Email send failed", resendError: data?.message ?? data?.name ?? String(data) },
      res.status
    );
  }

  return jsonResponse(data, 200);
});
