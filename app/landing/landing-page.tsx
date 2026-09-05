"use client";

import Link from "next/link";
import { useState } from "react";
import { PayPulseLogo } from "@/app/dashboard/pay-pulse-logo";
import { MARKETING_PLANS, type PlanId } from "@/lib/plans";
import { useLocale } from "@/app/locale-context";
import { useAuth } from "@/app/auth-context";
import { getLandingCopy, getLocalizedPlanCard, pricingAnnualPeriodLabel } from "@/lib/messages/landing-copy";
import { pickQuad } from "@/lib/messages/pick";
import { getLandingPremiumCopy } from "@/lib/messages/landing-premium-copy";
import type { UiResolvedAppearance } from "@/lib/ui-theme";
import { LandingNav } from "@/app/landing/landing-nav";
import { LandingHero } from "@/app/landing/landing-hero";
import { LandingProductShowcase } from "@/app/landing/landing-product-showcase";
import { LandingEditorialFeatures } from "@/app/landing/landing-editorial-features";
import "./landing-premium.css";

type BillingCycle = "monthly" | "annual";

type AnnualPricing = {
  annual: string;
  oldAnnual: string;
};

const ANNUAL_PRICING: Partial<Record<PlanId, AnnualPricing>> = {
  starter: { annual: "86.40€", oldAnnual: "108€" },
  pro: { annual: "182.40€", oldAnnual: "228€" },
  agency: { annual: "374.40€", oldAnnual: "468€" },
};

