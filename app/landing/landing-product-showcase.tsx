"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { LandingDashboardPreview } from "@/app/landing/landing-dashboard-preview";
import type { AppLocale } from "@/lib/app-locale";
import type { UiResolvedAppearance } from "@/lib/ui-theme";
import { getLandingPremiumCopy } from "@/lib/messages/landing-premium-copy";
import { useOnceInView } from "@/lib/use-once-in-view";
import { usePreferMinimalMotion } from "@/lib/use-prefer-minimal-motion";

export function LandingProductShowcase({
  locale,
  appearance,
  onToggleAppearance,
}: {
  locale: AppLocale;
  appearance: UiResolvedAppearance;
  onToggleAppearance: () => void;
}) {
  const c = getLandingPremiumCopy(locale);
  const reduce = usePreferMinimalMotion();
  const { ref, inView, armed } = useOnceInView<HTMLDivElement>(0.2);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: parallaxRef,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [16, -16]);

  const mockupClass = [
    "scroll-mt-28",
    reduce ? "" : "pp-lp-mockup",
    !reduce && armed ? "pp-lp-mockup--armed" : "",
    !reduce && inView ? "pp-lp-mockup--in" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="relative z-[1] px-4 sm:px-6" ref={parallaxRef}>
      <motion.div style={{ y }}>
        <div id="apercu" ref={ref} className={mockupClass}>
          <div className="pp-lp-card mx-auto max-w-5xl overflow-hidden">
            <LandingDashboardPreview
              locale={locale}
              appearance={appearance}
              onToggleAppearance={onToggleAppearance}
              frameClassName="h-[min(38rem,72vh)] sm:h-[40rem]"
              heroScrollReveal={!reduce}
            />
          </div>
        </div>
      </motion.div>
      <p className="mx-auto mt-14 max-w-2xl text-center text-sm font-medium tracking-tight text-text-muted sm:text-base">
        {c.trustLine}
      </p>
    </div>
  );
}
