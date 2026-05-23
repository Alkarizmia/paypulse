"use client";

import type { LandingCopy } from "@/lib/messages/landing-copy";
import type { AppLocale } from "@/lib/app-locale";
import type { UiResolvedAppearance } from "@/lib/ui-theme";
import { LandingDashboardPreview } from "@/app/landing/landing-dashboard-preview";
import { LandingPreviewClients } from "@/app/landing/previews/landing-preview-clients";
import { LandingPreviewPipeline } from "@/app/landing/previews/landing-preview-pipeline";
import { LandingPreviewRemind } from "@/app/landing/previews/landing-preview-remind";
import { LandingPreviewOrganisation } from "@/app/landing/previews/landing-preview-organisation";
import { LandingPreviewIntegrations } from "@/app/landing/previews/landing-preview-integrations";

export { LANDING_PREVIEW_FRAME_CLASS } from "@/app/landing/landing-preview-shell";

type FeatureKind = LandingCopy["features"][number]["kind"];

type LandingFeaturePreviewProps = {
  tab: FeatureKind;
  locale: AppLocale;
  appearance: UiResolvedAppearance;
  onToggleAppearance: () => void;
};

/** Un écran produit distinct par onglet, composants réels du dashboard. */
export function LandingFeaturePreview({ tab, locale, appearance, onToggleAppearance }: LandingFeaturePreviewProps) {
  const shared = { locale, appearance, onToggleAppearance };

  switch (tab) {
    case "clients":
      return <LandingPreviewClients {...shared} />;
    case "status":
      return <LandingPreviewPipeline {...shared} />;
    case "remind":
      return <LandingPreviewRemind {...shared} />;
    case "dash":
      return <LandingDashboardPreview {...shared} />;
    case "auto":
      return <LandingPreviewOrganisation {...shared} />;
    case "data":
      return <LandingPreviewIntegrations {...shared} />;
    default:
      return <LandingDashboardPreview {...shared} />;
  }
}
