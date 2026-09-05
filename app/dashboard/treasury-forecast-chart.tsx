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
  const xTicks = useMemo(() => chartYAxisTicks(maxVal, 3), [maxVal]);

  const money = useMoney();
  const formatCompact = (amountEur: number) => money.format(amountEur, { compact: true });

  const chartW = 280;
  const barH = 22;
  const gap = 14;
  const chartH = buckets.length * barH + (buckets.length - 1) * gap + 8;
  const labelW = 44;
  const plotW = chartW - labelW - 8;

  return (
    <div>
      <h3 className={`text-sm font-semibold ${light ? "text-slate-900" : "text-white"}`}>{copy.treasuryTitle}</h3>
      <div className="mt-4 flex gap-2">
        <div className="min-w-0 flex-1">
          <svg viewBox={`0 0 ${chartW} ${chartH + 28}`} className="h-auto w-full max-w-full" aria-hidden>
            {buckets.map((b, i) => {
              const y = i * (barH + gap) + 4;
              const w = axisMax > 0 ? (b.value / axisMax) * plotW : 0;
              return (
                <g key={b.days}>
                  <text
                    x={0}
                    y={y + barH / 2 + 4}
                    className={light ? "fill-slate-600" : "fill-slate-300"}
                    fontSize="11"
                    fontWeight="600"
                  >
                    {horizonLabel(b.days, copy)}
                  </text>
                  <rect
                    x={labelW}
                    y={y}
                    width={plotW}
                    height={barH}
                    rx={6}
                    className={light ? "fill-slate-100" : "fill-white/[0.04]"}
                  />
                  <rect
                    x={labelW}
                    y={y}
                    width={Math.max(w, b.value > 0 ? 6 : 0)}
                    height={barH}
                    rx={6}
                    fill={light ? "#315BCB" : "#60a5fa"}
                  />
                </g>
              );
            })}
            {xTicks.map((tick) => {
              const x = labelW + (tick / axisMax) * plotW;
              return (
                <g key={tick}>
                  <line
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={chartH}
                    stroke={light ? "#e2e8f0" : "rgba(148,163,184,0.15)"}
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={chartH + 20}
                    textAnchor="middle"
                    className={light ? "fill-slate-500" : "fill-slate-500"}
                    fontSize="9"
                  >
                    {formatCompact(tick)}
                  </text>
                </g>
              );
            })}
            <text x={labelW} y={chartH + 20} className={light ? "fill-slate-500" : "fill-slate-500"} fontSize="9">
              {formatCompact(0)}
            </text>
          </svg>
        </div>
      </div>
      <p className={`mt-2 text-[11px] ${light ? "text-slate-500" : "text-slate-500"}`}>{copy.treasuryHint}</p>
    </div>
  );
}
