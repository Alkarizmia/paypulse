"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePreferMinimalMotion } from "@/lib/use-prefer-minimal-motion";
import { useState, type ReactNode } from "react";
import { PayPulseLogo } from "@/app/dashboard/pay-pulse-logo";
import { MARKETING_PLANS, type PlanId } from "@/lib/plans";
import { useLocale } from "@/app/locale-context";
import { useAuth } from "@/app/auth-context";
import {
  CARD_LIFT_HOVER_VARIANTS,
  Reveal,
  cardLiftWhileHover,
} from "@/app/landing/landing-motion";
import { ScrollShiftSection } from "@/app/landing/scroll-shift-section";
import { ProofStatsSection } from "@/app/landing/proof-stats-section";
import { getLandingCopy, getLocalizedPlanCard, pricingAnnualPeriodLabel } from "@/lib/messages/landing-copy";
import { pickQuad } from "@/lib/messages/pick";
import { useHydrated } from "@/lib/use-hydrated";
import { LandingGreyWaveBackdrop } from "@/app/landing/landing-wave-backdrop";

import { ProductTourMarquee } from "@/app/landing/product-tour-marquee";
import { FeaturesRevealGrid } from "@/app/landing/features-reveal-grid";
import { LandingBonsaiHero } from "@/app/landing/landing-bonsai-hero";
import { LandingDemoSection } from "@/app/landing/landing-demo-section";
import { LandingHowSection } from "@/app/landing/landing-how-section";

const ACCENT = "#34D399";
const BG = "#f8fafc";
const FOUNDER_NAME = "El Fahmi Bilal";
const FOUNDER_IMAGE_SRC = "/images/founder-bilal.png";

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

type FeatureItem = { title: string; body: string; icon: ReactNode };

function featureIcon(kind: "clients" | "status" | "remind" | "dash" | "auto" | "data") {
  const stroke = { strokeWidth: 1.75 as const, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const common = "h-6 w-6 shrink-0 text-[#34D399]";
  switch (kind) {
    case "clients":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path {...stroke} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.813-4.003M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
        </svg>
      );
    case "status":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path {...stroke} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "remind":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path {...stroke} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      );
    case "dash":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path {...stroke} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 013 16.875v-3.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125v-8.25zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      );
    case "auto":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path {...stroke} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75V13.5z" />
        </svg>
      );
    case "data":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path {...stroke} d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125S3.75 16.153 3.75 13.875" />
        </svg>
      );
    default:
      return null;
  }
}

