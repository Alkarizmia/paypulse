"use client";

import { useId, useMemo, useState } from "react";
import type { Client } from "./types";
import {
  chartYAxisTicks,
  dailyPaidInCalendarMonth,
  dailyPendingByDueInCalendarMonth,
  dayLabel,
  monthLabel,
  monthlyPaidInflows,
  monthlyPaidInflowsForYear,
  monthlyPendingByDueMonth,
  monthlyPendingByDueForYear,
  niceChartAxisMax,
  type YearMonth,
} from "@/lib/dashboard-metrics";
import type { AppLocale } from "@/lib/app-locale";
import { intlLocaleFor } from "@/lib/app-locale";
import { useMoney } from "@/app/display-currency-context";
import type { DashboardAnalyticsCopy } from "@/lib/messages/dashboard-analytics-copy";

export type EvolutionChartPeriod =
  | "this_month"
  | "last_month"
  | "90d"
  | "3m"
  | "6m"
  | "12m"
  | "this_year"
  | "last_year";

const PERIOD_ORDER: EvolutionChartPeriod[] = [
  "this_month",
  "last_month",
  "90d",
  "3m",
  "6m",
  "12m",
  "this_year",
  "last_year",
];

type ChartPoint = { paid: number; pending: number; label: string };

type CollectionEvolutionChartProps = {
  clients: Client[];
  locale: AppLocale;
  light: boolean;
  copy: DashboardAnalyticsCopy;
};

function periodLabel(p: EvolutionChartPeriod, copy: DashboardAnalyticsCopy): string {
  switch (p) {
    case "this_month":
      return copy.periodThisMonth;
    case "last_month":
      return copy.periodLastMonth;
    case "90d":
      return copy.period90d;
    case "3m":
      return copy.period3m;
    case "6m":
      return copy.period6m;
    case "12m":
      return copy.period12m;
    case "this_year":
      return copy.periodThisYear;
    case "last_year":
      return copy.periodLastYear;
  }
}

function buildChartPoints(clients: Client[], period: EvolutionChartPeriod, locale: AppLocale): ChartPoint[] {
  const now = new Date();

  const fromMonthly = (
    paid: { value: number; ym: YearMonth }[],
    pending: { value: number; ym: YearMonth }[],
  ): ChartPoint[] =>
    paid.map((p, i) => ({
      paid: p.value,
      pending: pending[i]?.value ?? 0,
      label: monthLabel(p.ym, locale),
    }));

  switch (period) {
    case "this_month": {
      const y = now.getFullYear();
      const m = now.getMonth();
      const paid = dailyPaidInCalendarMonth(clients, y, m);
      const pending = dailyPendingByDueInCalendarMonth(clients, y, m);
      return paid.map((p, i) => ({
        paid: p.value,
        pending: pending[i]?.value ?? 0,
        label: dayLabel(p.day, locale),
      }));
    }
    case "last_month": {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const paid = dailyPaidInCalendarMonth(clients, d.getFullYear(), d.getMonth());
      const pending = dailyPendingByDueInCalendarMonth(clients, d.getFullYear(), d.getMonth());
      return paid.map((p, i) => ({
        paid: p.value,
        pending: pending[i]?.value ?? 0,
        label: dayLabel(p.day, locale),
      }));
    }
    case "90d":
    case "3m": {
      const months = 3;
      return fromMonthly(monthlyPaidInflows(clients, months), monthlyPendingByDueMonth(clients, months));
    }
    case "6m": {
      return fromMonthly(monthlyPaidInflows(clients, 6), monthlyPendingByDueMonth(clients, 6));
    }
    case "12m": {
      return fromMonthly(monthlyPaidInflows(clients, 12), monthlyPendingByDueMonth(clients, 12));
    }
    case "this_year": {
      const months = now.getMonth() + 1;
      return fromMonthly(monthlyPaidInflows(clients, months), monthlyPendingByDueMonth(clients, months));
    }
    case "last_year": {
      const y = now.getFullYear() - 1;
      return fromMonthly(monthlyPaidInflowsForYear(clients, y), monthlyPendingByDueForYear(clients, y));
    }
  }
}

function xIndexToSvgX(i: number, n: number, chartW: number): number {
  if (n <= 0) return chartW / 2;
  return ((i + 0.5) / n) * chartW;
}

function sparseXLabels(points: ChartPoint[], maxVisible: number): { text: string; show: boolean }[] {
  const n = points.length;
  if (n <= maxVisible) return points.map((p) => ({ text: p.label, show: true }));
  const step = Math.max(1, Math.floor((n - 1) / (maxVisible - 1)));
  return points.map((p, i) => ({
    text: p.label,
    show: i === 0 || i === n - 1 || i % step === 0,
  }));
}

