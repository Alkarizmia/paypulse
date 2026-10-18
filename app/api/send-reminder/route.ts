import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { clientIpFromRequest } from "@/lib/client-ip";
import { isRateLimited } from "@/lib/route-rate-limit";
import { sendResendReminderEmail } from "@/lib/resend-reminder-send";
import { serverStructuredLog } from "@/lib/server-log";
import { getUserIdFromAuthorizationHeader } from "@/lib/supabase-route-auth";

/**
 * Templates prédéfinis uniquement (plus de subject/html arbitraires).
 * Placeholders : {{client_name}}, {{amount}}
 */
const REMINDER_TEMPLATES = {
  polite_first: {
    subject: "Petit rappel concernant votre facture",
    text: "Bonjour {{client_name}},\n\nSauf erreur de notre part, un montant de {{amount}} reste en attente. Merci de nous indiquer si le règlement est en cours.\n\nCordialement",
  },
  firm_followup: {
    subject: "Relance : facture en attente",
    text: "Bonjour {{client_name}},\n\nNous n'avons pas encore reçu le règlement de {{amount}}. Merci de procéder au paiement ou de nous répondre rapidement.\n\nCordialement",
  },
  short_nudge: {
    subject: "Rappel amical",
    text: "Bonjour {{client_name}},\n\nPetit rappel : {{amount}} est toujours en attente de règlement. Merci !",
  },
} as const;

type TemplateId = keyof typeof REMINDER_TEMPLATES;

type ReminderRequest = {
  clientId?: string;
  templateId?: string;
};

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isTemplateId(value: string): value is TemplateId {
  return Object.prototype.hasOwnProperty.call(REMINDER_TEMPLATES, value);
}

function formatAmount(amount: number): string {
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} €`;
  }
}

function applyTemplate(raw: string, vars: { client_name: string; amount: string }): string {
  return raw
    .replaceAll("{{client_name}}", vars.client_name)
    .replaceAll("{{amount}}", vars.amount);
}

function trimEnv(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  if (isRateLimited(`send-reminder:ip:${ip}`, 40, 3_600_000)) {
    serverStructuredLog("api_send_reminder_rate_limit", { scope: "ip" });
    return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });
  }

  const userId = await getUserIdFromAuthorizationHeader(request);
  if (!userId) {
    serverStructuredLog("api_send_reminder_unauthorized");
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  if (
    isRateLimited(
      `send-reminder:user:${userId}`,
      Number(process.env.API_SEND_REMINDER_MAX_PER_USER_PER_HOUR ?? 30),
      3_600_000,
    )
  ) {
    serverStructuredLog("api_send_reminder_rate_limit", { scope: "user", userPrefix: userId.slice(0, 8) });
    return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });
  }

  let payload: ReminderRequest;
  try {
    payload = (await request.json()) as ReminderRequest;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const clientId = typeof payload.clientId === "string" ? payload.clientId.trim() : "";
  const templateIdRaw = typeof payload.templateId === "string" ? payload.templateId.trim() : "";
  if (!clientId || !isTemplateId(templateIdRaw)) {
    return NextResponse.json(
      { ok: false, error: "Required fields: clientId and a valid templateId." },
      { status: 400 },
    );
  }

  const url = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const authHeader = request.headers.get("authorization") ?? "";
  if (!url || !anonKey || !authHeader.toLowerCase().startsWith("bearer ")) {
    return NextResponse.json({ ok: false, error: "Server misconfigured." }, { status: 500 });
  }

  const bearer = authHeader.slice(7).trim();
  const userClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${bearer}` } },
  });

  const { data: clientRow, error: clientError } = await userClient
    .from("clients")
    .select("id, name, email, amount_due, workspace_id")
    .eq("id", clientId)
    .is("deleted_at", null)
    .maybeSingle();

  if (clientError || !clientRow) {
    serverStructuredLog("api_send_reminder_client_denied", { userPrefix: userId.slice(0, 8) });
    return NextResponse.json({ ok: false, error: "Client not found." }, { status: 404 });
  }

  const to = normalizeEmail(typeof clientRow.email === "string" ? clientRow.email : "");
  if (!to) {
    return NextResponse.json({ ok: false, error: "Client has no email." }, { status: 400 });
  }

  const amountRaw =
    typeof clientRow.amount_due === "number"
      ? clientRow.amount_due
      : Number.parseFloat(String(clientRow.amount_due ?? 0));
  const vars = {
    client_name: (typeof clientRow.name === "string" && clientRow.name.trim()) || "client",
    amount: formatAmount(Number.isFinite(amountRaw) ? amountRaw : 0),
  };

  const template = REMINDER_TEMPLATES[templateIdRaw];
  const subject = applyTemplate(template.subject, vars);
  const text = applyTemplate(template.text, vars);

  const result = await sendResendReminderEmail({
    to,
    subject,
    text,
  });

  if (!result.ok) {
    if (result.error === "Missing RESEND_API_KEY." || result.error === "Missing MAIL_FROM.") {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json(
      result.hint ? { ok: false, error: result.error, hint: result.hint } : { ok: false, error: result.error },
      { status: 400 },
    );
  }

  serverStructuredLog("api_send_reminder_ok", {
    userPrefix: userId.slice(0, 8),
    templateId: templateIdRaw,
  });
  return NextResponse.json({ ok: true, id: result.id });
}