export function LandingPage() {
  const { locale } = useLocale();
  const { isAuthenticated } = useAuth();
  const hydrated = useHydrated();
  const reduceMotion = usePreferMinimalMotion();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  const t = getLandingCopy(locale);

  const featureCards: FeatureItem[] = t.features.map((f) => ({
    title: f.title,
    body: f.body,
    icon: featureIcon(f.kind),
  }));

  const planCardClass = (highlight: boolean) =>
    `pp-landing-plan-card relative flex h-full flex-col rounded-2xl border p-6 backdrop-blur-md transition-[box-shadow,border-color] duration-200 ease-out group-hover:border-[#34D399]/70 ${
      highlight
        ? "border-[#34D399]/55 bg-[#0a1f35] shadow-[0_18px_44px_-14px_rgba(52,211,153,0.22),0_0_44px_-12px_rgba(139,92,246,0.18)] group-hover:shadow-[0_22px_52px_-12px_rgba(52,211,153,0.28),0_0_48px_-8px_rgba(139,92,246,0.18)]"
        : "border-white/15 bg-[#0a1628] shadow-[0_12px_36px_-14px_rgba(0,0,0,0.4)] group-hover:border-white/25 group-hover:shadow-[0_18px_44px_-12px_rgba(0,0,0,0.5),0_0_36px_-10px_rgba(139,92,246,0.16)]"
    }`;

  const resolvePlanCtaHref = (planId: PlanId): string => {
    if (planId === "free") return isAuthenticated ? "/dashboard?plan=free" : "/signup?plan=free";
    return isAuthenticated
      ? `/dashboard?plan=${planId}&billing=${billingCycle}`
      : `/signup?plan=${planId}&billing=${billingCycle}`;
  };

  return (
    <div className="relative min-h-screen overflow-x-clip antialiased text-slate-900" style={{ backgroundColor: BG }}>
      <div className="pp-landing-ambient" aria-hidden>
        <div
          className="pp-landing-ambient__blob left-[-20%] top-[-25%] h-[min(520px,55vw)] w-[min(520px,55vw)]"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.28) 0%, rgba(99,102,241,0.12) 42%, transparent 72%)" }}
        />
        <div
          className="pp-landing-ambient__blob pp-landing-ambient__blob--2 right-[-15%] bottom-[10%] h-[min(480px,50vw)] w-[min(480px,50vw)]"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.26) 0%, rgba(167,139,250,0.1) 45%, transparent 74%)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(51,65,85,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(51,65,85,0.08) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <main className="relative z-[1]">
        <LandingBonsaiHero
          t={t}
          locale={locale}
          isAuthenticated={isAuthenticated}
          primaryHref={isAuthenticated ? "/dashboard" : "/signup"}
          secondaryHref={`#${t.demoAnchor}`}
          trustIntro={t.heroTrustIntro}
          trustPills={t.heroTrustPills}
        />

        {/* Section 2 & 3, Problème + Solution */}
        <ScrollShiftSection
          id="story"
          shift={1}
          className="relative z-10 scroll-mt-24 border-t border-slate-200/80 bg-gradient-to-b from-slate-100 to-slate-50 px-4 py-20 sm:px-6 sm:py-28"
        >
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2 lg:gap-10">
            <motion.div whileHover={{ scale: 1.03 }} transition={{ type: "spring", stiffness: 280, damping: 22 }}>
              <Reveal className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.85)] backdrop-blur-xl sm:p-10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-300/80">01</p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{t.problemTitle}</h2>
              <p className="mt-5 text-sm leading-relaxed text-slate-600 sm:text-base">{t.problemBody}</p>
              </Reveal>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} transition={{ type: "spring", stiffness: 280, damping: 22 }}>
              <Reveal
                className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200/95 p-8 shadow-[0_28px_80px_-40px_rgba(15,23,42,0.14)] ring-1 ring-slate-200/70 backdrop-blur-sm sm:p-10"
                delay={0.08}
              >
                <LandingGreyWaveBackdrop />
                <div className="relative z-10">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600">02</p>
                  <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{t.solutionTitle}</h2>
                  <p className="mt-5 text-sm leading-relaxed text-slate-600 sm:text-base">{t.solutionBody}</p>
                </div>
              </Reveal>
            </motion.div>
          </div>
        </ScrollShiftSection>

        <ScrollShiftSection id="features" shift={-1} className="scroll-mt-28 border-t border-slate-200 bg-white px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <Reveal className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{t.featuresTitle}</h2>
            </Reveal>
            <Reveal className="mx-auto mt-3 max-w-2xl text-center text-slate-600" delay={0.06}>
              <p>{t.featuresSub}</p>
            </Reveal>
            <FeaturesRevealGrid items={featureCards} reduceMotion={reduceMotion} />
            <div className="mx-auto mt-12 flex flex-wrap items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href={isAuthenticated ? "/dashboard" : "/signup"}
                  className="inline-flex items-center justify-center rounded-xl bg-[#2563eb] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-[#1d4ed8]"
                >
                  {isAuthenticated ? t.ctaDashboard : t.ctaTrial}
                </Link>
              </motion.div>
              <a
                href={`#${t.demoAnchor}`}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
              >
                {t.ctaPricing}
              </a>
            </div>
          </div>
        </ScrollShiftSection>

        <section
          id="product-tour"
          className="pp-product-tour-section scroll-mt-28 border-t border-slate-200/80 px-4 py-16 sm:px-6 sm:py-20"
        >
          <div className="mx-auto max-w-6xl">
            <Reveal className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{t.visualShowcaseTitle}</h2>
            </Reveal>
            <Reveal className="mx-auto mt-3 max-w-2xl text-center text-slate-600" delay={0.06}>
              <p>{t.visualShowcaseSub}</p>
            </Reveal>
            <ProductTourMarquee
              ariaLabel={t.visualShowcaseTitle}
              panels={[
                {
                  kind: "clients",
                  title: t.visualClientsTitle,
                  body: t.visualClientsBody,
                },
                {
                  kind: "reminders",
                  title: t.visualRelancesTitle,
                  body: t.visualRelancesBody,
                },
                {
                  kind: "treasury",
                  title: t.visualTreasuryTitle,
                  body: t.visualTreasuryBody,
                },
                {
                  kind: "deadlines",
                  title: t.visualMarqueeDueTitle,
                  body: t.visualMarqueeDueBody,
                },
                {
                  kind: "security",
                  title: t.visualMarqueeSecurityTitle,
                  body: t.visualMarqueeSecurityBody,
                },
                {
                  kind: "rhythm",
                  title: t.visualMarqueeRhythmTitle,
                  body: t.visualMarqueeRhythmBody,
                },
              ]}
            />
          </div>
        </section>

        <LandingDemoSection
          t={t}
          locale={locale}
          ctaHref={isAuthenticated ? "/dashboard" : "/signup"}
          ctaLabel={isAuthenticated ? t.ctaDashboard : t.ctaTrial}
        />

        {/* Fondateur + valeurs (après l’explication produit) */}
        <section id="about" className="scroll-mt-28 border-t border-slate-200 bg-slate-50 px-4 py-20 sm:px-6 sm:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal className="relative mx-auto w-full max-w-md lg:mx-0">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0a0a0a] shadow-[0_40px_100px_-40px_rgba(139,92,246,0.35),0_24px_64px_-24px_rgba(0,0,0,0.85)]">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <Image
                  src={FOUNDER_IMAGE_SRC}
                  alt={FOUNDER_NAME}
                  fill
                  className="object-contain object-bottom"
                  sizes="(max-width: 1024px) 90vw, 448px"
                  unoptimized
                />
                <div className="absolute inset-x-0 bottom-0 border-t border-white/[0.08] bg-black/55 px-5 py-4 backdrop-blur-md lg:hidden">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#34D399]/90">{t.founderKicker}</p>
                  <p className="mt-1 text-lg font-semibold text-white">{FOUNDER_NAME}</p>
                  <p className="text-sm text-slate-400">{t.founderRole}</p>
                </div>
              </div>
            </Reveal>
            <div className="min-w-0 text-left">
              <Reveal>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{t.aboutTitle}</h2>
              </Reveal>
              <Reveal className="mt-6 text-base leading-relaxed text-slate-700 sm:text-lg" delay={0.06}>
                <p>{t.aboutBody}</p>
              </Reveal>
              <Reveal className="mt-10" delay={0.1}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#34D399]">{t.aboutExpertiseTitle}</p>
                <ul className="mt-4 space-y-3">
                  {t.aboutBullets.map((line) => (
                    <li key={line} className="flex gap-3 text-sm leading-relaxed text-slate-700 sm:text-base">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.6)]"
                        aria-hidden
                      />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal className="mt-10 hidden border-t border-white/[0.08] pt-8 lg:block" delay={0.12}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{t.founderKicker}</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">{FOUNDER_NAME}</p>
                <p className="text-sm text-slate-600">{t.founderRole}</p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Section 5, Preuve sociale + stats (comptage à l’entrée viewport) */}
        <ProofStatsSection
          locale={locale}
          copy={{
            socialProof: t.socialProof,
            statsTitle: t.statsTitle,
            statsSub: t.statsSub,
            stat1Lab: t.stat1Lab,
            stat2Lab: t.stat2Lab,
            stat3Lab: t.stat3Lab,
          }}
        />

        <LandingHowSection t={t} isAuthenticated={isAuthenticated} />

        <ScrollShiftSection id={t.pricingAnchor} shift={-1} className="scroll-mt-28 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">{t.pricingTitle}</h2>
              <p className="mt-4 text-slate-600">{t.pricingSub}</p>
              <div className="mx-auto mt-8 flex max-w-md flex-col items-center gap-1">
                <div
                  role="tablist"
                  aria-label={pickQuad(locale, {
                    fr: "Choix de facturation mensuelle ou annuelle",
                    en: "Choose monthly or yearly billing",
                    nl: "Kies maandelijkse of jaarlijkse facturatie",
                    es: "Elige facturación mensual o anual",
                  })}
                  className="relative flex h-[52px] w-[min(100%,20.5rem)] shrink-0 items-stretch rounded-full border border-slate-200/95 bg-slate-100/90 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_10px_28px_-14px_rgba(15,23,42,0.18)] sm:h-14 sm:w-[21rem]"
                >
                  <motion.div
                    aria-hidden
                    className="pointer-events-none absolute inset-y-2 left-2 z-0 w-[calc(50%-0.5rem)] rounded-full bg-white shadow-[0_4px_16px_rgba(15,23,42,0.1),0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/[0.06]"
                    initial={false}
                    animate={
                      hydrated
                        ? {
                            /* 100% = exactement une demi-piste (même largeur que le thumb), aligné sur le padding p-2 */
                            x: billingCycle === "annual" ? "100%" : 0,
                          }
                        : false
                    }
                    transition={
                      reduceMotion
                        ? { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
                        : { type: "spring", stiffness: 520, damping: 34, mass: 0.72 }
                    }
                  />
                  <motion.button
                    type="button"
                    role="tab"
                    aria-selected={billingCycle === "monthly"}
                    onClick={() => setBillingCycle("monthly")}
                    whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                    className={`relative z-10 flex min-w-0 flex-1 items-center justify-center rounded-full px-1 text-sm font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 sm:text-[15px] ${
                      billingCycle === "monthly" ? "text-slate-900" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {t.pricingBillingMonthly}
                  </motion.button>
                  <motion.button
                    type="button"
                    role="tab"
                    aria-selected={billingCycle === "annual"}
                    onClick={() => setBillingCycle("annual")}
                    whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                    className={`relative z-10 flex min-w-0 flex-1 items-center justify-center rounded-full px-1 text-sm font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 sm:text-[15px] ${
                      billingCycle === "annual" ? "text-slate-900" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <span className="inline-flex max-w-full items-center justify-center gap-2 whitespace-nowrap sm:gap-2.5">
                      <span>{t.pricingBillingAnnual}</span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums tracking-tight sm:text-[11px] ${
                          billingCycle === "annual"
                            ? "bg-emerald-600 text-white shadow-sm shadow-emerald-700/20"
                            : "border border-emerald-600/20 bg-emerald-500/10 text-emerald-800"
                        }`}
                      >
                        {t.pricingAnnualSavingsBadge}
                      </span>
                    </span>
                  </motion.button>
                </div>
                <p className="mt-3 max-w-sm text-center text-xs font-semibold leading-snug text-emerald-800 sm:text-sm">
                  {t.pricingAnnualSavingsNote}
                </p>
              </div>
            </Reveal>
            <motion.div
              className="mt-16 grid gap-6 overflow-visible py-2 sm:grid-cols-2 lg:grid-cols-4"
              initial={false}
              whileInView="show"
              viewport={{ margin: "-48px", amount: 0.18, once: true }}
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.22, delayChildren: 0.1 } },
              }}
            >
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
                  <motion.div
                    key={plan.id}
                    className="group h-full"
                    variants={{
                      hidden: { opacity: 0, y: 26 },
                      show: { opacity: 1, y: 0, transition: { duration: 1.05, ease: [0.22, 1, 0.36, 1] } },
                    }}
                    whileHover={cardLiftWhileHover(reduceMotion)}
                  >
                    <motion.div className={planCardClass(highlight)} variants={CARD_LIFT_HOVER_VARIANTS}>
                    {highlight ? (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#34D399] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#041018]">
                        {t.popular}
                      </span>
                    ) : null}
                    <h3 className="text-lg font-bold text-white">{name}</h3>
                    <p className="mt-1 text-sm text-slate-400">{description}</p>
                    <p className="mt-6 flex items-baseline gap-1">
                      <span className="text-3xl font-bold tracking-tight text-white">{shownPrice}</span>
                      <span className="text-sm text-slate-500">{period}</span>
                    </p>
                    {showAnnual ? (
                      <div className="mt-2 flex items-center gap-2 text-xs sm:text-sm">
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-semibold text-emerald-300">
                          {t.pricingAnnualSavingsBadge}
                        </span>
                        <span className="text-slate-400">
                          {t.pricingAnnualOldLabel}{" "}
                          <span className="line-through decoration-slate-500/80">{annualPricing!.oldAnnual}</span>
                        </span>
                      </div>
                    ) : null}
                    <ul className="mt-6 flex-1 space-y-2.5 text-sm text-slate-300">
                      {features.map((line) => (
                        <li key={line} className="flex gap-2">
                          <span className="shrink-0" style={{ color: ACCENT }} aria-hidden>
                            ✓
                          </span>
                          {line}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-8">
                      <Link
                        href={resolvePlanCtaHref(plan.id)}
                        className={`block w-full rounded-xl py-3 text-center text-sm font-semibold transition active:scale-[0.98] ${
                          highlight
                            ? "bg-gradient-to-r from-[#34D399] to-[#6EE7B7] text-[#041018] shadow-[0_8px_28px_rgba(52,211,153,0.25)] hover:shadow-[0_12px_36px_rgba(52,211,153,0.32)]"
                            : "border border-white/15 bg-white/[0.06] text-white shadow-inner shadow-white/[0.02] backdrop-blur-sm hover:border-violet-400/30 hover:bg-white/10"
                        }`}
                      >
                        {cta}
                      </Link>
                    </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </ScrollShiftSection>

        <section id="faq" className="scroll-mt-28 border-t border-slate-200 bg-slate-50 px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <Reveal className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{t.faqTitle}</h2>
            </Reveal>
            <Reveal className="mx-auto mt-3 max-w-xl text-center text-slate-600" delay={0.05}>
              <p>{t.faqSub}</p>
            </Reveal>
            <motion.div
              className="mt-12 space-y-3"
              initial={false}
              whileInView="show"
              viewport={{ margin: "-24px", amount: 0.2 }}
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
              }}
            >
              {t.faqItems.map((item) => (
                <motion.div
                  key={item.q}
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
                  }}
                >
                  <details className="group rounded-2xl border border-white/10 bg-[#071528]/75 px-4 py-1 shadow-lg shadow-black/20 backdrop-blur-md open:border-white/18 open:bg-[#071528]/90 [&_summary]:cursor-pointer">
                  <summary className="flex list-none items-center justify-between gap-3 py-3 text-sm font-semibold text-white outline-none ring-offset-2 ring-offset-[#06101f] focus-visible:ring-2 focus-visible:ring-[#34D399]/70 [&::-webkit-details-marker]:hidden">
                    <span>{item.q}</span>
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-slate-400 transition group-open:rotate-45 group-open:border-[#34D399]/40 group-open:text-[#34D399]"
                      aria-hidden
                    >
                      +
                    </span>
                  </summary>
                  <p className="border-t border-white/10 pb-4 pt-2 text-sm leading-relaxed text-slate-400">{item.a}</p>
                  </details>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-white px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <Reveal className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Persona</p>
              <h2 className="mt-3 text-xl font-bold text-slate-900 sm:text-2xl">{t.personaTitle}</h2>
            </Reveal>
            <Reveal className="mx-auto mt-6 max-w-2xl" delay={0.06}>
              <blockquote className="rounded-r-xl border-l-[3px] border-[#34D399] bg-slate-50 py-4 pl-5 pr-4 text-left text-base italic leading-relaxed text-slate-800 sm:text-lg">
                {t.personaQuote}
              </blockquote>
            </Reveal>
            <motion.div
              className="mt-12 grid gap-6 overflow-visible py-2 sm:grid-cols-2"
              initial={false}
              whileInView="show"
              viewport={{ margin: "-40px", amount: 0.2 }}
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
              }}
            >
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
                }}
                className="group h-full"
                whileHover={cardLiftWhileHover(reduceMotion)}
              >
                <motion.div
                  className="relative h-full overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-[#1a0a14]/95 via-[#06101f]/90 to-[#0a0510]/95 p-6 shadow-lg shadow-black/30 backdrop-blur-md transition-[box-shadow,border-color] duration-200 ease-out group-hover:border-rose-400/32 group-hover:shadow-[0_20px_44px_-12px_rgba(0,0,0,0.5),0_0_36px_-10px_rgba(244,63,94,0.18)]"
                  variants={CARD_LIFT_HOVER_VARIANTS}
                >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-rose-500/12 blur-3xl"
                />
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-rose-400/30 bg-rose-500/15 text-rose-300">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    </svg>
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-300">{t.beforeTitle}</p>
                </div>
                <ul aria-hidden className="mt-4 space-y-1.5 rounded-xl border border-rose-500/12 bg-black/30 p-3">
                  {t.beforeRows.map((row, i) => (
                    <li
                      key={`b-${i}`}
                      className="flex items-center justify-between gap-2 text-[11px] sm:text-xs"
                    >
                      <span className={`min-w-0 flex-1 truncate ${i === 1 ? "text-slate-500 line-through" : i === 2 ? "italic text-slate-500" : "text-slate-400"}`}>
                        {row.name}
                      </span>
                      <span className="shrink-0 tabular-nums text-slate-500">{row.amount}</span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          i === 0
                            ? "bg-rose-500/18 text-rose-200 ring-1 ring-rose-400/30"
                            : i === 1
                              ? "bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/25"
                              : "bg-slate-700/40 text-slate-400 ring-1 ring-slate-600/40"
                        }`}
                      >
                        {row.state}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm leading-relaxed text-slate-300">{t.beforeBody}</p>
                </motion.div>
              </motion.div>
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
                }}
                className="group h-full"
                whileHover={cardLiftWhileHover(reduceMotion)}
              >
                <motion.div
                  className="relative h-full overflow-hidden rounded-2xl border border-[#34D399]/30 bg-gradient-to-br from-[#062018]/95 via-[#0a1f35]/90 to-[#06101f]/95 p-6 shadow-[0_16px_40px_-12px_rgba(52,211,153,0.18)] backdrop-blur-md transition-[box-shadow,border-color] duration-200 ease-out group-hover:border-[#34D399]/55 group-hover:shadow-[0_22px_48px_-10px_rgba(52,211,153,0.22),0_0_40px_-8px_rgba(139,92,246,0.14)]"
                  variants={CARD_LIFT_HOVER_VARIANTS}
                >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#34D399]/14 blur-3xl"
                />
                <div className="flex items-center gap-2.5">
                  <span
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#34D399]/40 bg-[#34D399]/15"
                    style={{ color: ACCENT }}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: ACCENT }}>
                    {t.afterTitle}
                  </p>
                </div>
                <ul aria-hidden className="mt-4 space-y-1.5 rounded-xl border border-[#34D399]/15 bg-black/30 p-3">
                  {t.afterRows.map((row, i) => (
                    <li
                      key={`a-${i}`}
                      className="flex items-center justify-between gap-2 text-[11px] sm:text-xs"
                    >
                      <span className="min-w-0 flex-1 truncate text-slate-200">{row.name}</span>
                      <span className="shrink-0 font-semibold tabular-nums" style={{ color: ACCENT }}>
                        {row.amount}
                      </span>
                      <span
                        className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          row.kind === "paid"
                            ? "bg-[#34D399]/18 text-emerald-200 ring-1 ring-[#34D399]/40"
                            : row.kind === "scheduled"
                              ? "bg-violet-500/18 text-violet-200 ring-1 ring-violet-400/35"
                              : "bg-sky-500/15 text-sky-200 ring-1 ring-sky-400/30"
                        }`}
                      >
                        <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden>
                          {row.kind === "scheduled" ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          )}
                        </svg>
                        {row.state}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm leading-relaxed text-slate-200">{t.afterBody}</p>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-slate-50 px-4 py-18 sm:px-6">
          <Reveal className="relative mx-auto flex max-w-4xl flex-col items-center overflow-hidden rounded-3xl border border-white/70 bg-white px-6 py-12 text-center shadow-[0_22px_56px_-24px_rgba(15,23,42,0.18)]">
            {/* Halos de marque, mint, gauche et violet, droite, sans animation lourde */}
            <div
              aria-hidden
              className="pointer-events-none absolute -left-24 -top-20 h-80 w-80 rounded-full opacity-70"
              style={{
                background: "radial-gradient(circle at 50% 50%, rgba(52,211,153,0.32), transparent 65%)",
                filter: "blur(28px)",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full opacity-80"
              style={{
                background: "radial-gradient(circle at 50% 50%, rgba(139,92,246,0.36), transparent 65%)",
                filter: "blur(30px)",
              }}
            />
            {/* Liseré de marque, dégradé du logo */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
              style={{
                background: "linear-gradient(90deg, #34D399 0%, #6EE7B7 18%, #C4B5FD 60%, #8B5CF6 100%)",
              }}
            />
            <div className="relative z-10 flex flex-col items-center px-2">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{t.finalCtaTitle}</h2>
              <div className="mt-8 flex w-full max-w-2xl flex-col items-stretch gap-4 sm:flex-row sm:justify-center sm:gap-5">
                <motion.div
                  className="inline-flex w-full sm:w-auto sm:min-w-[220px]"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 380, damping: 24 }}
                >
                  <Link
                    href={isAuthenticated ? "/dashboard" : "/signup"}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-8 py-4 text-sm font-semibold text-white shadow-[0_20px_50px_-12px_rgba(37,99,235,0.55),0_0_0_1px_rgba(255,255,255,0.08)_inset] transition hover:bg-[#1d4ed8] hover:shadow-[0_24px_56px_-10px_rgba(29,78,216,0.5)] sm:w-auto"
                  >
                    {t.finalCtaButton}
                    <svg className="h-4 w-4 shrink-0 opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H9M17 7v8" />
                    </svg>
                  </Link>
                </motion.div>
                <motion.div
                  className="inline-flex w-full sm:w-auto sm:min-w-[200px]"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 380, damping: 24 }}
                >
                  <Link
                    href="/contact"
                    className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-8 py-4 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-md transition hover:border-slate-400 hover:bg-slate-50 sm:w-auto"
                  >
                    {t.howCtaContact}
                  </Link>
                </motion.div>
              </div>
            </div>
          </Reveal>
        </section>

        <footer className="border-t border-slate-200 bg-white px-4 py-12 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-2">
              <PayPulseLogo className="h-9 w-9 shrink-0 text-[#34D399]" />
              <span className="font-semibold text-slate-900">PayPulss</span>
            </div>
            <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
              <div>
                <p className="font-semibold text-slate-400">{t.footerProduct}</p>
                <ul className="mt-3 space-y-2 text-slate-500">
                  <li>
                    <a href="#features" className="transition hover:text-[#34D399]">
                      {t.footerLinks.features}
                    </a>
                  </li>
                  <li>
                    <a href={`#${t.demoAnchor}`} className="transition hover:text-[#34D399]">
                      {t.footerLinks.preview}
                    </a>
                  </li>
                  <li>
                    <a href={`#${t.pricingAnchor}`} className="transition hover:text-[#34D399]">
                      {t.footerLinks.pricing}
                    </a>
                  </li>
                  <li>
                    <a href="#faq" className="transition hover:text-[#34D399]">
                      {t.footerLinks.faq}
                    </a>
                  </li>
                  <li>
                    <a href="#about" className="transition hover:text-[#34D399]">
                      {t.footerLinks.about}
                    </a>
                  </li>
                  <li>
                    <a href="#product-tour" className="transition hover:text-[#34D399]">
                      {t.footerLinks.footerProductTour}
                    </a>
                  </li>
                  <li>
                    <a href="#how" className="transition hover:text-[#34D399]">
                      {t.footerLinks.footerHowLink}
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-400">{t.footerCompany}</p>
                <ul className="mt-3 space-y-2 text-slate-500">
                  <li>
                    <Link href="/a-propos" className="transition hover:text-[#34D399]">
                      {t.footerLinks.founder}
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="transition hover:text-[#34D399]">
                      {t.footerLinks.contact}
                    </Link>
                  </li>
                  <li>
                    <a
                      href="mailto:contact@paypulss.com?subject=Contact%20Paypulss"
                      className="transition hover:text-[#34D399]"
                    >
                      {t.footerLinks.contactEmail}
                    </a>
                  </li>
                  <li>
                    <span className="cursor-default">{t.footerLinks.careers}</span>
                  </li>
                </ul>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="font-semibold text-slate-400">{t.footerLegal}</p>
                <ul className="mt-3 space-y-2 text-slate-500">
                  <li>
                    <Link href="/legal" className="transition hover:text-[#34D399]">
                      {t.footerLinks.legalHub}
                    </Link>
                  </li>
                  <li>
                    <Link href="/mentions-legales" className="transition hover:text-[#34D399]">
                      {t.footerLinks.mentions}
                    </Link>
                  </li>
                  <li>
                    <Link href="/droits-securite-donnees" className="transition hover:text-[#34D399]">
                      {t.footerLinks.security}
                    </Link>
                  </li>
                  <li>
                    <Link href="/confidentialite" className="transition hover:text-[#34D399]">
                      {t.footerLinks.privacy}
                    </Link>
                  </li>
                  <li>
                    <Link href="/conditions-utilisation" className="transition hover:text-[#34D399]">
                      {t.footerLinks.terms}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <p className="mx-auto mt-10 max-w-6xl text-center text-xs text-slate-600">
            © {new Date().getFullYear()} PayPulss
          </p>
        </footer>
      </main>
    </div>
  );
}
