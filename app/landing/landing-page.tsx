"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { PayPulseLogo } from "@/app/dashboard/pay-pulse-logo";
import type { PlanId } from "@/lib/plans";
import { useLocale } from "@/app/locale-context";
import { useAuth } from "@/app/auth-context";
import { getLandingCopy } from "@/lib/messages/landing-copy";
import { getLandingPremiumCopy } from "@/lib/messages/landing-premium-copy";
import { getWaitlistCopy } from "@/lib/messages/waitlist-copy";
import { isWaitlistMode } from "@/lib/waitlist-mode";
import { isShowPricing } from "@/lib/show-pricing";
import { captureWaitlistAttribution } from "@/lib/waitlist-attribution";
import { LandingNav } from "@/app/landing/landing-nav";
import { LandingHero } from "@/app/landing/landing-hero";
import { LandingProductShowcase } from "@/app/landing/landing-product-showcase";
import { LandingEditorialFeatures } from "@/app/landing/landing-editorial-features";
import { LandingHowSimple } from "@/app/landing/landing-how-simple";
import { WaitlistModal } from "@/app/landing/waitlist-modal";
import { PaypulssPulseDivider } from "@/app/landing/paypulss-pulse";
import "./landing-premium.css";

type BillingCycle = "monthly" | "annual";

/** Chargé seulement si NEXT_PUBLIC_SHOW_PRICING=true (évite les prix dans le HTML sinon). */
const LandingPricingGrid = dynamic(
  () =>
    import("@/app/landing/landing-pricing-grid").then((m) => ({
      default: m.LandingPricingGrid,
    })),
  { ssr: true },
);

export function LandingPage() {
  const { locale } = useLocale();
  const { isAuthenticated } = useAuth();
  const waitlist = isWaitlistMode();
  const showPricing = isShowPricing();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistSource, setWaitlistSource] = useState("landing");
  const t = getLandingCopy(locale);
  const p = getLandingPremiumCopy(locale);
  const w = getWaitlistCopy(locale);
  const primaryHref = isAuthenticated ? "/dashboard" : "/signup";
  const primaryLabel = waitlist ? w.cta : isAuthenticated ? t.ctaDashboard : p.ctaPrimary;
  const pricingSub = waitlist ? w.pricingNote : t.pricingSub;

  useEffect(() => {
    captureWaitlistAttribution();
  }, []);

  const openWaitlist = useCallback((source: string) => {
    setWaitlistSource(source);
    setWaitlistOpen(true);
  }, []);

  const resolvePlanCtaHref = (planId: PlanId): string => {
    if (planId === "free") return isAuthenticated ? "/dashboard?plan=free" : "/signup?plan=free";
    return isAuthenticated
      ? `/dashboard?plan=${planId}&billing=${billingCycle}`
      : `/signup?plan=${planId}&billing=${billingCycle}`;
  };

  return (
    <div className="pp-lp relative min-h-screen antialiased">
      <div className="pp-lp-atmosphere" aria-hidden />
      <LandingNav
        waitlistMode={waitlist}
        waitlistCtaLabel={primaryLabel}
        onWaitlistClick={() => openWaitlist("landing-nav")}
      />
      <WaitlistModal
        open={waitlistOpen}
        onClose={() => setWaitlistOpen(false)}
        source={waitlistSource}
      />
      <main className="relative z-[1]">
        <div className="pp-lp-top-scene">
          <LandingHero
            locale={locale}
            primaryHref={primaryHref}
            primaryLabel={primaryLabel}
            waitlistMode={waitlist}
            onWaitlistClick={() => openWaitlist("landing-hero")}
            trustOverride={waitlist ? [w.trustEarly, p.trust3] : undefined}
          />
          <LandingProductShowcase locale={locale} />
        </div>

        <LandingHowSimple />
        <LandingEditorialFeatures locale={locale} />

        <section id="pricing" className="scroll-mt-28 px-4 py-24 sm:px-6">
          {showPricing ? (
            <LandingPricingGrid
              locale={locale}
              billingCycle={billingCycle}
              onBillingCycleChange={setBillingCycle}
              pricingSub={pricingSub}
              waitlist={waitlist}
              primaryLabel={primaryLabel}
              onWaitlistPlan={(planId) => openWaitlist(`landing-pricing-${planId}`)}
              resolvePlanCtaHref={resolvePlanCtaHref}
            />
          ) : (
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-text sm:text-4xl">
                {p.pricingTeaserTitle}
              </h2>
              <PaypulssPulseDivider className="mx-auto mt-8" />
              <p className="mt-6 text-base leading-relaxed text-text-muted sm:text-lg">{p.pricingTeaserBody}</p>
              {waitlist ? (
                <button
                  type="button"
                  onClick={() => openWaitlist("landing-pricing-teaser")}
                  className="pp-lp-btn mt-8 bg-primary px-8 py-3.5 text-base text-white"
                >
                  {primaryLabel}
                </button>
              ) : (
                <Link href={primaryHref} className="pp-lp-btn mt-8 bg-primary px-8 py-3.5 text-base text-white">
                  {primaryLabel}
                </Link>
              )}
            </div>
          )}
        </section>

        <section id="faq" className="scroll-mt-28 border-t border-border px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-text">{t.faqTitle}</h2>
            <p className="mt-3 text-text-muted">{t.faqSub}</p>
            <div className="mt-10 divide-y divide-border border-y border-border">
              {t.faqItems.map((item) => (
                <details key={item.q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium text-text [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <span className="text-text-muted transition group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-text-muted">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-text sm:text-4xl">{p.finalTitle}</h2>
            {waitlist ? (
              <button
                type="button"
                onClick={() => openWaitlist("landing-final")}
                className="pp-lp-btn mt-8 bg-primary px-8 py-3.5 text-base text-white"
              >
                {primaryLabel}
              </button>
            ) : (
              <Link href={primaryHref} className="pp-lp-btn mt-8 bg-primary px-8 py-3.5 text-base text-white">
                {primaryLabel}
              </Link>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-12 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <PayPulseLogo className="h-9" />
            <span className="text-[15px] font-semibold tracking-tight text-text">PayPulss</span>
          </div>
          <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
            <div>
              <p className="font-medium text-text">{t.footerProduct}</p>
              <ul className="mt-3 space-y-2 text-text-muted">
                <li>
                  <a href="#features" className="hover:text-text">
                    {t.footerLinks.features}
                  </a>
                </li>
                <li>
                  <a href="#how" className="hover:text-text">
                    {t.footerLinks.footerHowLink}
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-text">
                    {t.footerLinks.pricing}
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-text">
                    {t.footerLinks.faq}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-text">{t.footerCompany}</p>
              <ul className="mt-3 space-y-2 text-text-muted">
                <li>
                  <Link href="/a-propos" className="hover:text-text">
                    {t.footerLinks.about}
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-text">
                    {t.footerLinks.contact}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-text">{t.footerLegal}</p>
              <ul className="mt-3 space-y-2 text-text-muted">
                <li>
                  <Link href="/legal" className="hover:text-text">
                    {t.footerLinks.legalHub}
                  </Link>
                </li>
                <li>
                  <Link href="/confidentialite" className="hover:text-text">
                    {t.footerLinks.privacy}
                  </Link>
                </li>
                <li>
                  <Link href="/conditions-utilisation" className="hover:text-text">
                    {t.footerLinks.terms}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
