"use client";

import type { CSSProperties } from "react";
import type { Client } from "./types";
import type { UiResolvedAppearance } from "@/lib/ui-theme";
import type { AppLocale } from "@/lib/app-locale";
import { getDashboardHomeCopy } from "@/lib/messages/dashboard-home-copy";
import { HomeCashBarChart } from "./home-cash-bar-chart";

type DashboardHomeCashChartProps = {
  clients: Client[];
  locale: AppLocale;
  appearance: UiResolvedAppearance;
};

/**
 * Juste sous les priorités : encaissements mensuels (barres), pas le line chart Analytics.
 */
export function DashboardHomeCashChart({ clients, locale }: DashboardHomeCashChartProps) {
  const t = getDashboardHomeCopy(locale);

  return (
    <section
      className="pp-dash-panel pp-dash-blur-in space-y-3 p-4 sm:p-5"
      style={{ "--pp-rise-delay": "0.26s" } as CSSProperties}
      aria-label={t.homeCashTitle(t.homeCashRange6m)}
    >
      <HomeCashBarChart clients={clients} locale={locale} copy={t} />
    </section>
  );
}
