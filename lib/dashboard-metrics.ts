import type { Client } from "@/app/dashboard/types";
import type { AppLocale } from "@/lib/app-locale";
import { intlLocaleFor } from "@/lib/app-locale";

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

function monthBuckets(months: number, endOffsetMonths = 0): { ym: YearMonth; value: number }[] {
  const now = new Date();
  const end = startOfMonth(addMonths(now, -endOffsetMonths));
  const start = startOfMonth(addMonths(end, -(months - 1)));
  const buckets: { ym: YearMonth; value: number }[] = [];
  for (let i = 0; i < months; i++) {
    const d = addMonths(start, i);
    buckets.push({ ym: { y: d.getFullYear(), m: d.getMonth() }, value: 0 });
  }
  return buckets;
}

function monthBucketsForYear(year: number): { ym: YearMonth; value: number }[] {
  return Array.from({ length: 12 }, (_, m) => ({ ym: { y: year, m }, value: 0 }));
}

/** Encaissements (sommes marquées payées) par mois, sur les `months` derniers mois (le plus ancien en premier). */
export function monthlyPaidInflows(clients: Client[], months = 6, endOffsetMonths = 0): { value: number; ym: YearMonth }[] {
  const buckets = monthBuckets(months, endOffsetMonths);

  for (const c of clients) {
    for (const { at, amount } of eachRecognizedPayment(c)) {
      const idx = buckets.findIndex((b) => b.ym.y === at.getFullYear() && b.ym.m === at.getMonth());
      if (idx >= 0) buckets[idx].value += amount;
    }
  }

  return buckets.map((b) => ({
    ym: b.ym,
    value: Math.round(b.value * 100) / 100,
  }));
}

/** Montants impayés regroupés par mois d’échéance. */
export function monthlyPendingByDueMonth(
  clients: Client[],
  months = 6,
  endOffsetMonths = 0,
): { value: number; ym: YearMonth }[] {
  const buckets = monthBuckets(months, endOffsetMonths);

  for (const c of clients) {
    if (c.status !== "unpaid") continue;
    const due = parseISODate(c.dueDate + "T12:00:00");
    if (!due) continue;
    const idx = buckets.findIndex((b) => b.ym.y === due.getFullYear() && b.ym.m === due.getMonth());
    if (idx >= 0) buckets[idx].value += c.amountDue;
  }

  return buckets.map((b) => ({
    ym: b.ym,
    value: Math.round(b.value * 100) / 100,
  }));
}

export function monthlyPaidInflowsForYear(clients: Client[], year: number): { value: number; ym: YearMonth }[] {
  const buckets = monthBucketsForYear(year);
  for (const c of clients) {
    for (const { at, amount } of eachRecognizedPayment(c)) {
      if (at.getFullYear() !== year) continue;
      buckets[at.getMonth()].value += amount;
    }
  }
  return buckets.map((b) => ({ ym: b.ym, value: Math.round(b.value * 100) / 100 }));
}

export function monthlyPendingByDueForYear(clients: Client[], year: number): { value: number; ym: YearMonth }[] {
  const buckets = monthBucketsForYear(year);
  for (const c of clients) {
    if (c.status !== "unpaid") continue;
    const due = parseISODate(c.dueDate + "T12:00:00");
    if (!due || due.getFullYear() !== year) continue;
    buckets[due.getMonth()].value += c.amountDue;
  }
  return buckets.map((b) => ({ ym: b.ym, value: Math.round(b.value * 100) / 100 }));
}

function daysInCalendarMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Encaissements par jour pour un mois calendaire (du 1er au dernier jour). */
export function dailyPaidInCalendarMonth(
  clients: Client[],
  year: number,
  month: number,
): { value: number; day: Date; labelKey: number }[] {
  const count = daysInCalendarMonth(year, month);
  const buckets: { value: number; day: Date; labelKey: number }[] = [];
  for (let d = 1; d <= count; d++) {
    const day = new Date(year, month, d);
    buckets.push({ day, labelKey: d, value: 0 });
  }
  for (const c of clients) {
    for (const { at, amount } of eachRecognizedPayment(c)) {
      if (at.getFullYear() !== year || at.getMonth() !== month) continue;
      const idx = at.getDate() - 1;
      if (idx >= 0 && idx < buckets.length) buckets[idx].value += amount;
    }
  }
  return buckets.map((b) => ({ ...b, value: Math.round(b.value * 100) / 100 }));
}

