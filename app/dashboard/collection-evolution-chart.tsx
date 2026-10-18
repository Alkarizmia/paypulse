"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
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

/** Premier point au rebord gauche, dernier au rebord droit (pas de bande centrée). */
function xIndexToSvgX(i: number, n: number, chartW: number, padX: number): number {
  const inner = chartW - padX * 2;
  if (n <= 0) return chartW / 2;
  if (n === 1) return padX + inner / 2;
  return padX + (i / (n - 1)) * inner;
}

function xIndexToPercent(i: number, n: number): number {
  if (n <= 0) return 50;
  if (n === 1) return 50;
  return (i / (n - 1)) * 100;
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
  const [periodOpen, setPeriodOpen] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const periodRef = useRef<HTMLDivElement>(null);

  const money = useMoney();
  const formatAxis = (amountEur: number) => money.format(amountEur, { compact: true });
  const formatTooltip = (amountEur: number) =>
    money.format(amountEur, { compact: true, maxFractionDigits: 1 });

  const points = useMemo(() => buildChartPoints(clients, period, locale), [clients, period, locale]);
  const paidSeries = useMemo(() => points.map((p) => p.paid), [points]);
  const pendingSeries = useMemo(() => points.map((p) => p.pending), [points]);
  const xDisplay = useMemo(
    () => sparseXLabels(points, period === "this_month" || period === "last_month" ? 7 : 6),
    [points, period],
  );

  const yMax = useMemo(
    () => niceChartAxisMax(Math.max(...paidSeries, ...pendingSeries, 0)),
    [paidSeries, pendingSeries],
  );
  const yTicks = useMemo(
    () => chartYAxisTicks(Math.max(...paidSeries, ...pendingSeries, 0), 3),
    [paidSeries, pendingSeries],
  );

  const chartH = 156;
  const chartW = 400;
  const padT = 14;
  const padB = 16;
  // Marge minimale pour que les boules ne soient pas coupées par overflow
  const padX = 3;
  const plotBottom = chartH - padB;
  const n = points.length;
  const chartGridSoft = light ? "rgba(15,23,42,0.06)" : "rgba(148,163,184,0.1)";
  const axisText = "text-[var(--pp-dash-muted)]";
  const colorPaid = "#10b981";
  const colorPending = "#f59e0b";
  const colorInk = light ? "#0b0d12" : "#f4f6f8";
  const colorSurface = light ? "rgba(255,255,255,0.92)" : "rgba(14,16,22,0.92)";

  const valueToY = (v: number) => {
    const ratio = yMax > 0 ? Math.max(0, Math.min(1, v / yMax)) : 0;
    return padT + (1 - ratio) * (plotBottom - padT);
  };

  const paidPts = paidSeries.map((v, i) => ({ x: xIndexToSvgX(i, n, chartW, padX), y: valueToY(v) }));
  const pendingPts = pendingSeries.map((v, i) => {
    const x = xIndexToSvgX(i, n, chartW, padX);
    let y = valueToY(v);
    // Si les deux séries tombent au même Y (souvent 0), décale légèrement pour garder les deux boules intactes
    if (Math.abs(y - valueToY(paidSeries[i] ?? 0)) < 0.6) {
      y -= 3.2;
    }
    return { x, y };
  });
  const poly = (pts: { x: number; y: number }[]) => pts.map((p) => `${p.x},${p.y}`).join(" ");
  const area = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return "";
    const first = pts[0];
    const last = pts[pts.length - 1];
    return `${first.x},${plotBottom} ${poly(pts)} ${last.x},${plotBottom}`;
  };
  const gridYs = yTicks.map((tick) => valueToY(tick));

  const activeIndex = hoverIndex ?? null;
  const guideX = activeIndex !== null ? xIndexToSvgX(activeIndex, n, chartW, padX) : null;
  const activePoint = activeIndex !== null ? points[activeIndex] : null;

  useEffect(() => {
    if (!periodOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (!periodRef.current?.contains(e.target as Node)) setPeriodOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPeriodOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [periodOpen]);

  return (
    <div className="pp-cash-chart">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="min-w-0 flex-1 text-[11px] leading-snug text-[var(--pp-dash-muted)]">{copy.evolutionHint}</p>
        <div className="relative shrink-0" ref={periodRef}>
          <button
            type="button"
            className="pp-dash-btn-ghost inline-flex items-center gap-1.5 py-1.5 pl-2.5 pr-2 text-xs font-semibold text-[var(--pp-dash-ink)] outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35"
            aria-label={copy.periodSelectLabel}
            aria-haspopup="listbox"
            aria-expanded={periodOpen}
            onClick={() => setPeriodOpen((v) => !v)}
          >
            {periodLabel(period, copy)}
            <svg
              className={`h-3.5 w-3.5 text-[var(--pp-dash-muted)] transition-transform duration-300 ${periodOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {periodOpen ? (
            <div
              className="pp-cash-chart__period-menu absolute right-0 top-[calc(100%+0.4rem)] z-20 min-w-[11.5rem] overflow-hidden rounded-xl border border-[var(--pp-dash-line)] py-1 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.55)]"
              role="listbox"
              aria-label={copy.periodSelectLabel}
            >
              {PERIOD_ORDER.map((p) => {
                const selected = p === period;
                return (
                  <button
                    key={p}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`flex w-full items-center px-3 py-2 text-left text-xs font-medium transition-colors ${
                      selected
                        ? light
                          ? "bg-emerald-500/12 text-emerald-700"
                          : "bg-emerald-500/15 text-emerald-300"
                        : light
                          ? "text-[var(--pp-dash-ink)] hover:bg-[rgba(15,23,42,0.04)]"
                          : "text-[var(--pp-dash-ink)] hover:bg-[rgba(255,255,255,0.06)]"
                    }`}
                    onClick={() => {
                      setPeriod(p);
                      setHoverIndex(null);
                      setPeriodOpen(false);
                    }}
                  >
                    {periodLabel(p, copy)}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
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

        <div className="pp-cash-chart__stage relative min-w-0 flex-1 overflow-hidden rounded-2xl border border-[var(--pp-dash-line)] px-1.5 pt-1.5 pb-1">
          <div className="pp-cash-chart__glow pp-cash-chart__glow--paid" aria-hidden />
          <div className="pp-cash-chart__glow pp-cash-chart__glow--pending" aria-hidden />
          <div className="relative h-40 overflow-visible sm:h-52">
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="h-full w-full overflow-visible"
              preserveAspectRatio="none"
              aria-hidden
            >
              <defs>
                <linearGradient id={fillPaid} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colorPaid} stopOpacity={light ? "0.28" : "0.24"} />
                  <stop offset="70%" stopColor={colorPaid} stopOpacity={light ? "0.06" : "0.05"} />
                  <stop offset="100%" stopColor={colorPaid} stopOpacity="0" />
                </linearGradient>
                <linearGradient id={fillPending} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colorPending} stopOpacity={light ? "0.18" : "0.14"} />
                  <stop offset="100%" stopColor={colorPending} stopOpacity="0" />
                </linearGradient>
                <filter id={`${fillPaid}-soft`} x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="1.2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <clipPath id={`${fillPaid}-plot`}>
                  <rect x={0} y={0} width={chartW} height={plotBottom + 2} />
                </clipPath>
              </defs>
              <g clipPath={`url(#${fillPaid}-plot)`}>
                {gridYs.map((gy, i) => (
                  <line key={yTicks[i]} x1={padX} y1={gy} x2={chartW - padX} y2={gy} stroke={chartGridSoft} strokeWidth="0.6" />
                ))}
                {guideX !== null ? (
                  <line
                    x1={guideX}
                    y1={padT}
                    x2={guideX}
                    y2={plotBottom}
                    stroke={colorInk}
                    strokeOpacity="0.16"
                    strokeWidth="1.1"
                  />
                ) : null}
                {/* Surfaces empilées en douceur : ambre puis vert, sans coupure nette */}
                <polygon fill={`url(#${fillPending})`} points={area(pendingPts)} opacity="0.85" />
                <polygon fill={`url(#${fillPaid})`} points={area(paidPts)} opacity="0.9" style={{ mixBlendMode: light ? "multiply" : "screen" }} />
                <polyline
                  fill="none"
                  stroke={colorPending}
                  strokeWidth="1.75"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeDasharray="4 5"
                  strokeOpacity="0.92"
                  points={poly(pendingPts)}
                />
                <polyline
                  fill="none"
                  stroke={colorPaid}
                  strokeWidth="2.55"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  filter={`url(#${fillPaid}-soft)`}
                  points={poly(paidPts)}
                />
              </g>
              {/* Boules hors clip pour rester intactes en bas */}
              {pendingPts.map((p, i) => (
                <circle
                  key={`p-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={activeIndex === i ? 3.6 : 2.7}
                  fill={colorSurface}
                  stroke={colorPending}
                  strokeWidth="1.5"
                />
              ))}
              {paidPts.map((p, i) => (
                <circle
                  key={`c-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={activeIndex === i ? 4 : 2.9}
                  fill={colorPaid}
                  stroke={light ? "#ffffff" : "#0b0d12"}
                  strokeWidth="1.45"
                />
              ))}
            </svg>
          </div>

          {n > 0 ? (
            <div
              className="absolute inset-0 cursor-crosshair"
              onMouseLeave={() => setHoverIndex(null)}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = rect.width > 0 ? (e.clientX - rect.left) / rect.width : 0;
                const idx = n <= 1 ? 0 : Math.round(ratio * (n - 1));
                setHoverIndex(Math.max(0, Math.min(n - 1, idx)));
              }}
            >
              {points.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className="sr-only"
                  aria-label={`${points[i].label}: ${copy.evolutionPaid} ${formatTooltip(points[i].paid)}, ${copy.evolutionPending} ${formatTooltip(points[i].pending)}`}
                  onFocus={() => setHoverIndex(i)}
                  onBlur={() => setHoverIndex(null)}
                />
              ))}
            </div>
          ) : null}

          {activePoint && activeIndex !== null && guideX !== null ? (
            <div
              className="pp-cash-chart__tooltip pointer-events-none absolute top-2 z-10 min-w-[10rem] rounded-xl border border-[var(--pp-dash-line)] px-3 py-2 text-xs text-[var(--pp-dash-ink)] shadow-[0_12px_28px_-18px_rgba(15,23,42,0.45)]"
              style={{
                left: `${xIndexToPercent(activeIndex, n)}%`,
                transform: activeIndex >= n / 2 ? "translateX(-100%)" : "translateX(0)",
              }}
            >
              <p className="mb-1.5 font-semibold tracking-tight">{activePoint.label}</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-flex h-2 w-2 rounded-full" style={{ background: colorPaid }} aria-hidden />
                    {copy.evolutionPaid}
                  </span>
                  <span className="tabular-nums font-semibold text-emerald-600">{formatTooltip(activePoint.paid)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-flex h-2 w-2 rounded-full" style={{ background: colorPending }} aria-hidden />
                    {copy.evolutionPending}
                  </span>
                  <span className="tabular-nums font-semibold text-amber-600">{formatTooltip(activePoint.pending)}</span>
                </div>
              </div>
            </div>
          ) : null}

          <div
            className={`relative z-[1] mt-1.5 h-4 text-[9px] font-medium uppercase tracking-[0.06em] sm:text-[10px] ${axisText}`}
          >
            {xDisplay.map((item, i) => {
              if (!item.show) return null;
              const atStart = i === 0;
              const atEnd = i === n - 1 && n > 1;
              return (
                <span
                  key={`${item.text}-${i}`}
                  className="absolute top-0 whitespace-nowrap"
                  style={{
                    left: `${xIndexToPercent(i, n)}%`,
                    transform: atStart ? "none" : atEnd ? "translateX(-100%)" : "translateX(-50%)",
                    textAlign: atStart ? "left" : atEnd ? "right" : "center",
                  }}
                >
                  {item.text}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-[var(--pp-dash-muted)]">
        <span className="pp-dash-glass inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-[var(--pp-dash-ink)]">
          <span className="h-2 w-2 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.55)]" style={{ background: colorPaid }} aria-hidden />
          {copy.evolutionPaid}
        </span>
        <span className="pp-dash-glass inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-[var(--pp-dash-ink)]">
          <span className="h-2 w-2 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.45)]" style={{ background: colorPending }} aria-hidden />
          {copy.evolutionPending}
        </span>
      </div>
    </div>
  );
}
