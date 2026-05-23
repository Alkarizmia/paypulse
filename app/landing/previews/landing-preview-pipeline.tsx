"use client";

import { CollectionPipeline } from "@/app/dashboard/collection-pipeline";
import { LandingPreviewShell } from "@/app/landing/landing-preview-shell";
import type { AppLocale } from "@/lib/app-locale";
import { LANDING_DEMO_CLIENTS } from "@/lib/landing-demo-clients";
import { getDashboardHomeCopy } from "@/lib/messages/dashboard-home-copy";
import { pickQuad } from "@/lib/messages/pick";
import type { UiResolvedAppearance } from "@/lib/ui-theme";

export function LandingPreviewPipeline({
  locale,
  appearance,
  onToggleAppearance,
}: {
  locale: AppLocale;
  appearance: UiResolvedAppearance;
  onToggleAppearance: () => void;
}) {
  const home = getDashboardHomeCopy(locale);
  const title = pickQuad(locale, {
    fr: "Pipeline encaissement",
    en: "Collection pipeline",
    nl: "Incassatie-pipeline",
    es: "Pipeline de cobro",
  });

  return (
    <LandingPreviewShell
      locale={locale}
      appearance={appearance}
      onToggleAppearance={onToggleAppearance}
      windowTitle={`PayPulss · ${title}`}
    >
      <div className="p-3 sm:p-4">
        <CollectionPipeline
          clients={LANDING_DEMO_CLIENTS}
          locale={locale}
          appearance={appearance}
          variant="full"
          onClientClick={() => {}}
        />
        <p className={`mt-3 text-center text-[10px] ${appearance === "light" ? "text-slate-500" : "text-slate-500"}`}>
          {home.pipelineTitle}
        </p>
      </div>
    </LandingPreviewShell>
  );
}