/** Impayés par jour d’échéance pour un mois calendaire. */
export function dailyPendingByDueInCalendarMonth(
  clients: Client[],
  year: number,
  month: number,
): { value: number; day: Date; labelKey: number }[] {
  const count = daysInCalendarMonth(year, month);
  const buckets: { value: number; day: Date; labelKey: number }[] = [];
  for (let d = 1; d <= count; d++) {
    buckets.push({ day: new Date(year, month, d), labelKey: d, value: 0 });
  }
  for (const c of clients) {
    if (c.status !== "unpaid") continue;
    const due = parseISODate(c.dueDate + "T12:00:00");
    if (!due || due.getFullYear() !== year || due.getMonth() !== month) continue;
    const idx = due.getDate() - 1;
    if (idx >= 0 && idx < buckets.length) buckets[idx].value += c.amountDue;
  }
  return buckets.map((b) => ({ ...b, value: Math.round(b.value * 100) / 100 }));
}

export type TreasuryHorizonDays = 30 | 60 | 90;

/** Encaissements prévisionnels par fenêtre d’échéance (impayés uniquement). */
export function treasuryForecastByHorizon(clients: Client[]): { days: TreasuryHorizonDays; value: number }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let b30 = 0;
  let b60 = 0;
  let b90 = 0;

  for (const c of clients) {
    if (c.status !== "unpaid") continue;
    const due = parseISODate(c.dueDate + "T12:00:00");
    if (!due) continue;
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
    if (diffDays <= 30) b30 += c.amountDue;
    else if (diffDays <= 60) b60 += c.amountDue;
    else if (diffDays <= 90) b90 += c.amountDue;
  }

  return [
    { days: 30, value: Math.round(b30 * 100) / 100 },
    { days: 60, value: Math.round(b60 * 100) / 100 },
    { days: 90, value: Math.round(b90 * 100) / 100 },
  ];
}

export function monthLabel(ym: YearMonth, locale: AppLocale): string {
  const d = new Date(ym.y, ym.m, 1);
  return new Intl.DateTimeFormat(intlLocaleFor(locale), { month: "short" }).format(d);
}

/** Plafond d’axe Y lisible (arrondi au-dessus du max réel). */
export function niceChartAxisMax(rawMax: number): number {
  if (rawMax <= 0) return 100;
  const padded = rawMax * 1.08;
  const exp = Math.floor(Math.log10(padded));
  const base = 10 ** exp;
  const f = padded / base;
  if (f <= 1) return base;
  if (f <= 2) return 2 * base;
  if (f <= 5) return 5 * base;
  return 10 * base;
}

/** Valeurs d’axe Y (du haut vers le bas), `count` graduations. */
export function chartYAxisTicks(rawMax: number, count = 4): number[] {
  const ceiling = niceChartAxisMax(rawMax);
  if (count < 2) return [ceiling, 0];
  return Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1);
    const v = ceiling * (1 - t);
    return Math.round(v * 100) / 100;
  });
}

/** Encaissements par jour sur les `days` derniers jours (le plus ancien en premier). */
export function dailyPaidInflows(clients: Client[], days = 30): { value: number; day: Date }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));

  const buckets: { day: Date; value: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    buckets.push({ day: new Date(d.getFullYear(), d.getMonth(), d.getDate()), value: 0 });
  }

  for (const c of clients) {
    for (const { at, amount } of eachRecognizedPayment(c)) {
      const key = new Date(at.getFullYear(), at.getMonth(), at.getDate()).getTime();
      const idx = buckets.findIndex((b) => b.day.getTime() === key);
      if (idx >= 0) buckets[idx].value += amount;
    }
  }

  return buckets.map((b) => ({ day: b.day, value: Math.round(b.value * 100) / 100 }));
}

/** Encaissements par heure sur les `hours` dernières heures (heure pleine, le plus ancien en premier). */
export function hourlyPaidInflows(clients: Client[], hours = 24): { value: number; hourStart: Date }[] {
  const end = new Date();
  end.setMinutes(0, 0, 0);
  const start = new Date(end);
  start.setHours(start.getHours() - (hours - 1));

  const buckets: { hourStart: Date; value: number }[] = [];
  for (let i = 0; i < hours; i++) {
    const h = new Date(start);
    h.setHours(start.getHours() + i);
    buckets.push({ hourStart: h, value: 0 });
  }

  for (const c of clients) {
    for (const { at, amount } of eachRecognizedPayment(c)) {
      const key = new Date(at);
      key.setMinutes(0, 0, 0);
      const idx = buckets.findIndex((b) => b.hourStart.getTime() === key.getTime());
      if (idx >= 0) buckets[idx].value += amount;
    }
  }

  return buckets.map((b) => ({ hourStart: b.hourStart, value: Math.round(b.value * 100) / 100 }));
}

export function dayLabel(d: Date, locale: AppLocale): string {
  return new Intl.DateTimeFormat(intlLocaleFor(locale), { day: "numeric", month: "short" }).format(d);
}

export function hourLabel(d: Date, locale: AppLocale): string {
  return new Intl.DateTimeFormat(intlLocaleFor(locale), { hour: "2-digit", minute: "2-digit" }).format(d);
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

export function formatPctChange(pct: number | null, locale: AppLocale): string {
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
