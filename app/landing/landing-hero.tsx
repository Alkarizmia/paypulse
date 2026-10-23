"use client";

import Link from "next/link";
import { useAuth } from "@/app/auth-context";
import { getLandingPremiumCopy } from "@/lib/messages/landing-premium-copy";
import { getWaitlistCopy } from "@/lib/messages/waitlist-copy";
import { PaypulssPulse } from "@/app/landing/paypulss-pulse";

export function LandingHero({
  waitlistMode = false,
  onWaitlistClick,
  trustOverride,
}: {
  /** Kept for call-site compatibility. Public hero is English-only. */
  locale?: "en";
  primaryHref?: string;
  primaryLabel?: string;
  waitlistMode?: boolean;
  onWaitlistClick?: () => void;
  trustOverride?: string[];
}) {
  const { isAuthenticated } = useAuth();
  /** Public marketing copy is always English. */
  const c = getLandingPremiumCopy("en");
  const w = getWaitlistCopy("en");
  const trustItems = trustOverride ?? [c.trust1, c.trust2, c.trust3];

  /** Production always waitlist. Dashboard CTA only in local/dev when logged in. */
  const showDashboardCta =
    process.env.NODE_ENV === "development" && isAuthenticated;

  const primaryCtaClass = "pp-lp-btn w-full bg-primary px-7 py-3.5 text-base text-white sm:w-auto";
  const ctaLabel = showDashboardCta
    ? "Go to dashboard"
    : waitlistMode
      ? w.cta
      : "Join the waitlist";

  return (
    <section className="relative isolate px-4 pb-6 pt-10 sm:px-6 sm:pt-16 lg:pt-20">
      <div className="pp-enter-hero relative mx-auto max-w-3xl text-center">
        <p className="pp-enter-item text-[11px] font-semibold uppercase tracking-[0.22em] text-text-muted">
          {c.badge}
        </p>
        <h1 className="pp-enter-item mt-6 text-[2.2rem] font-semibold leading-[1.1] tracking-[-0.038em] text-text sm:text-5xl lg:text-[3.4rem]">
          {c.titleLine1}
          <br />
          <span className="text-accent">{c.titleAccent}</span>
        </h1>
        <p className="pp-enter-item mx-auto mt-6 max-w-xl text-[1.05rem] leading-relaxed text-text-muted sm:text-lg">
          {c.subtitle}
        </p>

        <PaypulssPulse className="pp-enter-item mx-auto mt-8 max-w-sm" />

        <div className="pp-enter-item mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          {showDashboardCta ? (
            <Link href="/dashboard" className={primaryCtaClass}>
              {ctaLabel}
            </Link>
          ) : (
            <button type="button" onClick={onWaitlistClick} className={primaryCtaClass}>
              {ctaLabel}
            </button>
          )}
          <a href="#how" className="text-sm font-medium text-text-muted underline-offset-4 hover:text-text hover:underline">
            {c.ctaSecondary}
          </a>
        </div>

        <ul className="pp-enter-item mt-8 flex flex-col items-center justify-center gap-2 text-[13px] text-text-muted sm:flex-row sm:gap-6">
          {trustItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
