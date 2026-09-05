"use client";

import { DashboardAnalytics } from "@/app/dashboard/dashboard-analytics";
import { LandingPreviewShell } from "@/app/landing/landing-preview-shell";
import type { AppLocale } from "@/lib/app-locale";
import { LANDING_DEMO_CLIENTS } from "@/lib/landing-demo-clients";
import { pickQuad } from "@/lib/messages/pick";
import type { UiResolvedAppearance } from "@/lib/ui-theme";

/** Aperçu hero : mêmes composants que le dashboard (KPI, évolution, répartition). */
export function LandingDashboardPreview({
  locale,
  appearance,
  onToggleAppearance,
  frameClassName,
}: {
  locale: AppLocale;
  appearance: UiResolvedAppearance;
  onToggleAppearance: () => void;
  frameClassName?: string;
}) {
  const title = pickQuad(locale, {
    fr: "Tableau de bord",
    en: "Dashboard",
    nl: "Dashboard",
    es: "Panel",
  });

  return (
    <LandingPreviewShell
      locale={locale}
      appearance={appearance}
      onToggleAppearance={onToggleAppearance}
      windowTitle={`PayPulss · ${title}`}
      frameClassName={frameClassName}
    >
      <div className="p-3 sm:p-4">
        <DashboardAnalytics
          clients={LANDING_DEMO_CLIENTS}
          locale={locale}
          fullCharts
          advancedStats={false}
          appearance={appearance}
          skipSummaryCards={false}
          showTreasuryInGrid={false}
          treasuryInSidebar={false}
        />
      </div>
    </LandingPreviewShell>
  );
}
