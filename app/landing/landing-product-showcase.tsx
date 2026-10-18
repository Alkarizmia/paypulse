import { LandingFreeMock } from "@/app/landing/landing-free-mock";
import type { AppLocale } from "@/lib/app-locale";
import { getLandingPremiumCopy } from "@/lib/messages/landing-premium-copy";

/** Hero mock : maquette Free statique (pas de charts / framer / DashboardAnalytics). */
export function LandingProductShowcase({ locale }: { locale: AppLocale }) {
  const c = getLandingPremiumCopy(locale);

  return (
    <div className="relative z-[1] px-4 sm:px-6">
      <div className="pp-lp-enter mx-auto max-w-lg sm:max-w-xl" style={{ animationDelay: "80ms" }}>
        <LandingFreeMock locale={locale} />
      </div>
      <p className="mx-auto mt-10 max-w-2xl text-center text-sm font-medium tracking-tight text-text-muted sm:text-base">
        {c.trustLine}
      </p>
    </div>
  );
}
