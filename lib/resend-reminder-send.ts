import { Resend } from "resend";

export type ResendReminderSendResult =
  | { ok: true; id: string | null }
  | { ok: false; error: string; hint?: "domain_required" };

/** Resend sans domaine vérifié : envoi réservé à l’e-mail du compte. */
export function resendTestingRecipientHint(message: string): "domain_required" | null {
  const m = message.toLowerCase();
  if (
    m.includes("verify a domain") ||
    m.includes("only send testing") ||
    m.includes("testing emails to your own") ||
    m.includes("testing emails to the") ||
    (m.includes("testing") && m.includes("own email"))
  ) {
    return "domain_required";
  }
  return null;
}

function normalizeRecipientEmail(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Envoi unique utilisé par la relance manuelle (/api/send-reminder) et le runner auto
 * (mêmes variables RESEND_API_KEY / MAIL_FROM, même forme d’appel Resend).
 */
export async function sendResendReminderEmail(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<ResendReminderSendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.MAIL_FROM?.trim();
  if (!apiKey) {
    return { ok: false, error: "Missing RESEND_API_KEY." };
  }
  if (!from) {
    return { ok: false, error: "Missing MAIL_FROM." };
  }

  const to = normalizeRecipientEmail(params.to);
  const subject = params.subject.trim();
  const text = params.text.trim() || " ";
  const html = typeof params.html === "string" ? params.html.trim() : "";

  const resend = new Resend(apiKey);
  const message = {
    from,
    to,
    subject,
    text,
    ...(html ? { html } : {}),
  } as const;

  const { data, error } = await resend.emails.send(message);

  if (error) {
    const hint = resendTestingRecipientHint(error.message);
    return hint ? { ok: false, error: error.message, hint } : { ok: false, error: error.message };
  }

  return { ok: true, id: data?.id ?? null };
}
