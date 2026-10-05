"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { usePreferMinimalMotion } from "@/lib/use-prefer-minimal-motion";
import type { AppLocale } from "@/lib/app-locale";
import { getLandingPremiumCopy } from "@/lib/messages/landing-premium-copy";

const EASE = [0.22, 1, 0.36, 1] as const;

export function LandingHero({
  locale,
  primaryHref,
  primaryLabel,
  waitlistMode = false,
  onWaitlistClick,
  trustOverride,
}: {
  locale: AppLocale;
  primaryHref: string;
  primaryLabel: string;
  waitlistMode?: boolean;
  onWaitlistClick?: () => void;
  trustOverride?: string[];
}) {
  const c = getLandingPremiumCopy(locale);
  const reduce = usePreferMinimalMotion();
  const trustItems = trustOverride ?? [c.trust1, c.trust2, c.trust3];

  const fade = (delay: number) =>
    reduce
      ? {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.35, delay },
        }
      : {
          initial: { opacity: 0, y: 12, filter: "blur(8px)" },
          animate: { opacity: 1, y: 0, filter: "blur(0px)" },
          transition: { duration: 0.7, delay, ease: EASE },
        };

  const primaryCtaClass =
    "pp-lp-btn w-full bg-primary px-7 py-3 text-white sm:w-auto";

  return (
    <section className="relative isolate px-4 pb-6 pt-10 sm:px-6 sm:pt-16 lg:pt-20">
      <div className="relative mx-auto max-w-3xl text-center">
        <motion.p {...fade(0)} className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-muted">
          {c.badge}
        </motion.p>
        <motion.h1
          {...fade(0.1)}
          className="mt-6 text-[2.35rem] font-semibold leading-[1.08] tracking-[-0.038em] text-text sm:text-5xl lg:text-[3.65rem]"
        >
          {c.titleLine1}
          <br />
          <span className="text-accent">{c.titleAccent}</span>
        </motion.h1>
        <motion.p
          {...fade(0.2)}
          className="mx-auto mt-6 max-w-xl text-[1.05rem] leading-relaxed text-text-muted sm:text-lg"
        >
          {c.subtitle}
        </motion.p>
        <motion.div
          {...fade(0.3)}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
        >
          {waitlistMode ? (
            <button type="button" onClick={onWaitlistClick} className={primaryCtaClass}>
              {primaryLabel}
            </button>
          ) : (
            <Link href={primaryHref} className={primaryCtaClass}>
              {primaryLabel}
            </Link>
          )}
          <a
            href="#features"
            className="pp-lp-btn w-full border border-border bg-white px-7 py-3 text-text sm:w-auto"
          >
            {c.ctaSecondary}
          </a>
        </motion.div>
        <motion.ul
          {...fade(0.4)}
          className="mt-8 flex flex-col items-center justify-center gap-2 text-[13px] text-text-muted sm:flex-row sm:gap-6"
        >
          {trustItems.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="text-accent" aria-hidden>
                ✓
              </span>
              {item}
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
