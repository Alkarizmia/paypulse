import { NextResponse } from "next/server";
import { clientIpFromRequest } from "@/lib/client-ip";
import { isAppLocale, type AppLocale } from "@/lib/app-locale";
import { isRateLimited } from "@/lib/route-rate-limit";
import { getSupabaseServerClient } from "@/lib/server-supabase";
import { serverStructuredLog } from "@/lib/server-log";
import { isWaitlistMode } from "@/lib/waitlist-mode";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LEN = 254;
const MAX_SOURCE_LEN = 64;

type WaitlistBody = {
  email?: unknown;
  source?: unknown;
  langue?: unknown;
  /** Honeypot : doit rester vide */
  company?: unknown;
};

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return email.length > 0 && email.length <= MAX_EMAIL_LEN && EMAIL_RE.test(email);
}

/** Réponse succès unique (nouvel email ou déjà inscrit) — pas d'énumération. */
function successResponse() {
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  if (!isWaitlistMode()) {
    return NextResponse.json({ ok: false, error: "waitlist_disabled" }, { status: 404 });
  }

  const ip = clientIpFromRequest(request);
  if (isRateLimited(`waitlist:ip:${ip}`, 5, 60_000)) {
    serverStructuredLog("api_waitlist_rate_limit", { scope: "ip" });
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: WaitlistBody;
  try {
    body = (await request.json()) as WaitlistBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  // Honeypot : bots qui remplissent le champ caché → succès silencieux
  if (typeof body.company === "string" && body.company.trim() !== "") {
    serverStructuredLog("api_waitlist_honeypot");
    return successResponse();
  }

  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  const sourceRaw = typeof body.source === "string" ? body.source.trim().slice(0, MAX_SOURCE_LEN) : "";
  const source = sourceRaw || "landing";
  const langueRaw = typeof body.langue === "string" ? body.langue.trim().toLowerCase() : "";
  const langue: AppLocale = isAppLocale(langueRaw) ? langueRaw : "en";

  const supabase = getSupabaseServerClient();
  if (!supabase.ok) {
    serverStructuredLog("api_waitlist_supabase_missing", { error: supabase.error });
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  // Schéma attendu : email + source + langue. Si colonnes absentes (table partielle),
  // repli sur email seul pour ne pas bloquer la collecte.
  let { error } = await supabase.client.from("waitlist").insert({
    email,
    source,
    langue,
  });

  if (error && isMissingWaitlistColumnError(error)) {
    serverStructuredLog("api_waitlist_schema_fallback", {
      code: typeof error.code === "string" ? error.code : "unknown",
    });
    ({ error } = await supabase.client.from("waitlist").insert({ email }));
  }

  if (error) {
    // Unique violation (email déjà inscrit) → même succès
    const code = typeof error.code === "string" ? error.code : "";
    const msg = (error.message ?? "").toLowerCase();
    if (code === "23505" || msg.includes("duplicate") || msg.includes("unique")) {
      serverStructuredLog("api_waitlist_duplicate");
      return successResponse();
    }
    serverStructuredLog("api_waitlist_insert_error", {
      code: code || "unknown",
      hint: (error.message ?? "").slice(0, 120),
    });
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  serverStructuredLog("api_waitlist_ok");
  return successResponse();
}

function isMissingWaitlistColumnError(error: { code?: string; message?: string }): boolean {
  const code = typeof error.code === "string" ? error.code : "";
  const msg = (error.message ?? "").toLowerCase();
  return (
    code === "PGRST204" ||
    (msg.includes("could not find") && msg.includes("column")) ||
    (msg.includes("column") && msg.includes("does not exist"))
  );
}
