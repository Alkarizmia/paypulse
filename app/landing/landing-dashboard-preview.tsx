import { LandingFreeMock } from "@/app/landing/landing-free-mock";

/**
 * Legacy preview wrapper: Free mock only (no charts / framer on the landing).
 */
export function LandingDashboardPreview(_props?: {
  locale?: unknown;
  appearance?: unknown;
  onToggleAppearance?: unknown;
  frameClassName?: string;
  heroScrollReveal?: boolean;
}) {
  return <LandingFreeMock />;
}
