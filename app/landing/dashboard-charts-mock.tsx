"use client";

import { useId } from "react";

export type ChartsMockCopy = {
  windowTitle: string;
  pending: string;
  pendingVal: string;
  received: string;
  receivedVal: string;
  receivedHint: string;
  overdue: string;
  overdueVal: string;
  evolution: string;
  evolutionHint: string;
  distribution: string;
  paid: string;
  pendingL: string;
  overdueL: string;
  totalLabel: string;
  monthLabels: readonly [string, string, string, string, string, string];
};

/** Tokens de couleurs pour le mock, mode sombre vs clair (cohérent avec l’app). */
const DASHBOARD_MOCK_TOKENS = {
  dark: {
    card: "border-white/10 bg-[#08080c]/95 shadow-2xl shadow-black/40",
    headerBar: "border-white/[0.08] bg-[#0c0c12]",
    titleMute: "text-slate-500",
    inner: "border-white/[0.08] bg-[#14141c]",
    label: "text-slate-500",
    value: "text-white",
    hint: "text-emerald-400/90",
    axisStroke: "#475569",
    donutCenter: "bg-[#14141c]",
    donutLabel: "text-slate-500",
    donutValue: "text-white",
    legendText: "text-slate-300",
    legendDim: "text-slate-500",
    chartFill: { from: "#8b5cf6", fromOpacity: "0.38" },
  },
  light: {
    card: "border-slate-200 bg-white shadow-[0_28px_60px_-32px_rgba(15,23,42,0.18)]",
    headerBar: "border-slate-200 bg-slate-50",
    titleMute: "text-slate-500",
    inner: "border-slate-200 bg-white",
    label: "text-slate-500",
    value: "text-slate-900",
    hint: "text-emerald-600",
    axisStroke: "#cbd5e1",
    donutCenter: "bg-white",
    donutLabel: "text-slate-500",
    donutValue: "text-slate-900",
    legendText: "text-slate-600",
    legendDim: "text-slate-400",
    chartFill: { from: "#7c3aed", fromOpacity: "0.18" },
  },
} as const;

export type DashboardMockTheme = keyof typeof DASHBOARD_MOCK_TOKENS;

