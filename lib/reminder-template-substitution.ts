/** Variables supportées dans les sujets / corps des modèles de relance (substitution côté serveur à l’envoi). */
export const REMINDER_TEMPLATE_VARIABLES_DOC = [
  "{{clientName}}",
  "{{amount}}",
  "{{dueDate}}",
  "{{scheduleDays}}",
] as const;

export type ReminderSubstitutionContext = {
  clientName: string;
  amountFormatted: string;
  dueDate: string;
  scheduleDays: number;
};

export function substituteReminderTemplate(template: string, ctx: ReminderSubstitutionContext): string {
  return template
    .replaceAll("{{clientName}}", ctx.clientName)
    .replaceAll("{{amount}}", ctx.amountFormatted)
    .replaceAll("{{dueDate}}", ctx.dueDate)
    .replaceAll("{{scheduleDays}}", String(ctx.scheduleDays));
}

export function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Attribut href / src sûr (pas de javascript:). */
export function sanitizeUrlForEmail(url: string | null | undefined): string | null {
  if (!url) return null;
  const t = url.trim();
  if (!t) return null;
  const lower = t.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:")) return null;
  if (lower.startsWith("http://") || lower.startsWith("https://") || lower.startsWith("mailto:")) return t;
  return null;
}

export function reminderBodyToHtml(bodyText: string, paymentLink: string | null): string {
  const escaped = escapeHtml(bodyText);
  const paras = escaped.replaceAll("\n", "<br/>");
  const safe = sanitizeUrlForEmail(paymentLink);
  const linkBlock = safe
    ? `<p style="margin-top:16px"><a href="${escapeHtml(safe)}">${escapeHtml(safe)}</a></p>`
    : "";
  return `<div style="font-family:system-ui,sans-serif;line-height:1.5">${paras}${linkBlock}</div>`;
}

export function reminderBodyToPlainText(bodyText: string, paymentLink: string | null): string {
  const safe = sanitizeUrlForEmail(paymentLink);
  if (!safe) return bodyText;
  return `${bodyText}\n\n${safe}`;
}
