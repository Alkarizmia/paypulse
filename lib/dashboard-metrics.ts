import type { Client } from "@/app/dashboard/types";

/** Mois calendaire (année, mois 0-11) */
export type YearMonth = { y: number; m: number };

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

export function addMonths(d: Date, delta: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1, 0, 0, 0, 0);
}

export function parseISODate(s: string | undefined | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Encaissements reconnus (historique `paidEvents`, sinon repli sur statut payé + paidAt). */
export function eachRecognizedPayment(c: Client): { at: Date; amount: number }[] {
  const out: { at: Date; amount: number }[] = [];
  if (c.paidEvents && c.paidEvents.length > 0) {
    for (const ev of c.paidEvents) {
      const paid = parseISODate(ev.at);
      if (paid && Number.isFinite(ev.amount)) out.push({ at: paid, amount: ev.amount });
    }
    return out;
  }
  if (c.status === "paid") {
    const paid = parseISODate(c.paidAt) ?? parseISODate(c.createdAt);
    if (paid) out.push({ at: paid, amount: c.amountDue });
  }
  return out;
}

/** Encaissements (sommes marquées payées) par mois, sur les `months` derniers mois (le plus ancien en premier). */
export function monthlyPaidInflows(clients: Client[], months = 6): { value: number; ym: YearMonth }[] {
  const now = new Date();
  const start = startOfMonth(addMonths(now, -(months - 1)));
  const buckets: { ym: YearMonth; value: number }[] = [];
  for (let i = 0; i < months; i++) {
    const d = addMonths(start, i);
    buckets.push({ ym: { y: d.getFullYear(), m: d.getMonth() }, value: 0 });
  }

  for (const c of clients) {
    for (const { at, amount } of eachRecognizedPayment(c)) {
      const y = at.getFullYear();
      const m = at.getMonth();
      const idx = buckets.findIndex((b) => b.ym.y === y && b.ym.m === m);
      if (idx >= 0) {
        buckets[idx].value += amount;
      }
    }
  }

  return buckets.map((b) => ({
    ym: b.ym,
    value: Math.round(b.value * 100) / 100,
  }));
}

export function monthLabel(ym: YearMonth, locale: "fr" | "en"): string {
  const fr = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  const en = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const arr = locale === "fr" ? fr : en;
  return arr[ym.m] ?? `${ym.m + 1}`;
}

/** Total encaissé sur les 30 derniers jours vs les 30 jours précédents (historique d’encaissements). */
export function rolling30dPaidComparison(clients: Client[]): { current: number; previous: number; pct: number | null } {
  const now = Date.now();
  const d30 = now - 30 * 24 * 60 * 60 * 1000;
  const d60 = now - 60 * 24 * 60 * 60 * 1000;
  let current = 0;
  let previous = 0;
  for (const c of clients) {
    for (const { at, amount } of eachRecognizedPayment(c)) {
      const t = at.getTime();
      if (t >= d30 && t <= now) current += amount;
      else if (t >= d60 && t < d30) previous += amount;
    }
  }
  if (previous <= 0 && current <= 0) return { current, previous, pct: null };
  if (previous <= 0) return { current, previous, pct: current > 0 ? 100 : 0 };
  const pct = Math.round(((current - previous) / previous) * 1000) / 10;
  return { current, previous, pct };
}

/** Délai moyen (jours) entre création et chaque encaissement reconnu. */
export function averagePaymentDelayDays(clients: Client[]): number | null {
  const deltas: number[] = [];
  for (const c of clients) {
    const created = parseISODate(c.createdAt);
    if (!created) continue;
    for (const { at } of eachRecognizedPayment(c)) {
      const days = (at.getTime() - created.getTime()) / (24 * 60 * 60 * 1000);
      if (days >= 0 && days < 3650) deltas.push(days);
    }
  }
  if (deltas.length === 0) return null;
  return Math.round((deltas.reduce((a, b) => a + b, 0) / deltas.length) * 10) / 10;
}

export function formatPctChange(pct: number | null, locale: "fr" | "en"): string {
  if (pct === null) return locale === "fr" ? "— pas assez d’historique" : "— not enough history";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct}%`;
}

/**
 * Liste relance : impayés en tête (échéance la plus ancienne = le plus en retard en premier),
 * puis payés en bas (échéance la plus récente d’abord).
 */
export function sortClientsForRelanceList(clients: Client[]): Client[] {
  return [...clients].sort((a, b) => {
    if (a.status !== b.status) return a.status === "unpaid" ? -1 : 1;
    const dueA = new Date(a.dueDate + "T12:00:00").getTime();
    const dueB = new Date(b.dueDate + "T12:00:00").getTime();
    if (a.status === "unpaid") return dueA - dueB;
    return dueB - dueA;
  });
}

/** Facture active liée à la période (échéance, création ou paiement intersecte [from, to]). */
export function filterClientsInWindow(clients: Client[], from: Date, to: Date): Client[] {
  const t0 = from.getTime();
  const t1 = to.getTime();
  return clients.filter((c) => {
    const times: number[] = [];
    const cr = parseISODate(c.createdAt)?.getTime();
    if (cr) times.push(cr);
    const due = parseISODate(c.dueDate + "T12:00:00")?.getTime();
    if (due) times.push(due);
    const paid = parseISODate(c.paidAt)?.getTime();
    if (paid) times.push(paid);
    for (const ev of c.paidEvents ?? []) {
      const t = parseISODate(ev.at)?.getTime();
      if (t) times.push(t);
    }
    if (times.length === 0) return false;
    const lo = Math.min(...times);
    const hi = Math.max(...times);
    return hi >= t0 && lo <= t1;
  });
}
