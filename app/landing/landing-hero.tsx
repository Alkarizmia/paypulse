"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { usePreferMinimalMotion } from "@/lib/use-prefer-minimal-motion";
import type { AppLocale } from "@/lib/app-locale";
import { getLandingPremiumCopy } from "@/lib/messages/landing-premium-copy";

export function LandingHero({
  locale,
  primaryHref,
  primaryLabel,
}: {
  locale: AppLocale;
  primaryHref: string;
  primaryLabel: string;
}) {
  const c = getLandingPremiumCopy(locale);
  const reduce = usePreferMinimalMotion();
  const fade = (delay: number, blurPx = 28) =>
    reduce
      ? undefined
      : {
          initial: { opacity: 0, y: 22, filter: `blur(${blurPx}px)` },
          animate: { opacity: 1, y: 0, filter: "blur(0px)" },
          transition: { duration: 1.05, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <section className="relative isolate px-4 pb-6 pt-10 sm:px-6 sm:pt-16 lg:pt-20">
      <div className="relative mx-auto max-w-3xl text-center">
        <motion.p
          {...fade(0.04, 18)}
          className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#64748B]"
        >
          {c.badge}
        </motion.p>
        <motion.h1
          {...fade(0.1, 36)}
          className="mt-6 text-[2.35rem] font-semibold leading-[1.08] tracking-[-0.038em] text-[#172033] sm:text-5xl lg:text-[3.65rem]"
        >
          {c.titleLine1}
          <br />
          <span className="text-[#315BCB]">{c.titleAccent}</span>
        </motion.h1>
        <motion.p
          {...fade(0.2, 22)}
          className="mx-auto mt-6 max-w-xl text-[1.05rem] leading-relaxed text-[#64748B] sm:text-lg"
        >
          {c.subtitle}
        </motion.p>
        <motion.div
          {...fade(0.3, 16)}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
        >
          <Link href={primaryHref} className="pp-lp-btn w-full bg-[#315BCB] px-7 py-3 text-white hover:bg-[#2648a3] sm:w-auto">
            {primaryLabel}
          </Link>
          <a
            href="#features"
            className="pp-lp-btn w-full border border-[#E7EAF0] bg-white px-7 py-3 text-[#172033] hover:border-[#d5dae3] sm:w-auto"
          >
            {c.ctaSecondary}
          </a>
        </motion.div>
        <motion.ul
          {...fade(0.4, 14)}
          className="mt-8 flex flex-col items-center justify-center gap-2 text-[13px] text-[#64748B] sm:flex-row sm:gap-6"
        >
          {[c.trust1, c.trust2, c.trust3].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="text-[#315BCB]" aria-hidden>
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