/** Aperçu marketing des cartes + graphiques (même composition que le dashboard réel). */
export function DashboardChartsMock({
  charts,
  className,
  theme = "dark",
}: {
  charts: ChartsMockCopy;
  className?: string;
  theme?: DashboardMockTheme;
}) {
  const uid = useId().replace(/:/g, "");
  const fillId = `pp-land-chart-${uid}-${theme}`;
  const tk = DASHBOARD_MOCK_TOKENS[theme];
  const pad = 20;
  const h = 108;
  const w = 360;
  const values = [42, 55, 48, 72, 68, 88];
  const max = Math.max(...values);
  const min = Math.min(...values) * 0.85;
  const span = max - min || 1;
  const n = values.length;
  const pts = values
    .map((v, i) => {
      const x = pad + (n <= 1 ? 0 : (i * (w - pad * 2)) / (n - 1));
      const y = h - ((v - min) / span) * (h - 18);
      return `${x},${y}`;
    })
    .join(" ");
  const area = `0,${h} ${pts} ${w},${h}`;
  const paidPct = 58;
  const pendPct = 27;
  const overPct = 15;

  return (
    <div
      className={`mx-auto w-full max-w-xl overflow-hidden rounded-2xl border backdrop-blur-sm lg:mx-0 lg:max-w-none ${tk.card} ${className ?? ""}`}
    >
      <div className={`flex items-center gap-2 border-b px-3 py-2.5 ${tk.headerBar}`}>
        <span className="h-2 w-2 rounded-full bg-red-400/90" aria-hidden />
        <span className="h-2 w-2 rounded-full bg-amber-400/90" aria-hidden />
        <span className="h-2 w-2 rounded-full bg-emerald-400/90" aria-hidden />
        <span className={`ml-1 truncate text-[11px] font-medium ${tk.titleMute}`}>{charts.windowTitle}</span>
      </div>
      <div className="space-y-3 p-3 sm:p-4">
        <div className="grid min-w-0 grid-cols-3 gap-2 sm:gap-3">
          <div className={`min-w-0 rounded-xl border p-2.5 sm:p-3 ${tk.inner}`}>
            <p className={`truncate text-[9px] font-medium uppercase tracking-wide sm:text-[10px] ${tk.label}`}>{charts.pending}</p>
            <p className={`mt-1.5 truncate text-base font-semibold tabular-nums sm:text-lg ${tk.value}`}>{charts.pendingVal}</p>
          </div>
          <div className={`min-w-0 rounded-xl border p-2.5 sm:p-3 ${tk.inner}`}>
            <p className={`truncate text-[9px] font-medium uppercase tracking-wide sm:text-[10px] ${tk.label}`}>{charts.received}</p>
            <p className={`mt-1.5 truncate text-base font-semibold tabular-nums sm:text-lg ${tk.value}`}>{charts.receivedVal}</p>
            <p className={`mt-0.5 truncate text-[9px] font-medium ${tk.hint}`}>{charts.receivedHint}</p>
          </div>
          <div className={`min-w-0 rounded-xl border p-2.5 sm:p-3 ${tk.inner}`}>
            <p className={`truncate text-[9px] font-medium uppercase tracking-wide sm:text-[10px] ${tk.label}`}>{charts.overdue}</p>
            <p className={`mt-1.5 truncate text-2xl font-semibold tabular-nums sm:text-3xl ${tk.value}`}>{charts.overdueVal}</p>
          </div>
        </div>

        <div className={`rounded-xl border p-3 sm:p-4 ${tk.inner}`}>
          <h3 className={`text-xs font-semibold sm:text-sm ${tk.value}`}>{charts.evolution}</h3>
          <p className={`mt-0.5 text-[10px] leading-snug ${tk.label}`}>{charts.evolutionHint}</p>
          <div className="mt-3 h-28 sm:h-32">
            <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full" preserveAspectRatio="none" aria-hidden>
              <defs>
                <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={tk.chartFill.from} stopOpacity={tk.chartFill.fromOpacity} />
                  <stop offset="100%" stopColor={tk.chartFill.from} stopOpacity="0" />
                </linearGradient>
              </defs>
              <polyline fill="none" stroke={tk.axisStroke} strokeWidth="1" strokeDasharray="4 6" points={`0,${h - 8} ${w},${h - 8}`} />
              <polygon fill={`url(#${fillId})`} points={area} />
              <polyline
                fill="none"
                stroke="#a78bfa"
                strokeWidth="2.25"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={pts}
              />
              {values.map((v, i) => {
                const x = pad + (n <= 1 ? 0 : (i * (w - pad * 2)) / (n - 1));
                const y = h - ((v - min) / span) * (h - 18);
                return <circle key={i} cx={x} cy={y} r="3.5" fill="#c4b5fd" stroke="#7c3aed" strokeWidth="1.25" />;
              })}
            </svg>
            <div className={`mt-1 flex justify-between gap-1 px-0.5 text-[9px] font-medium uppercase tracking-wider sm:text-[10px] ${tk.label}`}>
              {charts.monthLabels.map((m, mi) => (
                <span key={`${mi}-${m}`} className="min-w-0 truncate text-center">
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className={`rounded-xl border p-3 sm:p-4 ${tk.inner}`}>
          <h3 className={`text-xs font-semibold sm:text-sm ${tk.value}`}>{charts.distribution}</h3>
          <div className="mt-3 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-6">
            <div className="relative mx-auto grid h-28 w-28 shrink-0 place-items-center sm:h-32 sm:w-32">
              <div
                className="col-start-1 row-start-1 h-full w-full rounded-full p-[9px]"
                style={{
                  background: `conic-gradient(from -90deg, #8b5cf6 0 ${paidPct}%, #3b82f6 ${paidPct}% ${paidPct + pendPct}%, #fb923c ${paidPct + pendPct}% 100%)`,
                }}
              >
                <div className={`flex h-full w-full items-center justify-center rounded-full ${tk.donutCenter}`}>
                  <div className="text-center">
                    <span className={`block text-[9px] uppercase tracking-wide ${tk.donutLabel}`}>{charts.totalLabel}</span>
                    <span className={`text-xs font-bold tabular-nums sm:text-sm ${tk.donutValue}`}>100%</span>
                  </div>
                </div>
              </div>
            </div>
            <ul className={`min-w-0 flex-1 space-y-2 text-left text-[11px] sm:text-xs ${tk.legendText}`}>
              <li className="flex min-w-0 items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full bg-violet-500" aria-hidden />
                <span className="truncate">
                  {charts.paid} <span className={tk.legendDim}>({paidPct}%)</span>
                </span>
              </li>
              <li className="flex min-w-0 items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" aria-hidden />
                <span className="truncate">
                  {charts.pendingL} <span className={tk.legendDim}>({pendPct}%)</span>
                </span>
              </li>
              <li className="flex min-w-0 items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full bg-orange-400" aria-hidden />
                <span className="truncate">
                  {charts.overdueL} <span className={tk.legendDim}>({overPct}%)</span>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
