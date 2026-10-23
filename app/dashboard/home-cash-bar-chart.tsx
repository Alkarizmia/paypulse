"use client";

import { useEffect, useMemo, useState } from "react";
import type { Client } from "./types";
import {
  chartYAxisTicks,
  monthLabel,
  monthlyPaidInflows,
  monthlyPendingByDueMonth,
  niceChartAxisMax,
  type YearMonth,
} from "@/lib/dashboard-metrics";
import type { AppLocale } from "@/lib/app-locale";
import { useMoney } from "@/app/display-currency-context";
import type { DashboardHomeCopy } from "@/lib/messages/dashboard-home-copy";

export type HomeCashPeriod = "3m" | "6m" | "12m";

type BarPoint = {
  paid: number;
  pending: number;
  label: string;
  ym: YearMonth;
  isCurrent: boolean;
};

type HomeCashBarChartProps = {
  clients: Client[];
  locale: AppLocale;
  copy: DashboardHomeCopy;
};

const PERIODS: HomeCashPeriod[] = ["3m", "6m", "12m"];

function monthsForPeriod(period: HomeCashPeriod): number {
  switch (period) {
    case "3m":
      return 3;
    case "6m":
      return 6;
    case "12m":
      return 12;
  }
}

function rangeLabel(period: HomeCashPeriod, copy: DashboardHomeCopy): string {
  switch (period) {
    case "3m":
      return copy.homeCashRange3m;
    case "6m":
      return copy.homeCashRange6m;
    case "12m":
      return copy.homeCashRange1y;
  }
}

function segLabel(period: HomeCashPeriod, copy: DashboardHomeCopy): string {
  switch (period) {
    case "3m":
      return copy.homeCashSeg3m;
    case "6m":
      return copy.homeCashSeg6m;
    case "12m":
      return copy.homeCashSeg1y;
  }
}

/** Rounded-top rectangle path (rx on top corners only). */
function barPath(x: number, y: number, w: number, h: number, r: number): string {
  if (h <= 0 || w <= 0) return "";
  const rr = Math.min(r, w / 2, h);
  if (rr <= 0) {
    return `M${x},${y + h} V${y} H${x + w} V${y + h} Z`;
  }
  return [
    `M${x},${y + h}`,
    `V${y + rr}`,
    `Q${x},${y} ${x + rr},${y}`,
    `H${x + w - rr}`,
    `Q${x + w},${y} ${x + w},${y + rr}`,
    `V${y + h}`,
    "Z",
  ].join(" ");
}

function buildPoints(clients: Client[], period: HomeCashPeriod, locale: AppLocale): BarPoint[] {
  const months = monthsForPeriod(period);
  const paid = monthlyPaidInflows(clients, months);
  const pending = monthlyPendingByDueMonth(clients, months);
  const now = new Date();
  const cy = now.getFullYear();
  const cm = now.getMonth();

  return paid.map((p, i) => ({
    paid: p.value,
    pending: pending[i]?.value ?? 0,
    label: monthLabel(p.ym, locale),
    ym: p.ym,
    isCurrent: p.ym.y === cy && p.ym.m === cm,
  }));
}

