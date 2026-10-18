import { LandingFreeMock } from "@/app/landing/landing-free-mock";
import type { AppLocale } from "@/lib/app-locale";

/** Hero mock interactif (pas de charts / framer). */
export function LandingProductShowcase({ locale }: { locale: AppLocale }) {
  return (
    <div className="relative z-[1] px-4 sm:px-6">
      <div className="mx-auto max-w-lg sm:max-w-xl">
        <LandingFreeMock locale={locale} />
      </div>
    </div>
  );
}
