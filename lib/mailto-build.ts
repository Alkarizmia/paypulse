/**
 * Construit la query d’un lien `mailto:` sans `URLSearchParams` : ce dernier encode
 * les espaces en `+` (x-www-form-urlencoded), et beaucoup de clients mail affichent
 * les « + » littéralement au lieu des espaces. `encodeURIComponent` utilise `%20`.
 */
export const MAILTO_HREF_SAFE_MAX = 1900;

function appendQueryPair(out: string[], key: string, value: string): void {
  if (!value) return;
  out.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
}

export function buildMailtoQueryString(params: { subject?: string; body?: string; bcc?: string }): string {
  const parts: string[] = [];
  appendQueryPair(parts, "subject", params.subject ?? "");
  appendQueryPair(parts, "body", params.body ?? "");
  if (params.bcc?.trim()) {
    appendQueryPair(parts, "bcc", params.bcc.trim());
  }
  return parts.join("&");
}

export function buildMailtoSingleRecipient(to: string, subject: string, body: string): string {
  const q = buildMailtoQueryString({ subject, body });
  const addr = to.trim();
  if (!addr) {
    return q ? `mailto:?${q}` : "mailto:";
  }
  return q ? `mailto:${addr}?${q}` : `mailto:${addr}`;
}

export function buildMailtoBccRecipients(bcc: string[], subject: string, body: string): string {
  const cleaned = [...new Set(bcc.map((e) => e.trim().toLowerCase()).filter(Boolean))];
  const q = buildMailtoQueryString({
    subject,
    body,
    bcc: cleaned.join(","),
  });
  return q ? `mailto:?${q}` : "mailto:";
}
