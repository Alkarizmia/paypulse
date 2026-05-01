"use client";

import { useId, useMemo, type CSSProperties } from "react";
import type { Client } from "./types";
import {
  averagePaymentDelayDays,
  eachRecognizedPayment,
  formatPctChange,
  monthlyPaidInflows,
  monthLabel,
  rolling30dPaidComparison,
} from "@/lib/dashboard-metrics";

const money = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function isOverdue(dueDate: string): boolean {
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

function calendarMonthPaidTotal(clients: Client[], year: number, month: number): number {
  let sum = 0;
  for (const c of clients) {
    for (const { at, amount } of eachRecognizedPayment(c)) {
      if (at.getFullYear() === year && at.getMonth() === month) {
        sum += amount;
      }
    }
  }
  return sum;
}

type DashboardAnalyticsProps = {
  clients: Client[];
  locale: "fr" | "en";
  fullCharts: boolean;
  advancedStats: boolean;
};

export function DashboardAnalytics({ clients, locale, fullCharts, advancedStats }: DashboardAnalyticsProps) {
  const gradId = useId().replace(/:/g, "");
  const fillId = `pp-line-fill-${gradId}`;

  const t =
    locale === "fr"
      ? {
          pending: "Montant en attente",
          received: "Reçus ce mois",
          overdue: "Factures en retard",
          vsLastMonth: "vs mois dernier",
          vsRolling: "30 j. vs 30 j. préc.",
          instant: "Situation actuelle",
          evolution: "Évolution des encaissements",
          distribution: "Répartition des factures",
          paid: "Payées",
          pendingL: "En attente",
          overdueL: "En retard",
          avgDelay: "Délai moyen de paiement",
          recovery: "Taux de recouvrement",
          days: "jours",
          noHistory: "Pas encore d’historique de paiements datés.",
        }
      : {
          pending: "Amount pending",
          received: "Received this month",
          overdue: "Overdue invoices",
          vsLastMonth: "vs last month",
          vsRolling: "30d vs prior 30d",
          instant: "Current position",
          evolution: "Cash-in evolution",
          distribution: "Invoice breakdown",
          paid: "Paid",
          pendingL: "Pending",
          overdueL: "Overdue",
          avgDelay: "Avg. payment delay",
          recovery: "Recovery rate",
          days: "days",
          noHistory: "No dated payment history yet.",
        };

  const pendingAmount = useMemo(
    () => clients.filter((c) => c.status === "unpaid").reduce((s, c) => s + c.amountDue, 0),
    [clients],
  );

  const receivedThisMonth = useMemo(() => {
    const now = new Date();
    return calendarMonthPaidTotal(clients, now.getFullYear(), now.getMonth());
  }, [clients]);

  const receivedPrevMonth = useMemo(() => {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return calendarMonthPaidTotal(clients, prev.getFullYear(), prev.getMonth());
  }, [clients]);

  const receivedMonthPct = useMemo(() => {
    if (receivedPrevMonth <= 0 && receivedThisMonth <= 0) return null;
    if (receivedPrevMonth <= 0) return receivedThisMonth > 0 ? 100 : 0;
    return Math.round(((receivedThisMonth - receivedPrevMonth) / receivedPrevMonth) * 1000) / 10;
  }, [receivedThisMonth, receivedPrevMonth]);

  const rolling = useMemo(() => rolling30dPaidComparison(clients), [clients]);

  const overdueCount = useMemo(
    () => clients.filter((c) => c.status === "unpaid" && isOverdue(c.dueDate)).length,
    [clients],
  );

  const totalVolume = useMemo(() => {
    const pending = clients.filter((c) => c.status === "unpaid").reduce((s, c) => s + c.amountDue, 0);
    const paid = clients.filter((c) => c.status === "paid").reduce((s, c) => s + c.amountDue, 0);
    return pending + paid || 1;
  }, [clients]);

  const paidShare = useMemo(
    () => clients.filter((c) => c.status === "paid").reduce((s, c) => s + c.amountDue, 0) / totalVolume,
    [clients, totalVolume],
  );
  const pendingShare = useMemo(
    () =>
      clients.filter((c) => c.status === "unpaid" && !isOverdue(c.dueDate)).reduce((s, c) => s + c.amountDue, 0) /
      totalVolume,
    [clients, totalVolume],
  );

  const paidPct = Math.round(paidShare * 100);
  const pendPct = Math.round(pendingShare * 100);
  const overPct = Math.max(0, 100 - paidPct - pendPct);

  const monthly = useMemo(() => monthlyPaidInflows(clients, 6), [clients]);
  const linePoints = monthly.map((m) => m.value);
  const monthLabels = monthly.map((row) => monthLabel(row.ym, locale));

  const avgDelay = useMemo(() => averagePaymentDelayDays(clients), [clients]);

  const trendReceivedLine =
    receivedMonthPct === null
      ? formatPctChange(null, locale)
      : `${receivedMonthPct > 0 ? "+" : ""}${receivedMonthPct}% ${t.vsLastMonth}`;

  const trendRollingLine =
    rolling.pct === null
      ? formatPctChange(null, locale)
      : `${rolling.pct > 0 ? "+" : ""}${rolling.pct}% ${t.vsRolling}`;

  return (
    <div className="min-w-0 space-y-6">
      <div className="grid min-w-0 gap-3 sm:gap-4 sm:grid-cols-3">
        <div
          className="pp-rise pp-dashboard-card-interactive rounded-2xl border border-white/[0.08] bg-[#14141c] p-4 sm:p-5 shadow-[0_0_0_1px_rgba(139,92,246,0.06)] hover:border-violet-500/25"
          style={{ "--pp-rise-delay": "0.04s" } as CSSProperties}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t.pending}</p>
            <span className="rounded-lg bg-violet-500/15 p-1.5 sm:p-2 text-violet-400">
              <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <p className="mt-2.5 text-xl sm:text-2xl font-semibold tabular-nums tracking-tight text-white">{money.format(pendingAmount)}</p>
          <p className="mt-1 text-xs font-medium text-slate-500">{t.instant}</p>
        </div>
        <div
          className="pp-rise pp-dashboard-card-interactive rounded-2xl border border-white/[0.08] bg-[#14141c] p-4 sm:p-5 hover:border-emerald-500/20"
          style={{ "--pp-rise-delay": "0.1s" } as CSSProperties}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t.received}</p>
            <span className="rounded-lg bg-emerald-500/15 p-1.5 sm:p-2 text-emerald-400">
              <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          </div>
          <p className="mt-2.5 text-xl sm:text-2xl font-semibold tabular-nums tracking-tight text-white">{money.format(receivedThisMonth)}</p>
          <p className={`mt-1 text-xs font-medium ${receivedMonthPct !== null && receivedMonthPct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {trendReceivedLine}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">{trendRollingLine}</p>
        </div>
        <div
          className="pp-rise pp-dashboard-card-interactive rounded-2xl border border-white/[0.08] bg-[#14141c] p-4 sm:p-5 hover:border-orange-500/25"
          style={{ "--pp-rise-delay": "0.16s" } as CSSProperties}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t.overdue}</p>
            <span className="rounded-lg bg-orange-500/15 p-1.5 sm:p-2 text-orange-400">
              <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
          </div>
          <p className="mt-2.5 text-xl sm:text-2xl font-semibold tabular-nums tracking-tight text-white">{overdueCount}</p>
          <p className="mt-1 text-xs font-medium text-slate-500">{t.instant}</p>
        </div>
      </div>

      {advancedStats ? (
        <div className="grid min-w-0 gap-3 sm:gap-4 sm:grid-cols-2">
          <div className="pp-dashboard-card-interactive rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] px-4 sm:px-5 py-3.5 sm:py-4 hover:border-violet-400/35">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-300/90">{t.avgDelay}</p>
            <p className="mt-2 text-xl sm:text-2xl font-bold text-white">
              {avgDelay === null ? (
                <span className="text-base font-medium text-slate-400">{t.noHistory}</span>
              ) : (
                <>
                  {avgDelay} <span className="text-base font-medium text-slate-400">{t.days}</span>
                </>
              )}
            </p>
          </div>
          <div className="pp-dashboard-card-interactive rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] px-4 sm:px-5 py-3.5 sm:py-4 hover:border-violet-400/35">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-300/90">{t.recovery}</p>
            <p className="mt-2 text-xl sm:text-2xl font-bold text-white">{paidPct}%</p>
          </div>
        </div>
      ) : null}

      {fullCharts ? (
        <div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-5">
          <div className="pp-dashboard-card-interactive min-w-0 rounded-2xl border border-white/[0.08] bg-[#14141c] p-4 sm:p-5 lg:col-span-3 hover:border-violet-500/20">
            <h3 className="text-sm font-semibold text-white">{t.evolution}</h3>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {locale === "fr"
                ? "Somme des encaissements enregistrés, par mois (historique conservé même si la fiche repasse en impayé)."
                : "Sum of recorded cash-ins by month (history kept when a row goes back to unpaid)."}
            </p>
            <div className="mt-4 sm:mt-6 h-32 sm:h-44">
              <svg viewBox="0 0 400 140" className="h-full w-full" preserveAspectRatio="none" aria-hidden>
                <defs>
                  <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polyline fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="4 6" points="0,120 400,120" />
                {(() => {
                  const max = Math.max(...linePoints, 1);
                  const minRaw = Math.min(...linePoints);
                  const min = minRaw >= max ? 0 : minRaw * 0.9;
                  const span = max - min || 1;
                  const w = 400;
                  const h = 120;
                  const pad = 24;
                  const n = linePoints.length;
                  const pts = linePoints.map((v, i) => {
                    const x = pad + (n <= 1 ? 0 : (i * (w - pad * 2)) / (n - 1));
                    const y = h - ((v - min) / span) * (h - 20);
                    return `${x},${y}`;
                  });
                  const area = `0,${h} ${pts.join(" ")} ${w},${h}`;
                  return (
                    <>
                      <polygon fill={`url(#${fillId})`} points={area} />
                      <polyline
                        fill="none"
                        stroke="#a78bfa"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        points={pts.join(" ")}
                      />
                      {linePoints.map((v, i) => {
                        const x = pad + (n <= 1 ? 0 : (i * (w - pad * 2)) / (n - 1));
                        const y = h - ((v - min) / span) * (h - 20);
                        return <circle key={i} cx={x} cy={y} r="4" fill="#c4b5fd" stroke="#7c3aed" strokeWidth="1.5" />;
                      })}
                    </>
                  );
                })()}
              </svg>
              <div className="mt-1 flex justify-between px-1 text-[8px] sm:text-[10px] font-medium uppercase tracking-wider text-slate-500">
                {monthLabels.map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="pp-dashboard-card-interactive min-w-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#14141c] p-4 sm:p-5 lg:col-span-2 hover:border-violet-500/20">
            <h3 className="text-sm font-semibold text-white">{t.distribution}</h3>
            <div className="mt-4 flex min-w-0 flex-col items-center gap-3 md:flex-row md:justify-center md:gap-8">
              <div className="relative grid h-28 w-28 sm:h-32 sm:w-32 md:h-36 md:w-36 shrink-0 place-items-center">
                <div
                  className="col-start-1 row-start-1 h-full w-full rounded-full p-[10px]"
                  style={{
                    background: `conic-gradient(from -90deg, #8b5cf6 0 ${paidPct}%, #3b82f6 ${paidPct}% ${paidPct + pendPct}%, #fb923c ${paidPct + pendPct}% 100%)`,
                  }}
                >
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-[#14141c]">
                    <div className="text-center">
                      <span className="block text-[10px] uppercase tracking-wide text-slate-500">Total</span>
                      <span className="text-xs sm:text-sm font-bold tabular-nums text-white">{money.format(totalVolume)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <ul className="w-full min-w-0 max-w-[220px] space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-violet-500" />
                  {t.paid} <span className="text-slate-500">({paidPct}%)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  {t.pendingL} <span className="text-slate-500">({pendPct}%)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-orange-400" />
                  {t.overdueL} <span className="text-slate-500">({overPct}%)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="pp-dashboard-card-interactive rounded-2xl border border-white/[0.06] bg-[#12121a] p-6 text-center hover:border-white/12">
          <p className="text-sm text-slate-400">
            {locale === "fr"
              ? "Passez au plan Starter pour le graphique d’évolution complet, la jauge de répartition et les relances automatiques."
              : "Upgrade to Starter for the full evolution chart, breakdown donut, and automatic reminders."}
          </p>
        </div>
      )}
    </div>
  );
}
