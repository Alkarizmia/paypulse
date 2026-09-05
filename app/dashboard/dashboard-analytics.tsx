"use client";

import { useMemo, type CSSProperties } from "react";
import type { Client } from "./types";
import {
  averagePaymentDelayDays,
  eachRecognizedPayment,
  formatPctChange,
  rolling30dPaidComparison,
} from "@/lib/dashboard-metrics";
import type { UiResolvedAppearance } from "@/lib/ui-theme";
import type { AppLocale } from "@/lib/app-locale";
import { useMoney } from "@/app/display-currency-context";
import { getDashboardAnalyticsCopy } from "@/lib/messages/dashboard-analytics-copy";
import { CollectionEvolutionChart } from "./collection-evolution-chart";
import { TreasuryForecastChart } from "./treasury-forecast-chart";

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
  locale: AppLocale;
  fullCharts: boolean;
  advancedStats: boolean;
  appearance: UiResolvedAppearance;
  /** Masque la rangée 3 KPI si déjà affichée sur l’accueil. */
  skipSummaryCards?: boolean;
  /** Affiche la carte trésorerie dans la grille (masquée en xl si treasuryInSidebar). */
  showTreasuryInGrid?: boolean;
  /** true sur l’accueil desktop : trésorerie déplacée dans la colonne latérale. */
  treasuryInSidebar?: boolean;
  onAddClient?: () => void;
};

