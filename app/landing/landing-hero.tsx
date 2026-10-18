"use client";

import Link from "next/link";
import type { AppLocale } from "@/lib/app-locale";
import { getLandingPremiumCopy } from "@/lib/messages/landing-premium-copy";
import { PaypulssPulse } from "@/app/landing/paypulss-pulse";

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
  const trustItems = trustOverride ?? [c.trust1, c.trust2, c.trust3];

  const primaryCtaClass = "pp-lp-btn w-full bg-primary px-7 py-3.5 text-base text-white sm:w-auto";

  return (
    <section className="relative isolate px-4 pb-6 pt-10 sm:px-6 sm:pt-16 lg:pt-20">
      <div className="pp-lp-enter relative mx-auto max-w-3xl text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-muted">{c.badge}</p>
        <h1 className="mt-6 text-[2.2rem] font-semibold leading-[1.1] tracking-[-0.038em] text-text sm:text-5xl lg:text-[3.4rem]">
          {c.titleLine1}
          <br />
          <span className="text-accent">{c.titleAccent}</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-[1.05rem] leading-relaxed text-text-muted sm:text-lg">
          {c.subtitle}
        </p>

        <PaypulssPulse className="mx-auto mt-8 max-w-sm" />

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          {waitlistMode ? (
            <button type="button" onClick={onWaitlistClick} className={primaryCtaClass}>
              {primaryLabel}
            </button>
          ) : (
            <Link href={primaryHref} className={primaryCtaClass}>
              {primaryLabel}
            </Link>
          )}
          <a href="#how" className="text-sm font-medium text-text-muted underline-offset-4 hover:text-text hover:underline">
            {c.ctaSecondary}
          </a>
        </div>

        <ul className="mt-8 flex flex-col items-center justify-center gap-2 text-[13px] text-text-muted sm:flex-row sm:gap-6">
          {trustItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
