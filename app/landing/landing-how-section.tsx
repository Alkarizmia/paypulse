"use client";

import Link from "next/link";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent,
  type RefObject,
} from "react";
import { usePreferMinimalMotion } from "@/lib/use-prefer-minimal-motion";
import { useHydrated } from "@/lib/use-hydrated";
import type { LandingCopy } from "@/lib/messages/landing-copy";
import { CARD_LIFT_HOVER_VARIANTS, cardLiftWhileHover } from "@/app/landing/landing-motion";

type HowStep = LandingCopy["howFlowSteps"][number];

function scrollToPageHash(href: string) {
  const id = href.startsWith("#") ? href.slice(1) : "";
  if (!id) return false;
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.pushState(null, "", href);
  return true;
}

function subscribeCompactHow(onStoreChange: () => void) {
  const mq = window.matchMedia("(max-width: 767px)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getCompactHow() {
  return window.matchMedia("(max-width: 767px)").matches;
}

function useCompactHow() {
  return useSyncExternalStore(subscribeCompactHow, getCompactHow, () => true);
}

function HowArrow({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  if (compact) {
    return (
      <div className={`flex shrink-0 items-center justify-center text-slate-300 ${className}`} aria-hidden>
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </div>
    );
  }
  return (
    <div className={`flex shrink-0 items-center justify-center text-slate-300 ${className}`} aria-hidden>
      <svg className="h-9 w-9 sm:h-11 sm:w-11 lg:h-12 lg:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
      </svg>
    </div>
  );
}

function HowStepBullets({ items, compact = false }: { items: readonly string[]; compact?: boolean }) {
  return (
    <ul className={`border-t border-slate-100 ${compact ? "mt-3 space-y-2 pt-3" : "mt-4 space-y-2.5 pt-4"}`}>
      {items.map((item) => (
        <li key={item} className={`flex gap-2 leading-snug text-slate-600 ${compact ? "text-xs" : "gap-2.5 text-sm"}`}>
          <span
            className={`flex shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 ${compact ? "mt-0.5 h-4 w-4" : "mt-0.5 h-5 w-5"}`}
            aria-hidden
          >
            <svg className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2.2}>
              <path d="M2.5 6.2 4.8 8.5 9.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function HowStepCard({
  step,
  idx,
  concernLabel,
  reduceMotion,
  compact = false,
  className = "",
}: {
  step: HowStep;
  idx: number;
  concernLabel: string;
  reduceMotion: boolean;
  compact?: boolean;
  className?: string;
}) {
  return (
    <motion.article
      className={`pp-how-step-card flex shrink-0 snap-center flex-col ${className}`.trim()}
      whileHover={compact ? undefined : cardLiftWhileHover(reduceMotion)}
    >
      <motion.div
        className={`pp-how-step-card__panel flex flex-col rounded-2xl border border-slate-200 bg-white shadow-[0_14px_40px_-28px_rgba(15,23,42,0.14)] transition-[box-shadow,border-color] duration-200 ease-out ${
          compact
            ? "p-4 hover:border-violet-300/50"
            : "p-6 shadow-[0_18px_48px_-30px_rgba(15,23,42,0.16)] hover:border-violet-400/35 hover:shadow-[0_24px_52px_-26px_rgba(139,92,246,0.22)] sm:min-h-[22rem] sm:p-7 lg:min-h-[24rem] lg:rounded-3xl lg:p-8"
        }`}
        variants={compact ? undefined : CARD_LIFT_HOVER_VARIANTS}
      >
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span
            className={`inline-flex items-center justify-center rounded-full bg-slate-900 font-bold text-white ${
              compact ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm lg:h-11 lg:w-11 lg:text-base"
            }`}
          >
            {idx + 1}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{concernLabel}</span>
          <span
            className={`rounded-full border border-violet-200 bg-violet-50 font-bold text-violet-800 ${
              compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-0.5 text-xs sm:text-sm"
            }`}
          >
            {step.whoLabel}
          </span>
        </div>
        <h3
          className={`font-semibold tracking-tight text-slate-900 ${
            compact ? "mt-3 text-base leading-snug" : "mt-4 text-xl sm:mt-4 sm:text-2xl lg:mt-5"
          }`}
        >
          {step.headline}
        </h3>
        <p className={`mt-1.5 font-medium leading-relaxed text-violet-700/90 ${compact ? "text-xs" : "mt-2 text-sm sm:text-[0.9375rem]"}`}>
          {step.whoHint}
        </p>
        <p className={`leading-relaxed text-slate-600 ${compact ? "mt-2 text-xs" : "mt-3 text-sm sm:text-base"}`}>{step.body}</p>
        <HowStepBullets items={step.bullets} compact={compact} />
      </motion.div>
    </motion.article>
  );
}

function HowSectionHeader({
  t,
  hintOpacity,
  hintText,
  compact = false,
}: {
  t: LandingCopy;
  hintOpacity?: MotionValue<number>;
  hintText: string;
  compact?: boolean;
}) {
  return (
    <header
      className={`shrink-0 text-center ${compact ? "px-4 pb-2 pt-6 sm:px-6" : "px-4 pb-3 pt-5 sm:px-6 sm:pb-4 sm:pt-7 lg:pb-3 lg:pt-6"}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600/90">{t.howKicker}</p>
      <h2 className={`mt-2 font-bold tracking-tight text-slate-900 ${compact ? "text-xl" : "text-2xl sm:text-3xl lg:text-[2rem]"}`}>
        {t.howTitle}
      </h2>
      <p
        className={`mx-auto leading-relaxed text-slate-600 ${compact ? "mt-2 max-w-[20rem] text-xs" : "mt-2 max-w-3xl text-sm sm:mt-3 sm:text-base"}`}
      >
        {t.howSubtitle}
      </p>
      {hintOpacity ? (
        <motion.p className="mx-auto mt-2 max-w-lg text-xs text-slate-500 sm:text-sm" style={{ opacity: hintOpacity }}>
          {hintText}
        </motion.p>
      ) : (
        <p className="mx-auto mt-2 max-w-lg text-xs font-medium text-violet-600/80">{hintText}</p>
      )}
    </header>
  );
}

function HowSectionCtas({
  t,
  isAuthenticated,
  onDemoClick,
  compact = false,
}: {
  t: LandingCopy;
  isAuthenticated: boolean;
  onDemoClick: (e: MouseEvent<HTMLAnchorElement>) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex shrink-0 justify-center border-t border-slate-200/80 bg-gradient-to-t from-slate-50/95 to-white/80 backdrop-blur-sm ${
        compact ? "flex-col gap-2.5 px-4 py-5 sm:px-6" : "flex-wrap gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5"
      }`}
    >
      <Link
        href={isAuthenticated ? "/dashboard" : "/signup"}
        className={`pp-hero-cta inline-flex items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white shadow-lg hover:bg-slate-800 ${
          compact ? "w-full px-6 py-3.5" : "px-6 py-3 sm:px-8 sm:py-3.5"
        }`}
      >
        {t.howCtaSignup}
      </Link>
      <a
        href={`#${t.demoAnchor}`}
        onClick={onDemoClick}
        className={`pp-hero-cta inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-800 hover:bg-slate-50 ${
          compact ? "w-full px-6 py-3.5" : "px-6 py-3 sm:px-8 sm:py-3.5"
        }`}
      >
        {t.howCtaDemo}
      </a>
      <Link
        href="/contact"
        className={`pp-hero-cta inline-flex items-center justify-center rounded-xl border border-violet-200 bg-violet-50 text-sm font-semibold text-violet-900 hover:border-violet-300 hover:bg-violet-100 ${
          compact ? "w-full px-6 py-3.5" : "px-6 py-3 sm:px-8 sm:py-3.5"
        }`}
      >
        {t.howCtaContact}
      </Link>
    </div>
  );
}

function HowProgressDots({ progress, count }: { progress: MotionValue<number>; count: number }) {
  const indices = Array.from({ length: count }, (_, i) => i);
  return (
    <div className="flex shrink-0 justify-center gap-2.5 pb-2 pt-0.5" aria-hidden>
      {indices.map((i) => (
        <HowProgressDot key={i} index={i} count={count} progress={progress} />
      ))}
    </div>
  );
}

function HowProgressDot({
  index,
  count,
  progress,
}: {
  index: number;
  count: number;
  progress: MotionValue<number>;
}) {
  const width = useTransform(progress, (p) => {
    const slot = 1 / count;
    const start = index * slot;
    const end = (index + 1) * slot;
    if (p <= start) return "0.4rem";
    if (p >= end) return index === count - 1 ? "2.25rem" : "0.4rem";
    const t = (p - start) / slot;
    return `${0.4 + t * 1.85}rem`;
  });
  const opacity = useTransform(progress, (p) => {
    const center = (index + 0.5) / count;
    return 0.35 + Math.max(0, 1 - Math.abs(p - center) * count * 1.2) * 0.65;
  });

  return (
    <motion.span
      className="h-2 rounded-full bg-violet-500"
      style={{ width, opacity }}
    />
  );
}

function HowStepsTrack({
  t,
  reduce,
  compact = false,
  trackRef,
  x,
}: {
  t: LandingCopy;
  reduce: boolean;
  compact?: boolean;
  trackRef?: RefObject<HTMLDivElement | null>;
  x?: MotionValue<number>;
}) {
  const items = t.howFlowSteps.flatMap((step, idx) => {
    const card = (
      <HowStepCard
        key={step.headline}
        step={step}
        idx={idx}
        concernLabel={t.howConcernLabel}
        reduceMotion={reduce}
        compact={compact}
      />
    );
    if (idx === t.howFlowSteps.length - 1) return [card];
    return [
      card,
      <HowArrow key={`arrow-${idx}`} compact={compact} className={compact ? "w-6 self-center" : "w-12 self-center sm:w-16 lg:w-20"} />,
    ];
  });

  const trackClass = compact
    ? "flex items-start gap-3 pl-4 pr-4 will-change-transform"
    : "flex items-stretch gap-4 pl-4 pr-[max(1rem,6vw)] will-change-transform sm:gap-6 sm:pl-6 sm:pr-[max(1.5rem,8vw)] lg:gap-10 lg:pl-8";

  if (x !== undefined && trackRef) {
    return (
      <motion.div ref={trackRef} className={trackClass} style={{ x }}>
        {items}
      </motion.div>
    );
  }

  return <div className={trackClass}>{items}</div>;
}

function HowSectionMobile({ t, isAuthenticated }: { t: LandingCopy; isAuthenticated: boolean }) {
  const reduce = usePreferMinimalMotion();
  const onDemoClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (scrollToPageHash(`#${t.demoAnchor}`)) e.preventDefault();
  };

  return (
    <section
      id="how"
      className="scroll-mt-24 overflow-x-clip border-t border-slate-200 bg-gradient-to-b from-white to-slate-50/80"
    >
      <HowSectionHeader t={t} hintText={t.howSwipeHint} compact />
      <div className="pp-how-fallback-wrap mx-auto max-w-[100vw]">
        <div
          className="pp-how-fallback-track flex overflow-x-auto overscroll-x-contain px-0 pb-6 pt-1 snap-x snap-mandatory scroll-smooth"
          role="region"
          aria-label={t.howTitle}
        >
          <HowStepsTrack t={t} reduce={reduce} compact />
        </div>
      </div>
      <HowSectionCtas t={t} isAuthenticated={isAuthenticated} onDemoClick={onDemoClick} compact />
    </section>
  );
}

function HowSectionScrollPin({ t, isAuthenticated }: { t: LandingCopy; isAuthenticated: boolean }) {
  const reduce = usePreferMinimalMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [maxShift, setMaxShift] = useState(0);
  const [railHeight, setRailHeight] = useState(1600);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const viewportW = window.innerWidth;
    const trackW = track.scrollWidth;
    const shift = Math.max(0, trackW - viewportW + 64);
    const vh = window.innerHeight || 800;
    setMaxShift(shift);
    setRailHeight(Math.round(vh + shift * 1.08 + vh * 0.32));
  }, []);

  useLayoutEffect(() => {
    measure();
    const track = trackRef.current;
    if (!track) return;
    const ro = new ResizeObserver(() => requestAnimationFrame(measure));
    ro.observe(track);
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, t.howFlowSteps]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const x = useTransform(scrollYProgress, [0, 1], [0, -maxShift]);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.1, 0.25], [1, 0.55, 0]);

  const onDemoClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (scrollToPageHash(`#${t.demoAnchor}`)) e.preventDefault();
  };

  return (
    <section
      id="how"
      ref={sectionRef}
      className="pp-how-scroll-pin relative scroll-mt-28 border-t border-slate-200 bg-gradient-to-b from-white to-slate-50/80"
      style={{ height: railHeight }}
      aria-label={t.howTitle}
    >
      <div className="sticky top-0 flex h-[100dvh] min-h-[100svh] flex-col overflow-hidden">
        <HowSectionHeader t={t} hintText={t.howScrollHint} hintOpacity={hintOpacity} />
        <HowProgressDots progress={scrollYProgress} count={t.howFlowSteps.length} />

        <div className="relative min-h-0 flex-1">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
            <HowStepsTrack t={t} reduce={reduce} trackRef={trackRef} x={x} />
          </div>
        </div>

        <HowSectionCtas t={t} isAuthenticated={isAuthenticated} onDemoClick={onDemoClick} />
      </div>
    </section>
  );
}

export function LandingHowSection({ t, isAuthenticated }: { t: LandingCopy; isAuthenticated: boolean }) {
  const hydrated = useHydrated();
  const reduce = usePreferMinimalMotion();
  const compact = useCompactHow();

  if (!hydrated) {
    return <HowSectionMobile t={t} isAuthenticated={isAuthenticated} />;
  }

  if (compact || reduce) {
    return <HowSectionMobile t={t} isAuthenticated={isAuthenticated} />;
  }

  return <HowSectionScrollPin t={t} isAuthenticated={isAuthenticated} />;
}
