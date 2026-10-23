const PREFIX = "pp-client-reminded-at:";

export function markClientReminderSent(clientId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${PREFIX}${clientId}`, new Date().toISOString());
  } catch {
    /* quota / private mode */
  }
}

export function wasClientReminderSent(clientId: string): boolean {
  return getClientReminderSentAt(clientId) !== null;
}

export function getClientReminderSentAt(clientId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${PREFIX}${clientId}`);
    return raw && raw.length > 0 ? raw : null;
  } catch {
    return null;
  }
}

export function countClientRemindersSent(clientIds: string[]): number {
  return clientIds.filter((id) => wasClientReminderSent(id)).length;
}

/** Reminders marked sent in the current calendar month (local timezone). */
export function countClientRemindersSentThisMonth(clientIds: string[]): number {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  let n = 0;
  for (const id of clientIds) {
    const raw = getClientReminderSentAt(id);
    if (!raw) continue;
    const at = new Date(raw);
    if (Number.isNaN(at.getTime())) continue;
    if (at.getFullYear() === y && at.getMonth() === m) n += 1;
  }
  return n;
}