export function HomeCashBarChart({ clients, locale, copy }: HomeCashBarChartProps) {
  const [period, setPeriod] = useState<HomeCashPeriod>("6m");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [animateIn, setAnimateIn] = useState(false);

  const money = useMoney();
  const formatAxis = (amount: number) => money.format(amount, { compact: true });
  const formatTip = (amount: number) => money.format(amount, { compact: true, maxFractionDigits: 1 });
  const formatTotal = (amount: number) => money.format(amount);

  const points = useMemo(() => buildPoints(clients, period, locale), [clients, period, locale]);

  const activeMonths = useMemo(
    () => points.filter((p) => p.paid > 0 || p.pending > 0).length,
    [points],
  );
  const lowData = activeMonths < 2;

  const paidTotal = useMemo(() => points.reduce((s, p) => s + p.paid, 0), [points]);

  const yMax = useMemo(
    () => niceChartAxisMax(Math.max(...points.map((p) => Math.max(p.paid, p.pending)), 0)),
    [points],
  );
  const yTicks = useMemo(
    () => chartYAxisTicks(Math.max(...points.map((p) => Math.max(p.paid, p.pending)), 0), 3),
    [points],
  );

  useEffect(() => {
    setAnimateIn(false);
    setHoverIndex(null);
    const id = requestAnimationFrame(() => setAnimateIn(true));
    return () => cancelAnimationFrame(id);
  }, [period, clients]);

  const chartW = 480;
  const chartH = 200;
  const padT = 12;
  const padB = 28;
  const padX = 18;
  const plotBottom = chartH - padB;
  const plotH = plotBottom - padT;
  const n = points.length;
  const groupW = n > 0 ? (chartW - padX * 2) / n : 0;
  const barGap = 3;
  const barW = Math.max(4, Math.min(18, (groupW - barGap * 3) / 2));

  const colorPaid = "#10b981";
  const colorPending = "rgba(245, 158, 11, 0.55)";
  const colorPendingSolid = "#f59e0b";
  const gridStroke = "#f1f5f9"; // slate-100

  const valueToY = (v: number) => {
    const ratio = yMax > 0 ? Math.max(0, Math.min(1, v / yMax)) : 0;
    return padT + (1 - ratio) * plotH;
  };

  const active = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="pp-home-cash">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight text-[var(--pp-dash-ink)]">
            {copy.homeCashTitle(rangeLabel(period, copy))}
          </h3>
          {!lowData ? (
            <p className="mt-0.5 text-lg font-semibold tabular-nums tracking-tight text-[var(--pp-dash-ink)] sm:text-xl">
              {formatTotal(paidTotal)}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            className="pp-home-cash__seg inline-flex rounded-lg border border-[var(--pp-dash-line)] p-0.5"
            role="group"
            aria-label={copy.homeCashPeriodAria}
          >
            {PERIODS.map((p) => {
              const selected = p === period;
              return (
                <button
                  key={p}
                  type="button"
                  aria-pressed={selected}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold tabular-nums transition-colors ${
                    selected
                      ? "bg-[var(--pp-dash-ink)] text-[var(--pp-dash-card)]"
                      : "text-[var(--pp-dash-muted)] hover:text-[var(--pp-dash-ink)]"
                  }`}
                  onClick={() => setPeriod(p)}
                >
                  {segLabel(p, copy)}
                </button>
              );
            })}
          </div>

          <div className="hidden items-center gap-3 text-[11px] font-medium text-[var(--pp-dash-muted)] sm:flex">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm" style={{ background: colorPaid }} aria-hidden />
              {copy.homeCashCollected}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm" style={{ background: colorPendingSolid, opacity: 0.55 }} aria-hidden />
              {copy.homeCashStillOwed}
            </span>
          </div>
        </div>
      </div>

      {lowData ? (
        <div className="pp-home-cash__plot relative mt-4">
          <div className="pp-home-cash__skeleton flex h-[180px] items-end justify-around gap-2 px-4 pb-8 sm:h-[240px]" aria-hidden>
            {Array.from({ length: monthsForPeriod(period) }).map((_, i) => (
              <div key={i} className="flex flex-1 items-end justify-center gap-1">
                <div
                  className="w-full max-w-[14px] rounded-t-md bg-slate-100"
                  style={{ height: `${28 + ((i * 17) % 40)}%` }}
                />
                <div
                  className="w-full max-w-[14px] rounded-t-md bg-slate-50"
                  style={{ height: `${18 + ((i * 23) % 32)}%` }}
                />
              </div>
            ))}
          </div>
          <p className="pointer-events-none absolute inset-x-4 top-1/2 -translate-y-1/2 text-center text-sm leading-snug text-[var(--pp-dash-muted)]">
            {copy.homeCashEmptyHistory}
          </p>
        </div>
      ) : (
        <div className="pp-home-cash__plot relative mt-4">
          <div className="flex gap-2 sm:gap-3">
            <div
              className="flex h-[180px] shrink-0 flex-col justify-between py-1 text-[9px] font-medium tabular-nums text-[var(--pp-dash-muted)] sm:h-[240px] sm:text-[10px]"
              aria-hidden
            >
              {yTicks.map((tick) => (
                <span key={tick} className="leading-none">
                  {formatAxis(tick)}
                </span>
              ))}
            </div>

            <div className="relative min-w-0 flex-1">
              <div className="h-[180px] sm:h-[240px]">
                <svg
                  viewBox={`0 0 ${chartW} ${chartH}`}
                  className="h-full w-full overflow-visible"
                  preserveAspectRatio="none"
                  role="img"
                  aria-label={copy.homeCashTitle(rangeLabel(period, copy))}
                >
                  {yTicks.map((tick) => {
                    const gy = valueToY(tick);
                    return (
                      <line
                        key={tick}
                        x1={padX}
                        y1={gy}
                        x2={chartW - padX}
                        y2={gy}
                        stroke={gridStroke}
                        strokeWidth="1"
                      />
                    );
                  })}

                  {points.map((pt, i) => {
                    const cx = padX + groupW * i + groupW / 2;
                    const paidH = Math.max(0, plotBottom - valueToY(pt.paid));
                    const pendH = Math.max(0, plotBottom - valueToY(pt.pending));
                    const paidX = cx - barW - barGap / 2;
                    const pendX = cx + barGap / 2;
                    const paidY = plotBottom - paidH;
                    const pendY = plotBottom - pendH;
                    const delay = `${i * 40}ms`;
                    const growStyle = {
                      transform: animateIn ? "scaleY(1)" : "scaleY(0)",
                      transformOrigin: `${cx}px ${plotBottom}px`,
                      transition: `transform 400ms ease-out ${delay}`,
                    } as const;

                    return (
                      <g key={`${pt.ym.y}-${pt.ym.m}`} className="pp-home-cash__bar" style={growStyle}>
                        <path d={barPath(paidX, paidY, barW, paidH, 6)} fill={colorPaid} />
                        <path d={barPath(pendX, pendY, barW, pendH, 6)} fill={colorPending} />
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div
                className="absolute inset-0 cursor-crosshair"
                onMouseLeave={() => setHoverIndex(null)}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = rect.width > 0 ? (e.clientX - rect.left) / rect.width : 0;
                  const idx = n <= 1 ? 0 : Math.min(n - 1, Math.max(0, Math.floor(ratio * n)));
                  setHoverIndex(idx);
                }}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  if (!touch) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = rect.width > 0 ? (touch.clientX - rect.left) / rect.width : 0;
                  const idx = n <= 1 ? 0 : Math.min(n - 1, Math.max(0, Math.floor(ratio * n)));
                  setHoverIndex(idx);
                }}
              >
                {points.map((pt, i) => (
                  <button
                    key={`${pt.ym.y}-${pt.ym.m}-a`}
                    type="button"
                    className="sr-only"
                    aria-label={`${pt.label}: ${copy.homeCashCollected} ${formatTip(pt.paid)}, ${copy.homeCashStillOwed} ${formatTip(pt.pending)}`}
                    onFocus={() => setHoverIndex(i)}
                    onBlur={() => setHoverIndex(null)}
                  />
                ))}
              </div>

              {active && hoverIndex !== null ? (
                <div
                  className="pp-home-cash__tooltip pointer-events-none absolute top-2 z-10 min-w-[9.5rem] rounded-xl border border-[var(--pp-dash-line)] bg-[var(--pp-dash-card)] px-3 py-2 text-xs text-[var(--pp-dash-ink)] shadow-[0_8px_24px_-16px_rgba(15,23,42,0.35)]"
                  style={{
                    left: `${((hoverIndex + 0.5) / n) * 100}%`,
                    transform: hoverIndex >= n / 2 ? "translateX(-100%)" : "translateX(0)",
                  }}
                >
                  <p className="mb-1.5 font-semibold tracking-tight">{active.label}</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 text-[var(--pp-dash-muted)]">
                        <span className="h-1.5 w-1.5 rounded-sm" style={{ background: colorPaid }} aria-hidden />
                        {copy.homeCashCollected}
                      </span>
                      <span className="tabular-nums font-semibold text-emerald-600">{formatTip(active.paid)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 text-[var(--pp-dash-muted)]">
                        <span
                          className="h-1.5 w-1.5 rounded-sm"
                          style={{ background: colorPendingSolid, opacity: 0.7 }}
                          aria-hidden
                        />
                        {copy.homeCashStillOwed}
                      </span>
                      <span className="tabular-nums font-semibold text-amber-600">{formatTip(active.pending)}</span>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mt-1 flex justify-around px-[2%] text-[10px] font-medium text-[var(--pp-dash-muted)] sm:text-[11px]">
                {points.map((pt) => (
                  <span
                    key={`${pt.ym.y}-${pt.ym.m}-l`}
                    className={`min-w-0 flex-1 truncate text-center ${
                      pt.isCurrent ? "font-bold text-[var(--pp-dash-ink)]" : ""
                    }`}
                  >
                    {pt.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-[11px] font-medium text-[var(--pp-dash-muted)] sm:hidden">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm" style={{ background: colorPaid }} aria-hidden />
              {copy.homeCashCollected}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm" style={{ background: colorPendingSolid, opacity: 0.55 }} aria-hidden />
              {copy.homeCashStillOwed}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
