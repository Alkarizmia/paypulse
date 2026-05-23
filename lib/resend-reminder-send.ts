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

export type ReminderSendFromContext = "manual" | "automation";

/** Expéditeur Resend : automation → MAIL_FROM_AUTO_REMINDERS si défini, sinon MAIL_FROM. Manuel → MAIL_FROM. */
export function resolveReminderFromAddress(context: ReminderSendFromContext): string | undefined {
  if (context === "automation") {
    return (
      process.env.MAIL_FROM_AUTO_REMINDERS?.trim() ||
      process.env.MAIL_FROM?.trim()
    );
  }
  return process.env.MAIL_FROM?.trim();
}

export function hasResendReminderFrom(context: ReminderSendFromContext): boolean {
  return Boolean(resolveReminderFromAddress(context));
}

/**
 * Envoi Resend pour relances (/api/send-reminder manuel ou runner automatique).
 */
export type ResendEmailAttachment = {
  filename: string;
  content: string;
};

export async function sendResendReminderEmail(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: ResendEmailAttachment[];
  /** Manuel : MAIL_FROM uniquement. Automatisation : MAIL_FROM_AUTO_REMINDERS puis repli sur MAIL_FROM. */
  fromContext?: ReminderSendFromContext;
}): Promise<ResendReminderSendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromContext = params.fromContext ?? "manual";
  const from = resolveReminderFromAddress(fromContext);
  if (!apiKey) {
    return { ok: false, error: "Missing RESEND_API_KEY." };
  }
  if (!from) {
    const err =
      fromContext === "automation"
        ? "Missing MAIL_FROM (ou MAIL_FROM_AUTO_REMINDERS pour les relances auto)."
        : "Missing MAIL_FROM.";
    return { ok: false, error: err };
  }

  const to = normalizeRecipientEmail(params.to);
  const subject = params.subject.trim();
  const text = params.text.trim() || " ";
  const html = typeof params.html === "string" ? params.html.trim() : "";

  const resend = new Resend(apiKey);
  const attachments =
    params.attachments?.filter((a) => a.filename && a.content).map((a) => ({
      filename: a.filename,
      content: a.content,
    })) ?? [];

  const message = {
    from,
    to,
    subject,
    text,
    ...(html ? { html } : {}),
    ...(attachments.length > 0 ? { attachments } : {}),
  } as const;

  const { data, error } = await resend.emails.send(message);

  if (error) {
    const hint = resendTestingRecipientHint(error.message);
    return hint ? { ok: false, error: error.message, hint } : { ok: false, error: error.message };
  }

  return { ok: true, id: data?.id ?? null };
}