export function DashboardAnalytics({
  clients,
  locale,
  fullCharts,
  advancedStats,
  appearance,
  skipSummaryCards = false,
  showTreasuryInGrid = true,
  treasuryInSidebar = false,
  onAddClient,
}: DashboardAnalyticsProps) {
  const light = appearance === "light";
  const t = getDashboardAnalyticsCopy(locale);
  const money = useMoney();
  const emptyAccount = clients.length === 0;

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

  const distributionSegments = useMemo(() => {
    let paidAmount = 0;
    let pendingAmountSeg = 0;
    let overdueAmount = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let overdueCountSeg = 0;
    for (const c of clients) {
      if (c.status === "paid") {
        paidAmount += c.amountDue;
        paidCount += 1;
      } else if (isOverdue(c.dueDate)) {
        overdueAmount += c.amountDue;
        overdueCountSeg += 1;
      } else {
        pendingAmountSeg += c.amountDue;
        pendingCount += 1;
      }
    }
    return {
      paidAmount,
      pendingAmount: pendingAmountSeg,
      overdueAmount,
      paidCount,
      pendingCount,
      overdueCount: overdueCountSeg,
    };
  }, [clients]);

  function invoiceCountLabel(n: number): string {
    const word = n === 1 ? t.invoiceCount : t.invoiceCountPlural;
    return `${n} ${word}`;
  }

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
      {skipSummaryCards ? null : (
      <div className="grid min-w-0 gap-3 sm:gap-4 sm:grid-cols-3">
        <div
          className={`pp-rise pp-dashboard-card-interactive rounded-2xl border p-4 sm:p-5 ${
            light
              ? "border-slate-200 bg-white shadow-sm hover:border-violet-300/60"
              : "border-white/[0.08] bg-bg-dark shadow-none hover:border-violet-500/35"
          }`}
          style={{ "--pp-rise-delay": "0.04s" } as CSSProperties}
        >
          <div className="flex items-start justify-between gap-2">
            <p className={`text-xs font-medium uppercase tracking-wide ${light ? "text-slate-600" : "text-slate-400"}`}>{t.pending}</p>
            <span className={`rounded-lg p-1.5 sm:p-2 ${light ? "bg-violet-100 text-violet-600" : "bg-violet-500/15 text-violet-300"}`}>
              <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <p className={`mt-2.5 text-xl font-semibold tabular-nums tracking-tight sm:text-2xl ${light ? "text-slate-900" : "text-white"}`}>
            {money.format(pendingAmount)}
          </p>
          <p className={`mt-1 text-xs font-medium ${light ? "text-slate-500" : "text-slate-400"}`}>{t.instant}</p>
        </div>
        <div
          className={`pp-rise pp-dashboard-card-interactive rounded-2xl border p-4 sm:p-5 ${
            light
              ? "border-slate-200 bg-white hover:border-emerald-300/60"
              : "border-white/[0.08] bg-bg-dark hover:border-emerald-500/35"
          }`}
          style={{ "--pp-rise-delay": "0.1s" } as CSSProperties}
        >
          <div className="flex items-start justify-between gap-2">
            <p className={`text-xs font-medium uppercase tracking-wide ${light ? "text-slate-600" : "text-slate-400"}`}>{t.received}</p>
            <span className={`rounded-lg p-1.5 sm:p-2 ${light ? "bg-emerald-100 text-emerald-600" : "bg-emerald-500/15 text-emerald-300"}`}>
              <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          </div>
          <p className={`mt-2.5 text-xl font-semibold tabular-nums tracking-tight sm:text-2xl ${light ? "text-slate-900" : "text-white"}`}>
            {money.format(receivedThisMonth)}
          </p>
          <p
            className={`mt-1 text-xs font-medium ${
              receivedMonthPct !== null && receivedMonthPct >= 0
                ? light
                  ? "text-emerald-600"
                  : "text-emerald-400"
                : light
                  ? "text-rose-600"
                  : "text-rose-400"
            }`}
          >
            {trendReceivedLine}
          </p>
          <p className={`mt-1 text-[10px] ${light ? "text-slate-500" : "text-slate-500"}`}>{trendRollingLine}</p>
        </div>
        <div
          className={`pp-rise pp-dashboard-card-interactive rounded-2xl border p-4 sm:p-5 ${
            light
              ? "border-slate-200 bg-white hover:border-orange-300/60"
              : "border-white/[0.08] bg-bg-dark hover:border-orange-500/35"
          }`}
          style={{ "--pp-rise-delay": "0.16s" } as CSSProperties}
        >
          <div className="flex items-start justify-between gap-2">
            <p className={`text-xs font-medium uppercase tracking-wide ${light ? "text-slate-600" : "text-slate-400"}`}>{t.overdue}</p>
            <span className={`rounded-lg p-1.5 sm:p-2 ${light ? "bg-orange-100 text-orange-600" : "bg-orange-500/15 text-orange-300"}`}>
              <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
          </div>
          <p className={`mt-2.5 text-xl font-semibold tabular-nums tracking-tight sm:text-2xl ${light ? "text-slate-900" : "text-white"}`}>{overdueCount}</p>
          <p className={`mt-1 text-xs font-medium ${light ? "text-slate-500" : "text-slate-400"}`}>{t.instant}</p>
        </div>
      </div>
      )}

      {advancedStats ? (
        <div className="grid min-w-0 gap-3 sm:gap-4 sm:grid-cols-2">
          <div
            className={`pp-dashboard-card-interactive rounded-2xl border border-l-[3px] border-l-warning px-4 py-3.5 sm:px-5 sm:py-4 ${
              light ? "border-border bg-bg hover:border-border" : "border-white/[0.08] bg-bg-dark"
            }`}
          >
            <p className={`text-xs font-semibold uppercase tracking-wide ${light ? "text-slate-600" : "text-slate-400"}`}>{t.avgDelay}</p>
            <p className={`mt-2 text-xl font-bold sm:text-2xl ${light ? "text-slate-900" : "text-white"}`}>
              {emptyAccount || avgDelay === null ? (
                emptyAccount && onAddClient ? (
                  <button
                    type="button"
                    onClick={onAddClient}
                    className="text-left text-sm font-medium text-accent underline-offset-2 hover:underline"
                  >
                    {t.emptyCta}
                  </button>
                ) : (
                  <span className={`text-base font-medium ${light ? "text-slate-600" : "text-slate-400"}`}>{t.noHistory}</span>
                )
              ) : (
                <>
                  {avgDelay}{" "}
                  <span className={`text-base font-medium ${light ? "text-slate-600" : "text-slate-400"}`}>{t.days}</span>
                </>
              )}
            </p>
          </div>
          <div
            className={`pp-dashboard-card-interactive rounded-2xl border border-l-[3px] border-l-success px-4 py-3.5 sm:px-5 sm:py-4 ${
              light ? "border-border bg-bg hover:border-border" : "border-white/[0.08] bg-bg-dark"
            }`}
          >
            <p className={`text-xs font-semibold uppercase tracking-wide ${light ? "text-slate-600" : "text-slate-400"}`}>{t.recovery}</p>
            {emptyAccount && onAddClient ? (
              <button
                type="button"
                onClick={onAddClient}
                className="mt-2 text-left text-sm font-medium text-accent underline-offset-2 hover:underline"
              >
                {t.emptyCta}
              </button>
            ) : (
              <p className={`mt-2 text-xl font-bold sm:text-2xl ${light ? "text-slate-900" : "text-white"}`}>{paidPct}%</p>
            )}
          </div>
        </div>
      ) : null}

      {fullCharts ? (
        <div className="min-w-0 space-y-4 sm:space-y-6">
          <div
            className={`min-w-0 overflow-hidden rounded-2xl border ${
              light ? "border-border bg-bg-alt" : "border-white/[0.08] bg-bg-dark"
            }`}
          >
            <div className={`flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-6 ${light ? "border-border bg-bg" : "border-white/[0.08]"}`}>
              <h3 className={`text-sm font-semibold tracking-tight ${light ? "text-slate-900" : "text-white"}`}>{t.evolution}</h3>
              <span className={`hidden h-1.5 w-1.5 rounded-full bg-accent sm:inline-block ${light ? "shadow-[0_0_10px_var(--color-accent)]" : ""}`} aria-hidden />
            </div>
            <div className="p-4 sm:p-6">
              <CollectionEvolutionChart clients={clients} locale={locale} light={light} copy={t} />
            </div>
          </div>

          <div
            className={`grid min-w-0 gap-4 sm:gap-6 ${
              treasuryInSidebar ? "grid-cols-1" : showTreasuryInGrid ? "lg:grid-cols-2" : "grid-cols-1"
            }`}
          >
            <div
              className={`pp-dashboard-card-interactive min-w-0 rounded-2xl border p-5 sm:p-6 ${
                light
                  ? "border-slate-200 bg-white hover:border-violet-300/60"
                  : "border-white/[0.08] bg-bg-dark hover:border-violet-500/35"
              }`}
            >
              <h3 className={`text-sm font-semibold ${light ? "text-slate-900" : "text-white"}`}>{t.distribution}</h3>
              <div className="mt-6 grid min-w-0 grid-cols-1 items-end gap-6 sm:gap-8 md:grid-cols-[minmax(11rem,auto)_minmax(0,1fr)_minmax(10.5rem,13.5rem)] md:gap-6 lg:gap-8">
                <div className="relative mx-auto w-[11.5rem] shrink-0 sm:mx-0">
                  <svg viewBox="0 0 200 112" className="h-auto w-full" aria-hidden>
                    <path
                      d="M 22 100 A 78 78 0 0 1 178 100"
                      fill="none"
                      stroke="var(--color-border)"
                      strokeWidth="16"
                      strokeLinecap="butt"
                    />
                    {emptyAccount ? null : (
                      <>
                        <path
                          d="M 22 100 A 78 78 0 0 1 178 100"
                          fill="none"
                          stroke="var(--color-accent)"
                          strokeWidth="16"
                          pathLength={100}
                          strokeDasharray={`${paidPct} ${100 - paidPct}`}
                          strokeDashoffset={0}
                        />
                        <path
                          d="M 22 100 A 78 78 0 0 1 178 100"
                          fill="none"
                          stroke="var(--color-primary)"
                          strokeWidth="16"
                          pathLength={100}
                          strokeDasharray={`${pendPct} ${100 - pendPct}`}
                          strokeDashoffset={-paidPct}
                        />
                        <path
                          d="M 22 100 A 78 78 0 0 1 178 100"
                          fill="none"
                          stroke="var(--color-warning)"
                          strokeWidth="16"
                          pathLength={100}
                          strokeDasharray={`${overPct} ${100 - overPct}`}
                          strokeDashoffset={-(paidPct + pendPct)}
                        />
                      </>
                    )}
                  </svg>
                  <div className="pointer-events-none absolute inset-x-0 bottom-1 text-center">
                    <span className={`block text-[10px] uppercase tracking-wide ${light ? "text-slate-500" : "text-slate-400"}`}>
                      {t.chartTotal}
                    </span>
                    <span className={`mt-0.5 block text-sm font-bold tabular-nums sm:text-base ${light ? "text-slate-900" : "text-white"}`}>
                      {money.format(
                        distributionSegments.paidAmount +
                          distributionSegments.pendingAmount +
                          distributionSegments.overdueAmount,
                      )}
                    </span>
                  </div>
                </div>
                <ul className={`flex min-w-0 flex-col gap-4 text-sm ${light ? "text-slate-700" : "text-slate-200"}`}>
                  <li className="flex min-w-0 items-center justify-between gap-4">
                    <span className="inline-flex min-w-0 items-center gap-2.5 whitespace-nowrap">
                      <span className="h-1.5 w-4 shrink-0 rounded-sm bg-accent" aria-hidden />
                      {t.paid}
                    </span>
                    <span className={`shrink-0 tabular-nums font-medium ${light ? "text-slate-500" : "text-slate-400"}`}>
                      {emptyAccount ? 0 : paidPct}%
                    </span>
                  </li>
                  <li className="flex min-w-0 items-center justify-between gap-4">
                    <span className="inline-flex min-w-0 items-center gap-2.5 whitespace-nowrap">
                      <span className="h-1.5 w-4 shrink-0 rounded-sm bg-primary" aria-hidden />
                      {t.pendingL}
                    </span>
                    <span className={`shrink-0 tabular-nums font-medium ${light ? "text-slate-500" : "text-slate-400"}`}>
                      {emptyAccount ? 0 : pendPct}%
                    </span>
                  </li>
                  <li className="flex min-w-0 items-center justify-between gap-4">
                    <span className="inline-flex min-w-0 items-center gap-2.5 whitespace-nowrap">
                      <span className="h-1.5 w-4 shrink-0 rounded-sm bg-warning" aria-hidden />
                      {t.overdueL}
                    </span>
                    <span className={`shrink-0 tabular-nums font-medium ${light ? "text-slate-500" : "text-slate-400"}`}>
                      {emptyAccount ? 0 : overPct}%
                    </span>
                  </li>
                </ul>
                <div
                  className={`flex min-w-0 flex-col gap-3 border-t pt-5 md:border-t-0 md:border-l md:pl-6 md:pt-0 ${
                    light ? "border-slate-200" : "border-white/[0.08]"
                  }`}
                >
                  <p className={`text-xs font-semibold uppercase tracking-wide ${light ? "text-slate-500" : "text-slate-400"}`}>
                    {t.distributionAmounts}
                  </p>
                  <div className="space-y-3">
                    <div>
                      <p className={`text-xs font-medium ${light ? "text-slate-600" : "text-slate-300"}`}>{t.paid}</p>
                      <p className={`mt-0.5 text-base font-bold tabular-nums ${light ? "text-slate-900" : "text-white"}`}>
                        {money.format(distributionSegments.paidAmount)}
                      </p>
                      <p className={`mt-0.5 text-[11px] ${light ? "text-slate-500" : "text-slate-500"}`}>
                        {invoiceCountLabel(distributionSegments.paidCount)}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs font-medium ${light ? "text-slate-600" : "text-slate-300"}`}>{t.pendingL}</p>
                      <p className={`mt-0.5 text-base font-bold tabular-nums ${light ? "text-slate-900" : "text-white"}`}>
                        {money.format(distributionSegments.pendingAmount)}
                      </p>
                      <p className={`mt-0.5 text-[11px] ${light ? "text-slate-500" : "text-slate-500"}`}>
                        {invoiceCountLabel(distributionSegments.pendingCount)}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs font-medium ${light ? "text-slate-600" : "text-slate-300"}`}>{t.overdueL}</p>
                      <p className={`mt-0.5 text-base font-bold tabular-nums ${light ? "text-slate-900" : "text-white"}`}>
                        {money.format(distributionSegments.overdueAmount)}
                      </p>
                      <p className={`mt-0.5 text-[11px] ${light ? "text-slate-500" : "text-slate-500"}`}>
                        {invoiceCountLabel(distributionSegments.overdueCount)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {showTreasuryInGrid ? (
              <div
                className={`pp-dashboard-card-interactive min-w-0 rounded-2xl border p-5 sm:p-6 ${
                  treasuryInSidebar ? "xl:hidden" : ""
                } ${
                  light
                    ? "border-slate-200 bg-white hover:border-sky-300/60"
                    : "border-white/[0.08] bg-bg-dark hover:border-sky-500/35"
                }`}
              >
                <TreasuryForecastChart clients={clients} locale={locale} light={light} copy={t} />
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div
          className={`pp-dashboard-card-interactive rounded-2xl border p-6 text-center ${
            light ? "border-slate-200 bg-white hover:border-slate-300" : "border-white/[0.08] bg-bg-dark hover:border-white/15"
          }`}
        >
          <p className={`text-sm ${light ? "text-slate-600" : "text-slate-300"}`}>{t.upgradeStarterTeaser}</p>
        </div>
      )}
    </div>
  );
}