export function LandingPage() {
  const { locale } = useLocale();
  const { isAuthenticated } = useAuth();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [appearance, setAppearance] = useState<UiResolvedAppearance>("light");
  const t = getLandingCopy(locale);
  const p = getLandingPremiumCopy(locale);
  const primaryHref = isAuthenticated ? "/dashboard" : "/signup";
  const primaryLabel = isAuthenticated ? t.ctaDashboard : p.ctaPrimary;
  const toggleAppearance = () => setAppearance((a) => (a === "light" ? "dark" : "light"));

  const resolvePlanCtaHref = (planId: PlanId): string => {
    if (planId === "free") return isAuthenticated ? "/dashboard?plan=free" : "/signup?plan=free";
    return isAuthenticated
      ? `/dashboard?plan=${planId}&billing=${billingCycle}`
      : `/signup?plan=${planId}&billing=${billingCycle}`;
  };

  return (
    <div className="pp-lp relative min-h-screen antialiased">
      <div className="pp-lp-atmosphere" aria-hidden>
        <div className="pp-lp-hero-fx">
          <span className="pp-lp-halo pp-lp-halo--tl" />
          <span className="pp-lp-halo pp-lp-halo--tr" />
          <span className="pp-lp-halo pp-lp-halo--center" />
          <span className="pp-lp-spark pp-lp-spark--a" />
          <span className="pp-lp-spark pp-lp-spark--b" />
          <span className="pp-lp-spark pp-lp-spark--c" />
          <span className="pp-lp-spark pp-lp-spark--d" />
          <span className="pp-lp-star pp-lp-star--a" />
          <span className="pp-lp-star pp-lp-star--b" />
          <span className="pp-lp-star pp-lp-star--c" />
          <span className="pp-lp-dust" />
        </div>
      </div>
      <LandingNav />
      <main className="relative z-[1]">
        <div className="pp-lp-top-scene">
          <LandingHero locale={locale} primaryHref={primaryHref} primaryLabel={primaryLabel} />
          <LandingProductShowcase
            locale={locale}
            appearance={appearance}
            onToggleAppearance={toggleAppearance}
          />
        </div>
        <div id="demo" className="sr-only" aria-hidden />
        <LandingEditorialFeatures
          locale={locale}
          appearance={appearance}
          onToggleAppearance={toggleAppearance}
        />

        <section id="pricing" className="scroll-mt-28 px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-[#172033] sm:text-4xl">{t.pricingTitle}</h2>
              <p className="mt-4 text-[#64748B]">{t.pricingSub}</p>
              <div
                role="tablist"
                aria-label={pickQuad(locale, {
                  fr: "Choix de facturation mensuelle ou annuelle",
                  en: "Choose monthly or yearly billing",
                  nl: "Kies maandelijkse of jaarlijkse facturatie",
                  es: "Elige facturación mensual o anual",
                })}
                className="mx-auto mt-8 flex h-11 w-[min(100%,18rem)] rounded-full border border-[#E7EAF0] bg-white p-1"
              >
                {(["monthly", "annual"] as const).map((cycle) => (
                  <button
                    key={cycle}
                    type="button"
                    role="tab"
                    aria-selected={billingCycle === cycle}
                    onClick={() => setBillingCycle(cycle)}
                    className={`flex-1 rounded-full text-sm font-medium transition-colors ${
                      billingCycle === cycle ? "bg-[#16213A] text-white" : "text-[#64748B]"
                    }`}
                  >
                    {cycle === "monthly" ? t.pricingBillingMonthly : t.pricingBillingAnnual}
                  </button>
                ))}
              </div>
              {billingCycle === "annual" ? (
                <p className="mt-3 text-xs text-[#64748B]">{t.pricingAnnualSavingsNote}</p>
              ) : null}
            </div>

            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {MARKETING_PLANS.map((plan) => {
                const localized = getLocalizedPlanCard(locale, plan.id);
                const name = localized?.name ?? plan.name;
                const description = localized?.description ?? plan.description;
                const features = localized?.features ?? plan.features;
                const annualPricing = ANNUAL_PRICING[plan.id];
                const showAnnual = billingCycle === "annual" && Boolean(annualPricing);
                const shownPrice = showAnnual ? annualPricing!.annual : plan.price;
                const period = showAnnual
                  ? pricingAnnualPeriodLabel(locale)
                  : localized?.periodLabel ??
                    (plan.period === "forever"
                      ? pickQuad(locale, { fr: "gratuit", en: "free", nl: "gratis", es: "gratis" })
                      : plan.period);
                const cta =
                  localized?.cta ??
                  (plan.id === "free"
                    ? pickQuad(locale, {
                        fr: "Tester gratuitement",
                        en: "Start free",
                        nl: "Gratis proberen",
                        es: "Probar gratis",
                      })
                    : t.planCtaEnFallback);
                const highlight = Boolean(plan.highlighted);

                return (
                  <article
                    key={plan.id}
                    className={`flex flex-col rounded-2xl border p-6 ${
                      highlight ? "border-[#315BCB]/35 bg-white" : "border-[#E7EAF0] bg-white"
                    }`}
                  >
                    {highlight ? (
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#315BCB]">{t.popular}</p>
                    ) : (
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-transparent">.</p>
                    )}
                    <h3 className="mt-3 text-lg font-semibold text-[#172033]">{name}</h3>
                    <p className="mt-1 min-h-[2.75rem] text-sm leading-relaxed text-[#64748B]">{description}</p>
                    <p className="mt-6 flex items-baseline gap-1">
                      <span className="text-3xl font-semibold tracking-tight text-[#172033]">{shownPrice}</span>
                      <span className="text-sm text-[#64748B]">{period}</span>
                    </p>
                    {showAnnual ? (
                      <p className="mt-2 text-xs text-[#64748B]">
                        {t.pricingAnnualOldLabel} <span className="line-through">{annualPricing!.oldAnnual}</span>
                      </p>
                    ) : null}
                    <ul className="mt-6 flex-1 space-y-2 text-sm text-[#64748B]">
                      {features.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                    <Link
                      href={resolvePlanCtaHref(plan.id)}
                      className={`pp-lp-btn mt-8 w-full py-2.5 ${
                        highlight
                          ? "bg-[#315BCB] text-white hover:bg-[#2648a3]"
                          : "border border-[#E7EAF0] text-[#172033] hover:border-[#d5dae3]"
                      }`}
                    >
                      {cta}
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-28 border-t border-[#E7EAF0] px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-[#172033]">{t.faqTitle}</h2>
            <p className="mt-3 text-[#64748B]">{t.faqSub}</p>
            <div className="mt-10 divide-y divide-[#E7EAF0] border-y border-[#E7EAF0]">
              {t.faqItems.map((item) => (
                <details key={item.q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium text-[#172033] [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <span className="text-[#64748B] transition group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-[#64748B]">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-[#172033] sm:text-4xl">{p.finalTitle}</h2>
            <Link
              href={primaryHref}
              className="pp-lp-btn mt-8 bg-[#315BCB] px-8 py-3 text-white hover:bg-[#2648a3]"
            >
              {primaryLabel}
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E7EAF0] px-4 py-12 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-2">
            <PayPulseLogo className="h-8 w-8" />
            <span className="text-sm font-semibold text-[#172033]">PayPulss</span>
          </div>
          <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
            <div>
              <p className="font-medium text-[#172033]">{t.footerProduct}</p>
              <ul className="mt-3 space-y-2 text-[#64748B]">
                <li>
                  <a href="#features" className="hover:text-[#172033]">
                    {t.footerLinks.features}
                  </a>
                </li>
                <li>
                  <a href="#apercu" className="hover:text-[#172033]">
                    {t.footerLinks.preview}
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-[#172033]">
                    {t.footerLinks.pricing}
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-[#172033]">
                    {t.footerLinks.faq}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-[#172033]">{t.footerCompany}</p>
              <ul className="mt-3 space-y-2 text-[#64748B]">
                <li>
                  <Link href="/a-propos" className="hover:text-[#172033]">
                    {t.footerLinks.about}
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-[#172033]">
                    {t.footerLinks.contact}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-[#172033]">{t.footerLegal}</p>
              <ul className="mt-3 space-y-2 text-[#64748B]">
                <li>
                  <Link href="/legal" className="hover:text-[#172033]">
                    {t.footerLinks.legalHub}
                  </Link>
                </li>
                <li>
                  <Link href="/confidentialite" className="hover:text-[#172033]">
                    {t.footerLinks.privacy}
                  </Link>
                </li>
                <li>
                  <Link href="/conditions-utilisation" className="hover:text-[#172033]">
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
