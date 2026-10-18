import { LandingFreeMock } from "@/app/landing/landing-free-mock";

/**
 * Ancien aperçu branché sur DashboardAnalytics : remplacé par la maquette Free
 * statique pour éviter charts / framer sur la landing.
 */
export function LandingDashboardPreview(props: {
  locale?: unknown;
  appearance?: unknown;
  onToggleAppearance?: unknown;
  frameClassName?: string;
  heroScrollReveal?: boolean;
}) {
  const locale =
    props.locale === "fr" || props.locale === "en" || props.locale === "nl" || props.locale === "es"
      ? props.locale
      : "fr";
  return <LandingFreeMock locale={locale} />;
}
