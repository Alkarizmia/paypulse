import { LandingFreeMock } from "@/app/landing/landing-free-mock";

/**
 * Ancien aperçu branché sur DashboardAnalytics : remplacé par la maquette Free
 * statique pour éviter charts / framer sur la landing.
 */
export function LandingDashboardPreview(_props: {
  locale?: unknown;
  appearance?: unknown;
  onToggleAppearance?: unknown;
  frameClassName?: string;
  heroScrollReveal?: boolean;
}) {
  return <LandingFreeMock />;
}
