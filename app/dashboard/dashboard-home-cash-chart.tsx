"use client";

import type { CSSProperties } from "react";
import type { Client } from "./types";
import type { UiResolvedAppearance } from "@/lib/ui-theme";
import type { AppLocale } from "@/lib/app-locale";
import { getDashboardAnalyticsCopy } from "@/lib/messages/dashboard-analytics-copy";
import { CollectionEvolutionChart } from "./collection-evolution-chart";

type DashboardHomeCashChartProps = {
  clients: Client[];
  locale: AppLocale;
  appearance: UiResolvedAppearance;
};

/**
 * Juste sous les KPI : totaux d’abord, tendance cash ensuite, puis priorités / clients.
 */
export function DashboardHomeCashChart({ clients, locale, appearance }: DashboardHomeCashChartProps) {
  const light = appearance === "light";
  const t = getDashboardAnalyticsCopy(locale);
  const empty = clients.length === 0;

  return (
    <section
      className="pp-dash-panel pp-dash-blur-in space-y-3 p-4 sm:p-5"
      style={{ "--pp-rise-delay": "0.26s" } as CSSProperties}
      aria-label={t.evolution}
    >
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-[var(--pp-dash-ink)]">{t.evolution}</h3>
        {empty ? (
          <p className="mt-1 text-xs leading-snug text-[var(--pp-dash-muted)]">{t.evolutionEmptyHint}</p>
        ) : null}
      </div>
      <CollectionEvolutionChart clients={clients} locale={locale} light={light} copy={t} />
    </section>
  );
}
