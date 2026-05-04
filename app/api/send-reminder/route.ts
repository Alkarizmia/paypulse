import { NextResponse } from "next/server";
import { clientIpFromRequest } from "@/lib/client-ip";
import { isRateLimited } from "@/lib/route-rate-limit";
import { sendResendReminderEmail } from "@/lib/resend-reminder-send";
import { serverStructuredLog } from "@/lib/server-log";
import { getUserIdFromAuthorizationHeader } from "@/lib/supabase-route-auth";

type ReminderRequest = {
  to?: string;
  subject?: string;
  html?: string;
  text?: string;
};

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

const MAX_SUBJECT_CHARS = 500;
const MAX_BODY_CHARS = 120_000;

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
    isRateLimited(`send-reminder:user:${userId}`, Number(process.env.API_SEND_REMINDER_MAX_PER_USER_PER_HOUR ?? 30), 3_600_000)
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

  const to = typeof payload.to === "string" ? normalizeEmail(payload.to) : "";
  const subject = typeof payload.subject === "string" ? payload.subject.trim().slice(0, MAX_SUBJECT_CHARS) : "";
  const html = typeof payload.html === "string" ? payload.html.trim().slice(0, MAX_BODY_CHARS) : "";
  const text = typeof payload.text === "string" ? payload.text.trim().slice(0, MAX_BODY_CHARS) : "";

  if (!to || !subject || (!html && !text)) {
    return NextResponse.json(
      { ok: false, error: "Required fields: to, subject, and html or text." },
      { status: 400 },
    );
  }

  const result = await sendResendReminderEmail({
    to,
    subject,
    text: text || " ",
    ...(html ? { html } : {}),
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

  serverStructuredLog("api_send_reminder_ok", { userPrefix: userId.slice(0, 8) });
  return NextResponse.json({ ok: true, id: result.id });
}
