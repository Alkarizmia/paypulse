"use client";

import Link from "next/link";
import { MARKETING_PLANS, type PlanId } from "@/lib/plans";
import {
  getLandingCopy,
  getLocalizedPlanCard,
  pricingAnnualPeriodLabel,
} from "@/lib/messages/landing-copy";
import { pickQuad } from "@/lib/messages/pick";
import type { AppLocale } from "@/lib/app-locale";
import { PaypulssPulseDivider } from "@/app/landing/paypulss-pulse";

type BillingCycle = "monthly" | "annual";

type AnnualPricing = {
  annual: string;
  oldAnnual: string;
};

/** Conservé pour réactivation via NEXT_PUBLIC_SHOW_PRICING=true. */
const ANNUAL_PRICING: Partial<Record<PlanId, AnnualPricing>> = {
  starter: { annual: "86.40€", oldAnnual: "108€" },
  pro: { annual: "182.40€", oldAnnual: "228€" },
  agency: { annual: "374.40€", oldAnnual: "468€" },
};

type Props = {
  locale: AppLocale;
  billingCycle: BillingCycle;
  onBillingCycleChange: (cycle: BillingCycle) => void;
  pricingSub: string;
  waitlist: boolean;
  primaryLabel: string;
  onWaitlistPlan: (planId: PlanId) => void;
  resolvePlanCtaHref: (planId: PlanId) => string;
};

/** Grille des 4 plans : montée uniquement si isShowPricing(). */
export function LandingPricingGrid({
  locale,
  billingCycle,
  onBillingCycleChange,
  pricingSub,
  waitlist,
  primaryLabel,
  onWaitlistPlan,
  resolvePlanCtaHref,
}: Props) {
  const t = getLandingCopy(locale);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-[-0.03em] text-text sm:text-4xl">{t.pricingTitle}</h2>
        <p className="mt-4 text-text-muted">{pricingSub}</p>
        <PaypulssPulseDivider className="mx-auto mt-8" />
        <div
          role="tablist"
          aria-label={pickQuad(locale, {
            fr: "Choix de facturation mensuelle ou annuelle",
            en: "Choose monthly or yearly billing",
            nl: "Kies maandelijkse of jaarlijkse facturatie",
            es: "Elige facturación mensual o anual",
          })}
          className="mx-auto mt-8 flex h-11 w-[min(100%,18rem)] rounded-full border border-border bg-white p-1"
        >
          {(["monthly", "annual"] as const).map((cycle) => (
            <button
              key={cycle}
              type="button"
              role="tab"
              aria-selected={billingCycle === cycle}
              onClick={() => onBillingCycleChange(cycle)}
              className={`flex-1 rounded-full text-sm font-medium transition-colors ${
                billingCycle === cycle ? "bg-primary text-white" : "text-text-muted"
              }`}
            >
              {cycle === "monthly" ? t.pricingBillingMonthly : t.pricingBillingAnnual}
            </button>
          ))}
        </div>
        {billingCycle === "annual" ? (
          <p className="mt-3 text-xs text-text-muted">{t.pricingAnnualSavingsNote}</p>
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
          const cta = waitlist
            ? primaryLabel
            : localized?.cta ??
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
                highlight ? "border-accent/35 bg-white" : "border-border bg-white"
              }`}
            >
              {highlight ? (
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">{t.popular}</p>
              ) : (
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-transparent">.</p>
              )}
              <h3 className="mt-3 text-lg font-semibold text-text">{name}</h3>
              <p className="mt-1 min-h-[2.75rem] text-sm leading-relaxed text-text-muted">{description}</p>
              <p className="mt-6 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight text-text">{shownPrice}</span>
                <span className="text-sm text-text-muted">{period}</span>
              </p>
              {showAnnual ? (
                <p className="mt-2 text-xs text-text-muted">
                  {t.pricingAnnualOldLabel} <span className="line-through">{annualPricing!.oldAnnual}</span>
                </p>
              ) : null}
              <ul className="mt-6 flex-1 space-y-2 text-sm text-text-muted">
                {features.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              {waitlist ? (
                <button
                  type="button"
                  onClick={() => onWaitlistPlan(plan.id)}
                  className={`pp-lp-btn mt-8 w-full py-2.5 ${
                    highlight ? "bg-primary text-white" : "border border-border text-text"
                  }`}
                >
                  {cta}
                </button>
              ) : (
                <Link
                  href={resolvePlanCtaHref(plan.id)}
                  className={`pp-lp-btn mt-8 w-full py-2.5 ${
                    highlight ? "bg-primary text-white" : "border border-border text-text"
                  }`}
                >
                  {cta}
                </Link>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
