"use client";

import { useMemo } from "react";
import type { Client } from "./types";
import { chartYAxisTicks, niceChartAxisMax, treasuryForecastByHorizon } from "@/lib/dashboard-metrics";
import type { AppLocale } from "@/lib/app-locale";
import { useMoney } from "@/app/display-currency-context";
import type { DashboardAnalyticsCopy } from "@/lib/messages/dashboard-analytics-copy";

type TreasuryForecastChartProps = {
  clients: Client[];
  locale: AppLocale;
  light: boolean;
  copy: DashboardAnalyticsCopy;
};

function horizonLabel(days: 30 | 60 | 90, copy: DashboardAnalyticsCopy): string {
  if (days === 30) return copy.treasury30;
  if (days === 60) return copy.treasury60;
  return copy.treasury90;
}

export function TreasuryForecastChart({ clients, locale, light, copy }: TreasuryForecastChartProps) {
  const buckets = useMemo(() => treasuryForecastByHorizon(clients), [clients]);
  const maxVal = useMemo(() => Math.max(...buckets.map((b) => b.value), 0), [buckets]);
  const axisMax = useMemo(() => niceChartAxisMax(maxVal), [maxVal]);
  const xTicks = useMemo(() => {
    const raw = chartYAxisTicks(maxVal, 3);
    const uniq = Array.from(new Set(raw.map((n) => Math.round(n * 100) / 100)));
    return uniq.sort((a, b) => a - b);
  }, [maxVal]);

  const money = useMoney();
  const formatAxis = (amountEur: number) => money.format(amountEur, { compact: true, maxFractionDigits: 0 });

  return (
    <div>
      <div className={`-mx-1 mb-4 flex items-center justify-between gap-3 border-b pb-3 ${light ? "border-border" : "border-white/[0.08]"}`}>
        <h3 className={`text-sm font-semibold tracking-tight ${light ? "text-slate-900" : "text-white"}`}>{copy.treasuryTitle}</h3>
      </div>

      <div className="space-y-3">
        {buckets.map((b) => {
          const pct = axisMax > 0 ? Math.min(100, (b.value / axisMax) * 100) : 0;
          return (
            <div key={b.days} className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-3">
              <span className={`text-right text-[11px] font-semibold tabular-nums ${light ? "text-slate-500" : "text-slate-400"}`}>
                {horizonLabel(b.days, copy)}
              </span>
              <div
                className={`relative h-7 overflow-hidden rounded-md ${light ? "bg-slate-100" : "bg-white/[0.06]"}`}
                role="img"
                aria-label={`${horizonLabel(b.days, copy)} ${formatAxis(b.value)}`}
              >
                {xTicks.slice(1, -1).map((tick) => (
                  <span
                    key={`g-${b.days}-${tick}`}
                    className={`pointer-events-none absolute inset-y-0 w-px ${light ? "bg-border" : "bg-white/10"}`}
                    style={{ left: axisMax > 0 ? `${(tick / axisMax) * 100}%` : 0 }}
                    aria-hidden
                  />
                ))}
                {pct > 0 ? (
                  <div
                    className="absolute inset-y-1 left-0 rounded-[5px] bg-accent"
                    style={{ width: `max(${pct}%, 0.5rem)` }}
                  />
                ) : null}
                {b.value > 0 ? (
                  <span
                    className={`absolute inset-y-0 right-2 flex items-center text-[10px] font-semibold tabular-nums ${
                      pct > 42 ? "text-white" : light ? "text-slate-600" : "text-slate-300"
                    }`}
                  >
                    {formatAxis(b.value)}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 grid grid-cols-[2.75rem_minmax(0,1fr)] gap-3">
        <span aria-hidden />
        <div className="relative h-5">
          {xTicks.map((tick, i) => {
            const left = axisMax > 0 ? (tick / axisMax) * 100 : 0;
            const align = i === 0 ? "left" : i === xTicks.length - 1 ? "right" : "center";
            const transform = align === "left" ? "translateX(0)" : align === "right" ? "translateX(-100%)" : "translateX(-50%)";
            return (
              <span
                key={`x-${tick}`}
                className={`absolute top-0 text-[10px] font-medium tabular-nums ${light ? "text-slate-500" : "text-slate-400"}`}
                style={{ left: `${left}%`, transform }}
              >
                {formatAxis(tick)}
              </span>
            );
          })}
        </div>
      </div>

      <p className={`mt-3 text-[11px] leading-snug ${light ? "text-slate-500" : "text-slate-500"}`}>{copy.treasuryHint}</p>
    </div>
  );
}