export function CollectionEvolutionChart({ clients, locale, light, copy }: CollectionEvolutionChartProps) {
  const gradPaid = useId().replace(/:/g, "");
  const gradPending = useId().replace(/:/g, "");
  const fillPaid = `pp-paid-${gradPaid}`;
  const fillPending = `pp-pend-${gradPending}`;

  const [period, setPeriod] = useState<EvolutionChartPeriod>("6m");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const money = useMoney();
  const formatAxis = (amountEur: number) => money.format(amountEur, { compact: true });
  const formatTooltip = (amountEur: number) =>
    money.format(amountEur, { compact: true, maxFractionDigits: 1 });

  const points = useMemo(() => buildChartPoints(clients, period, locale), [clients, period, locale]);
  const paidSeries = useMemo(() => points.map((p) => p.paid), [points]);
  const pendingSeries = useMemo(() => points.map((p) => p.pending), [points]);
  const xDisplay = useMemo(() => sparseXLabels(points, period === "this_month" || period === "last_month" ? 7 : 6), [points, period]);

  const yMax = useMemo(
    () => niceChartAxisMax(Math.max(...paidSeries, ...pendingSeries, 0)),
    [paidSeries, pendingSeries],
  );
  const yTicks = useMemo(
    () => chartYAxisTicks(Math.max(...paidSeries, ...pendingSeries, 0), 3),
    [paidSeries, pendingSeries],
  );

  const chartH = 140;
  const chartW = 400;
  const n = points.length;
  const chartGridSoft = light ? "var(--color-border)" : "rgba(148,163,184,0.12)";
  const axisText = light ? "text-slate-500" : "text-slate-400";

  const valueToY = (v: number) => {
    const ratio = yMax > 0 ? Math.max(0, Math.min(1, v / yMax)) : 0;
    return chartH - ratio * (chartH - 20);
  };

  const paidPts = paidSeries.map((v, i) => ({ x: xIndexToSvgX(i, n, chartW), y: valueToY(v) }));
  const pendingPts = pendingSeries.map((v, i) => ({ x: xIndexToSvgX(i, n, chartW), y: valueToY(v) }));
  const poly = (pts: { x: number; y: number }[]) => pts.map((p) => `${p.x},${p.y}`).join(" ");
  const area = (pts: { x: number; y: number }[]) => `0,${chartH} ${poly(pts)} ${chartW},${chartH}`;
  const gridYs = yTicks.map((tick) => valueToY(tick));

  const activeIndex = hoverIndex ?? null;
  const guideX = activeIndex !== null ? xIndexToSvgX(activeIndex, n, chartW) : null;
  const activePoint = activeIndex !== null ? points[activeIndex] : null;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className={`min-w-0 flex-1 text-[11px] leading-snug ${light ? "text-slate-500" : "text-slate-400"}`}>
          {copy.evolutionHint}
        </p>
        <label className={`flex shrink-0 flex-col gap-0.5 ${light ? "text-slate-600" : "text-slate-300"}`}>
          <span className="sr-only">{copy.periodSelectLabel}</span>
          <select
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value as EvolutionChartPeriod);
              setHoverIndex(null);
            }}
            className={`cursor-pointer rounded-lg border py-1.5 pl-2.5 pr-8 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
              light ? "border-border bg-bg text-slate-800" : "border-white/10 bg-bg-dark text-slate-100"
            }`}
            aria-label={copy.periodSelectLabel}
          >
            {PERIOD_ORDER.map((p) => (
              <option key={p} value={p}>
                {periodLabel(p, copy)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex gap-2 sm:gap-3">
        <div
          className={`flex h-40 shrink-0 flex-col justify-between py-1 text-[9px] font-medium tabular-nums sm:h-52 sm:text-[10px] ${axisText}`}
          aria-hidden
        >
          {yTicks.map((tick) => (
            <span key={tick} className="leading-none">
              {formatAxis(tick)}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1 overflow-hidden rounded-xl border border-border/80 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-accent)_6%,transparent)_0%,transparent_42%)] px-1 pt-1">
          <div className="h-40 sm:h-52">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="h-full w-full" preserveAspectRatio="none" aria-hidden>
              <defs>
                <linearGradient id={fillPaid} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={light ? "0.38" : "0.32"} />
                  <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
                </linearGradient>
                <linearGradient id={fillPending} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={light ? "0.12" : "0.18"} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                </linearGradient>
                <filter id={`${fillPaid}-glow`} x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {gridYs.map((gy, i) => (
                <line
                  key={yTicks[i]}
                  x1={0}
                  y1={gy}
                  x2={chartW}
                  y2={gy}
                  stroke={chartGridSoft}
                  strokeWidth="0.5"
                />
              ))}
              {paidPts.map((p, i) => (
                <line
                  key={`vx-${i}`}
                  x1={p.x}
                  y1={0}
                  x2={p.x}
                  y2={chartH}
                  stroke={chartGridSoft}
                  strokeWidth="0.4"
                  strokeDasharray="2 6"
                />
              ))}
              {guideX !== null ? (
                <line
                  x1={guideX}
                  y1={0}
                  x2={guideX}
                  y2={chartH}
                  stroke="var(--color-accent)"
                  strokeOpacity="0.35"
                  strokeWidth="1.25"
                />
              ) : null}
              <polygon fill={`url(#${fillPending})`} points={area(pendingPts)} />
              <polygon fill={`url(#${fillPaid})`} points={area(paidPts)} />
              <polyline
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="1.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray="5 4"
                points={poly(pendingPts)}
              />
              <polyline
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                filter={`url(#${fillPaid}-glow)`}
                points={poly(paidPts)}
              />
              {pendingPts.map((p, i) => (
                <rect
                  key={`p-${i}`}
                  x={p.x - (activeIndex === i ? 2.5 : 1.75)}
                  y={p.y - (activeIndex === i ? 2.5 : 1.75)}
                  width={activeIndex === i ? 5 : 3.5}
                  height={activeIndex === i ? 5 : 3.5}
                  fill={light ? "#fff" : "var(--color-bg-dark)"}
                  stroke="var(--color-primary)"
                  strokeWidth="1.25"
                />
              ))}
              {paidPts.map((p, i) => (
                <rect
                  key={`c-${i}`}
                  x={p.x - (activeIndex === i ? 3 : 2)}
                  y={p.y - (activeIndex === i ? 3 : 2)}
                  width={activeIndex === i ? 6 : 4}
                  height={activeIndex === i ? 6 : 4}
                  rx="0.6"
                  fill="var(--color-accent)"
                  stroke={light ? "#fff" : "var(--color-bg-dark)"}
                  strokeWidth="1.25"
                />
              ))}
            </svg>
          </div>

          {n > 0 ? (
            <div
              className="absolute inset-0 grid"
              style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
              onMouseLeave={() => setHoverIndex(null)}
            >
              {points.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className="h-full w-full cursor-crosshair border-0 bg-transparent p-0"
                  aria-label={`${points[i].label}: ${copy.evolutionPaid} ${formatTooltip(points[i].paid)}, ${copy.evolutionPending} ${formatTooltip(points[i].pending)}`}
                  onMouseEnter={() => setHoverIndex(i)}
                  onFocus={() => setHoverIndex(i)}
                  onBlur={() => setHoverIndex(null)}
                />
              ))}
            </div>
          ) : null}

          {activePoint && activeIndex !== null && guideX !== null ? (
            <div
              className={`pointer-events-none absolute top-2 z-10 min-w-[9.5rem] rounded-lg border px-3 py-2 text-xs shadow-lg ${
                light ? "border-slate-200 bg-white text-slate-800" : "border-white/10 bg-bg-dark text-slate-100"
              }`}
              style={{
                left: `${((activeIndex + 0.5) / n) * 100}%`,
                transform: activeIndex >= n / 2 ? "translateX(-100%)" : "translateX(0)",
              }}
            >
              <p className={`mb-1.5 font-semibold ${light ? "text-slate-900" : "text-white"}`}>{activePoint.label}</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-flex h-1.5 w-4 rounded-sm bg-accent" aria-hidden />
                    {copy.evolutionPaid}
                  </span>
                  <span className="tabular-nums font-medium">{formatTooltip(activePoint.paid)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-flex h-1.5 w-4 rounded-sm bg-primary" aria-hidden />
                    {copy.evolutionPending}
                  </span>
                  <span className="tabular-nums font-medium">{formatTooltip(activePoint.pending)}</span>
                </div>
              </div>
            </div>
          ) : null}

          <div
            className={`mt-1.5 grid text-[9px] font-medium uppercase tracking-wide sm:text-[10px] ${axisText}`}
            style={{ gridTemplateColumns: `repeat(${Math.max(n, 1)}, minmax(0, 1fr))` }}
          >
            {xDisplay.map((item, i) => (
              <span key={`${item.text}-${i}`} className={`text-center ${item.show ? "" : "invisible"}`}>
                {item.text}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div
        className={`mt-4 flex flex-wrap items-center justify-center gap-3 text-xs font-medium ${light ? "text-slate-600" : "text-slate-300"}`}
      >
        <span className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 ${light ? "border-border bg-bg" : "border-white/10 bg-white/[0.04]"}`}>
          <span className="h-1.5 w-4 rounded-sm bg-accent" aria-hidden />
          {copy.evolutionPaid}
        </span>
        <span className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 ${light ? "border-border bg-bg" : "border-white/10 bg-white/[0.04]"}`}>
          <span className="h-1.5 w-4 rounded-sm bg-primary" aria-hidden />
          {copy.evolutionPending}
        </span>
      </div>
    </div>
  );
}
