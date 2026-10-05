"use client";

import { motion } from "framer-motion";
import { LandingPreviewClients } from "@/app/landing/previews/landing-preview-clients";
import { LandingPreviewRemind } from "@/app/landing/previews/landing-preview-remind";
import { LandingDashboardPreview } from "@/app/landing/landing-dashboard-preview";
import { usePreferMinimalMotion } from "@/lib/use-prefer-minimal-motion";
import type { AppLocale } from "@/lib/app-locale";
import type { UiResolvedAppearance } from "@/lib/ui-theme";
import { getLandingPremiumCopy } from "@/lib/messages/landing-premium-copy";

const FRAME = "h-[26rem] sm:h-[28rem]";
const EASE = [0.22, 1, 0.36, 1] as const;

export function LandingEditorialFeatures({
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
  const previewProps = { locale, appearance, onToggleAppearance, frameClassName: FRAME };

  const rows = [
    {
      title: c.feature1Title,
      body: c.feature1Body,
      preview: <LandingPreviewClients {...previewProps} />,
      reverse: false,
    },
    {
      title: c.feature2Title,
      body: c.feature2Body,
      preview: <LandingPreviewRemind {...previewProps} />,
      reverse: true,
    },
    {
      title: c.feature3Title,
      body: c.feature3Body,
      preview: <LandingDashboardPreview {...previewProps} />,
      reverse: false,
    },
  ];

  return (
    <section id="features" className="scroll-mt-28 px-4 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto flex max-w-6xl flex-col gap-24 sm:gap-32">
        {rows.map((row, i) => (
          <motion.article
            key={row.title}
            className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${row.reverse ? "lg:[&>div:first-child]:order-2" : ""}`}
            initial={
              reduce
                ? { opacity: 0 }
                : { opacity: 0, y: 12, filter: "blur(8px)" }
            }
            whileInView={
              reduce
                ? { opacity: 1 }
                : { opacity: 1, y: 0, filter: "blur(0px)" }
            }
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, delay: i * 0.04, ease: EASE }}
          >
            <div>
              <h2 className="max-w-md text-3xl font-semibold tracking-[-0.03em] text-text sm:text-4xl">
                {row.title}
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-text-muted">{row.body}</p>
            </div>
            <div className="pp-lp-card overflow-hidden">{row.preview}</div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
