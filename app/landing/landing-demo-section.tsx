"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { Reveal } from "@/app/landing/landing-motion";
import { LandingFeaturePreview, LANDING_PREVIEW_FRAME_CLASS } from "@/app/landing/landing-feature-preview";
import { LandingFeatureTabIcon } from "@/app/landing/landing-feature-tab-icon";
import { LandingRecurringCycleVisual } from "@/app/landing/landing-recurring-cycle-visual";
import type { LandingCopy } from "@/lib/messages/landing-copy";
import type { AppLocale } from "@/lib/app-locale";
import type { UiResolvedAppearance } from "@/lib/ui-theme";
import { useHydrated } from "@/lib/use-hydrated";

const AUTO_ADVANCE_MS = 5500;

type TourKind = LandingCopy["demoTourSteps"][number]["kind"];
type PreviewKind = Exclude<TourKind, "recurring">;

function isPreviewKind(kind: TourKind): kind is PreviewKind {
  return kind !== "recurring";
}

export function LandingDemoSection({
  t,
  locale,
  ctaHref,
  ctaLabel,
}: {
  t: LandingCopy;
  locale: AppLocale;
  ctaHref: string;
  ctaLabel: string;
}) {
  const hydrated = useHydrated();
  const slides = t.demoTourSteps;
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [appearance, setAppearance] = useState<UiResolvedAppearance>("dark");

  const activeSlide = slides[activeIndex] ?? slides[0];
  const activeKind = activeSlide?.kind ?? "clients";

  const stopAutoPlay = useCallback(() => {
    setAutoPlay(false);
  }, []);

  const goTo = useCallback(
    (index: number) => {
      stopAutoPlay();
      setActiveIndex(index);
    },
    [stopAutoPlay],
  );

  useEffect(() => {
    if (!hydrated || !autoPlay || slides.length <= 1) return;
    const id = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % slides.length);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [hydrated, autoPlay, slides.length]);

  const toggleAppearance = () => {
    stopAutoPlay();
    setAppearance((a) => (a === "dark" ? "light" : "dark"));
  };

  return (
    <section
      id={t.demoAnchor}
      className="relative scroll-mt-28 overflow-hidden bg-bg-dark text-white"
    >
      <div className="pp-landing-ambient pointer-events-none absolute inset-0 min-h-full" aria-hidden>
        <div
          className="pp-landing-ambient__blob left-[-10%] top-[6%] h-[min(440px,75vw)] w-[min(440px,75vw)]"
          style={{
            background:
              "radial-gradient(circle, rgba(124,58,237,0.5) 0%, rgba(99,102,241,0.22) 42%, transparent 72%)",
            opacity: 0.65,
          }}
        />
        <div
          className="pp-landing-ambient__blob pp-landing-ambient__blob--2 right-[-6%] top-[28%] h-[min(360px,68vw)] w-[min(360px,68vw)]"
          style={{
            background:
              "radial-gradient(circle, rgba(52,211,153,0.4) 0%, rgba(16,185,129,0.18) 45%, transparent 74%)",
            opacity: 0.55,
          }}
        />
        <div
          className="absolute left-1/2 top-[42%] h-[min(480px,85vw)] w-[min(760px,96vw)] -translate-x-1/2 -translate-y-1/2 rounded-[42%] opacity-60"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(167,139,250,0.32) 0%, rgba(59,130,246,0.14) 44%, transparent 70%)",
            filter: "blur(52px)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <Reveal className="text-center">
          <p className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300/95 backdrop-blur-sm">
            {t.demoKicker}
          </p>
          <h2 className="mt-5 font-semibold tracking-tight [font-size:clamp(1.75rem,4.5vw,2.75rem)] [line-height:1.12]">
            <span className="block text-white">{t.demoTitle}</span>
          </h2>
        </Reveal>
        <Reveal className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-slate-300 sm:text-base" delay={0.05}>
          <p>{t.demoSub}</p>
        </Reveal>

        {/* Pastilles : une page d’explication par boule */}
        <div
          className="mt-8 flex justify-center gap-2 sm:mt-10"
          role="tablist"
          aria-label={t.demoDotsAria}
        >
          {slides.map((slide, index) => {
            const selected = index === activeIndex;
            return (
              <button
                key={slide.kind}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-label={`${slide.step}. ${slide.title}`}
                onClick={() => goTo(index)}
                className={`rounded-full transition-all duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400/80 ${
                  selected ? "h-2.5 w-8 bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.55)]" : "h-2.5 w-2.5 bg-white/30 hover:bg-white/55"
                }`}
              />
            );
          })}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeIndex}
            initial={hydrated ? { opacity: 0, y: 10 } : false}
            animate={{ opacity: 1, y: 0 }}
            exit={hydrated ? { opacity: 0, y: -8 } : undefined}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-center sm:mt-8"
          >
            <h3 className="text-lg font-semibold text-white sm:text-xl">{activeSlide?.title}</h3>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">{activeSlide?.body}</p>
            {activeKind === "recurring" ? (
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">{t.recurringBody}</p>
            ) : null}
          </motion.div>
        </AnimatePresence>

        <div className="mt-10 grid gap-8 lg:mt-12 lg:grid-cols-[minmax(0,17.5rem)_1fr] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,19rem)_1fr]">
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5 lg:flex lg:flex-col lg:gap-3" aria-label={t.demoTourAria}>
            {slides.map((step, index) => {
              const selected = index === activeIndex;
              return (
                <button
                  key={step.kind}
                  id={`demo-tab-${step.kind}`}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => goTo(index)}
                  className={`group flex min-h-[5.25rem] flex-col rounded-xl border px-3 py-3 text-left transition duration-200 sm:min-h-[5.5rem] lg:min-h-0 lg:flex-row lg:items-start lg:gap-3 lg:px-4 lg:py-4 ${
                    selected
                      ? "border-emerald-400/50 bg-white/[0.08] shadow-[0_0_32px_-8px_rgba(52,211,153,0.45)] ring-1 ring-emerald-400/25"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      selected ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-slate-400"
                    }`}
                    aria-hidden
                  >
                    {step.step}
                  </span>
                  <span className="mt-2 flex min-w-0 flex-1 flex-col gap-1 lg:mt-0">
                    <span className="flex items-center gap-2">
                      <LandingFeatureTabIcon
                        kind={step.kind}
                        className={`h-4 w-4 shrink-0 ${selected ? "text-emerald-300" : "text-slate-400 group-hover:text-slate-300"}`}
                      />
                      <span className={`text-xs font-semibold leading-snug sm:text-sm ${selected ? "text-white" : "text-slate-200"}`}>
                        {step.title}
                      </span>
                    </span>
                    <span className="hidden text-xs leading-relaxed text-slate-400 lg:line-clamp-3 lg:block">{step.body}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="min-w-0" onPointerDown={stopAutoPlay}>
            <AnimatePresence mode="wait" initial={false}>
              {activeKind === "recurring" ? (
                <motion.div
                  key="recurring"
                  initial={hydrated ? { opacity: 0, y: 8 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={hydrated ? { opacity: 0, y: -6 } : undefined}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  role="tabpanel"
                  aria-labelledby={`demo-tab-recurring`}
                  className="mx-auto w-full max-w-md lg:max-w-none"
                >
                  <LandingRecurringCycleVisual t={t} />
                </motion.div>
              ) : (
                <motion.div
                  key={`${activeKind}-${appearance}`}
                  initial={hydrated ? { opacity: 0, y: 8 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={hydrated ? { opacity: 0, y: -6 } : undefined}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  role="tabpanel"
                  aria-labelledby={`demo-tab-${activeKind}`}
                  className={`overflow-hidden rounded-2xl border border-white/15 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.65),0_0_60px_-16px_rgba(139,92,246,0.35)] ring-1 ring-white/10 backdrop-blur-xl sm:rounded-3xl ${LANDING_PREVIEW_FRAME_CLASS}`}
                >
                  {isPreviewKind(activeKind) ? (
                    <LandingFeaturePreview
                      tab={activeKind}
                      locale={locale}
                      appearance={appearance}
                      onToggleAppearance={toggleAppearance}
                    />
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <Reveal className="mt-12 flex flex-col items-center gap-3 sm:mt-14" delay={0.08}>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href={ctaHref}
              onClick={stopAutoPlay}
              className="inline-flex items-center justify-center rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition hover:bg-violet-700"
            >
              {ctaLabel}
            </Link>
          </motion.div>
          <p className="text-xs text-slate-500">{t.microNoCard}</p>
        </Reveal>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-28 bg-gradient-to-t from-bg-alt via-bg-alt/80 to-transparent sm:h-36"
        aria-hidden
      />
    </section>
  );
}
