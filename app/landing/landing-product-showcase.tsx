"use client";

import { motion } from "framer-motion";
import { LandingDashboardPreview } from "@/app/landing/landing-dashboard-preview";
import { usePreferMinimalMotion } from "@/lib/use-prefer-minimal-motion";
import type { AppLocale } from "@/lib/app-locale";
import type { UiResolvedAppearance } from "@/lib/ui-theme";
import { getLandingPremiumCopy } from "@/lib/messages/landing-premium-copy";

export function LandingProductShowcase({
  locale,
  appearance,
  onToggleAppearance,
}: {
  locale: AppLocale;
  appearance: UiResolvedAppearance;
  onToggleAppearance: () => void;
}) {
  const reduce = usePreferMinimalMotion();
  const c = getLandingPremiumCopy(locale);

  return (
    <div className="relative z-[1] px-4 sm:px-6">
      <motion.div
        id="apercu"
        className="scroll-mt-28"
        initial={reduce ? false : { opacity: 0, y: 28 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-[#E7EAF0] bg-white shadow-[0_28px_80px_-48px_rgba(22,33,58,0.35)]">
          <LandingDashboardPreview
            locale={locale}
            appearance={appearance}
            onToggleAppearance={onToggleAppearance}
            frameClassName="h-[min(38rem,72vh)] sm:h-[40rem]"
          />
        </div>
      </motion.div>
      <p className="mx-auto mt-14 max-w-2xl text-center text-sm font-medium tracking-tight text-[#64748B] sm:text-base">
        {c.trustLine}
      </p>
    </div>
  );
}
