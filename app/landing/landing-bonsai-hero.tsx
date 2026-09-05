"use client";

/* eslint-disable @next/next/no-img-element -- Portraits hero locaux (public/landing). */

import Link from "next/link";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { PayPulseLogo } from "@/app/dashboard/pay-pulse-logo";
import type { LandingCopy } from "@/lib/messages/landing-copy";
import type { AppLocale } from "@/lib/app-locale";
import { getScrollPinCopy, HERO_FACE_SRCS, type ScrollPinCopy } from "@/lib/messages/scroll-pin-copy";
import { PwaInstallButton } from "@/app/pwa-install-button";
import { usePreferMinimalMotion } from "@/lib/use-prefer-minimal-motion";
import { useLandingLiteMotion, useLandingScrollEffects } from "@/lib/use-landing-viewport";
import { useHydrated } from "@/lib/use-hydrated";
import { LandingCursorLine } from "@/app/landing/landing-cursor-line";

/** Même fond que la landing (`#f8fafc`) pour éviter les lignes de couture au scroll. */
const PIN_SURFACE = "#f8fafc";

const EASE = [0.22, 1, 0.36, 1] as const;

const HOVER_SPRING = { type: "spring" as const, stiffness: 420, damping: 24 };

function heroHoverScale(reduce: boolean, scale = 1.04) {
  return reduce ? undefined : { scale, transition: HOVER_SPRING };
}

function scrollToPageHash(href: string) {
  const id = href.startsWith("#") ? href.slice(1) : "";
  if (!id) return false;
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.pushState(null, "", href);
  return true;
}

function HeroCtaLink({
  href,
  className,
  children,
  onNavigate,
}: {
  href: string;
  className: string;
  children: ReactNode;
  onNavigate?: (e: MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <Link href={href} className={`pp-hero-cta ${className}`} onClick={onNavigate}>
      {children}
    </Link>
  );
}

/**
 * 2 animations seulement (0 → 0.5 du scroll), puis état final figé (0.5 → 1).
 * Anim 1 : dézoom carte + montant. Anim 2 : décomposition complète.
 */
const P = {
  heroOut: 0.1,
  zoomStart: 0.08,
  zoomEnd: 0.28,
  decomposeStart: 0.28,
  decomposeEnd: 0.5,
  holdFrom: 0.5,
} as const;

/** Sticky 100vh + ~95vh de scroll utile (pas de zone vide après l’état final). */
function useHeroRailHeightPx() {
  const [px, setPx] = useState(1400);
  const measure = useCallback(() => {
    if (typeof window === "undefined") return;
    const h = window.innerHeight || 800;
    const scrollTrack = Math.round(h * 0.95);
    setPx(h + scrollTrack);
  }, []);
  useLayoutEffect(() => {
    measure();
  }, [measure]);
  useEffect(() => {
    const onResize = () => requestAnimationFrame(measure);
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, [measure]);
  return px;
}

function StarRow() {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-400" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

/** Décalage entre chaque vague d’apparition du hero (s). */
const HERO_REVEAL_STAGGER_S = 0.34;
const HERO_REVEAL_DURATION_S = 1.45;

function HeroRevealStep({
  step,
  children,
  className = "",
}: {
  step: 0 | 1 | 2 | 3;
  children: ReactNode;
  className?: string;
}) {
  const reduce = usePreferMinimalMotion();
  const lite = useLandingLiteMotion();
  const hydrated = useHydrated();
  if (reduce || !hydrated) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={`${lite ? "" : "will-change-[transform,filter,opacity]"} ${className}`.trim()}
      initial={{ opacity: 0, y: lite ? 22 : 36, filter: lite ? "blur(0px)" : "blur(24px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{
        duration: HERO_REVEAL_DURATION_S,
        delay: step * HERO_REVEAL_STAGGER_S,
        ease: EASE,
      }}
    >
      {children}
    </motion.div>
  );
}

function HeroCopyBlock({
  t,
  isAuthenticated,
  primaryHref,
  secondaryHref,
  className = "",
}: {
  t: LandingCopy;
  isAuthenticated: boolean;
  primaryHref: string;
  secondaryHref: string;
  className?: string;
}) {
  const onSecondaryClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (scrollToPageHash(secondaryHref)) e.preventDefault();
  };

  return (
    <div className={`relative z-20 text-center ${className}`}>
      <HeroRevealStep step={0}>
        <p className="text-sm font-medium text-slate-600">{t.heroWelcome}</p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <PayPulseLogo className="h-8 w-8 sm:h-9 sm:w-9" />
          <span className="text-sm font-semibold tracking-tight text-slate-900">PayPulss</span>
        </div>
      </HeroRevealStep>

      <HeroRevealStep step={1}>
        <h1 className="mx-auto mt-4 max-w-3xl font-semibold tracking-tight text-slate-900 [font-size:clamp(2.1rem,5.2vw,3.5rem)] [line-height:1.06]">
          <span className="pp-chromatic-hero-line block">{t.heroLine1}</span>
          <span className="mt-1 block bg-gradient-to-r from-violet-600 via-indigo-500 to-emerald-500 bg-clip-text text-transparent">
            {t.heroLine2}
          </span>
        </h1>
      </HeroRevealStep>

      <HeroRevealStep step={2}>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">{t.heroSubline}</p>
      </HeroRevealStep>

      <HeroRevealStep step={3}>
        <div className="relative z-30 mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <HeroCtaLink
            href={primaryHref}
            className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-colors hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 sm:w-auto sm:min-w-[200px]"
          >
            {isAuthenticated ? t.ctaDashboard : t.ctaTrial}
          </HeroCtaLink>
          <HeroCtaLink
            href={secondaryHref}
            onNavigate={onSecondaryClick}
            className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 bg-white px-7 py-3.5 text-sm font-semibold text-slate-800 transition-colors hover:border-slate-400 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 sm:w-auto sm:min-w-[180px]"
          >
            {t.ctaPricing}
          </HeroCtaLink>
        </div>
        <div className="mt-4 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <StarRow />
            <span className="text-sm font-medium text-slate-700">{t.heroReviewsLabel}</span>
          </div>
          <p className="text-xs text-slate-500">{t.microNoCard}</p>
        </div>
        <div className="mt-5 flex justify-center">
          <PwaInstallButton labels={t.installLabels} />
        </div>
      </HeroRevealStep>
    </div>
  );
}

function statusChipClass(status: string) {
  const s = status.toLowerCase();
  if (s.includes("pay") || s.includes("betaald") || s.includes("pagad")) {
    return "bg-emerald-100 text-emerald-900 ring-emerald-200/80";
  }
  if (s.includes("relan") || s.includes("nudg") || s.includes("herinner") || s.includes("record")) {
    return "bg-violet-100 text-violet-900 ring-violet-200/80";
  }
  return "bg-amber-100 text-amber-900 ring-amber-200/80";
}

/** Opacité 0 → 1 puis bloquée à 1 jusqu’à la fin du rail. */
function holdOpacity(scrollYProgress: MotionValue<number>, fadeIn: readonly [number, number]) {
  return useTransform(scrollYProgress, [fadeIn[0], fadeIn[1], P.holdFrom, 1], [0, 1, 1, 1]);
}

function HeroRealisticFaces({
  alts,
  scrollYProgress,
}: {
  alts: readonly string[];
  scrollYProgress: MotionValue<number>;
}) {
  const facesOpacity = holdOpacity(scrollYProgress, [P.decomposeStart, P.decomposeStart + 0.1]);
  const facesY = useTransform(scrollYProgress, [P.decomposeStart, P.decomposeEnd, 1], [18, 0, 0]);
  const faceSpread = useTransform(scrollYProgress, [P.decomposeStart, P.decomposeEnd, 1], [0, 1, 1]);

  const x0 = useTransform(faceSpread, (t) => -30 * t);
  const x1 = useTransform(faceSpread, (t) => -10 * t);
  const x2 = useTransform(faceSpread, (t) => 10 * t);
  const x3 = useTransform(faceSpread, (t) => 30 * t);
  const spreads = [x0, x1, x2, x3];

  return (
    <motion.div className="flex items-center justify-center py-2" style={{ opacity: facesOpacity, y: facesY }}>
      {HERO_FACE_SRCS.map((src, i) => (
        <motion.div
          key={src}
          className="relative -mx-2.5 h-[3.25rem] w-[3.25rem] shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-md shadow-slate-900/10 sm:h-14 sm:w-14"
          style={{ x: spreads[i] }}
        >
          <img src={src} alt={alts[i] ?? ""} className="h-full w-full object-cover" width={56} height={56} loading="lazy" decoding="async" />
        </motion.div>
      ))}
    </motion.div>
  );
}

function HeroDeviceDecompose({
  cards,
  trialHref,
  pinCopy,
  scrollYProgress,
}: {
  cards: LandingCopy["heroShowcaseCards"];
  trialHref: string;
  pinCopy: ScrollPinCopy;
  scrollYProgress: MotionValue<number>;
}) {
  const main = cards[1] ?? cards[0];
  const left = cards[0];
  const right = cards[2] ?? cards[0];

  const deviceOpacity = useTransform(scrollYProgress, [0, P.zoomStart, P.zoomStart + 0.03, 1], [0, 0, 1, 1]);
  const devicePointer = useTransform(deviceOpacity, (v) => (v > 0.12 ? "auto" : "none"));
  const deviceScale = useTransform(scrollYProgress, [P.zoomStart, P.zoomEnd, 1], [1.62, 1, 1]);
  const deviceY = useTransform(scrollYProgress, [P.zoomStart, P.zoomEnd, 1], [72, 0, 0]);
  const lite = useLandingLiteMotion();
  const deviceBlurPx = useTransform(scrollYProgress, [P.zoomStart, P.zoomStart + 0.1, 1], [lite ? 0 : 14, 0, 0]);
  const deviceBlurFilter = useTransform(deviceBlurPx, (b) => (b > 0 ? `blur(${b}px)` : "none"));

  const balanceScale = useTransform(scrollYProgress, [P.zoomStart, P.zoomEnd, 1], [1.12, 1, 1]);

  const scene2Opacity = useTransform(scrollYProgress, [P.zoomStart + 0.02, P.zoomEnd + 0.04, 1], [0, 1, 1]);
  const scene2Y = useTransform(scrollYProgress, [P.zoomStart, P.zoomEnd, 1], [16, 0, 0]);

  const sideLeftX = useTransform(scrollYProgress, [P.decomposeStart, P.decomposeEnd, 1], [0, -84, -84]);
  const sideRightX = useTransform(scrollYProgress, [P.decomposeStart, P.decomposeEnd, 1], [0, 84, 84]);
  const reduce = usePreferMinimalMotion();
  const sidesOpacity = holdOpacity(scrollYProgress, [P.decomposeStart, P.decomposeStart + 0.1]);

  const rowsOpacity = holdOpacity(scrollYProgress, [P.decomposeStart + 0.06, P.decomposeEnd]);
  const rowsY = useTransform(scrollYProgress, [P.decomposeStart + 0.06, P.decomposeEnd, 1], [16, 0, 0]);

  const ctaOpacity = holdOpacity(scrollYProgress, [P.decomposeStart + 0.1, P.decomposeEnd]);
  const ctaY = useTransform(scrollYProgress, [P.decomposeStart + 0.1, P.decomposeEnd, 1], [18, 0, 0]);

  return (
    <motion.div
      className="pp-hero-device-stage absolute inset-x-0 bottom-0 top-[28%] z-10 flex items-center justify-center overflow-visible px-2 pb-6 sm:top-[26%] sm:px-4 sm:pb-8"
      style={{
        opacity: deviceOpacity,
        scale: deviceScale,
        y: deviceY,
        filter: deviceBlurFilter,
        pointerEvents: devicePointer,
      }}
    >
      <div className="pp-hero-device-card relative w-full max-w-[min(24rem,92vw)] sm:max-w-[min(26rem,96vw)]">
        <div className="pp-hero-device-card__shell relative overflow-visible rounded-[1.85rem] border border-slate-200 bg-white p-5 shadow-[0_32px_90px_-24px_rgba(15,23,42,0.4)] ring-1 ring-slate-900/10 sm:p-6">
          <motion.header
            className="pp-hero-device-card__head -mx-1 mb-4 border-b border-slate-100 pb-4 text-center sm:-mx-0"
            style={{ opacity: scene2Opacity, y: scene2Y }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-600">{pinCopy.scene2Title}</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-700">{pinCopy.scene2Sub}</p>
          </motion.header>

          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" aria-hidden />

          <motion.div className="text-center" style={{ scale: balanceScale }}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">{main.label}</p>
            <p className="mt-1 bg-gradient-to-r from-violet-700 via-indigo-600 to-emerald-600 bg-clip-text text-[clamp(1.85rem,5vw,2.5rem)] font-semibold tabular-nums tracking-tight text-transparent">
              {main.amount}
            </p>
            <span className="mt-2 inline-flex rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-900">
              {main.pill}
            </span>
          </motion.div>

          <HeroRealisticFaces alts={pinCopy.faceAlts} scrollYProgress={scrollYProgress} />

          <div className="relative mt-2 min-h-[5.25rem]">
            <motion.div
              className="absolute left-1/2 top-0 flex w-[9.75rem] min-h-[4.75rem] -translate-x-1/2 flex-col items-center justify-center rounded-xl border border-violet-200 bg-violet-50 px-2 py-2.5 text-center shadow-sm"
              style={{ x: sideLeftX, opacity: sidesOpacity }}
              whileHover={heroHoverScale(reduce, 1.04)}
            >
              <p className="line-clamp-2 text-[9px] font-medium leading-snug text-violet-900">{left.label}</p>
              <p className="mt-1 text-base font-semibold tabular-nums leading-none text-violet-950">{left.amount}</p>
              <p className="mt-1 line-clamp-2 text-[9px] font-semibold leading-snug text-violet-800">{left.pill}</p>
            </motion.div>
            <motion.div
              className="absolute left-1/2 top-0 flex w-[9.75rem] min-h-[4.75rem] -translate-x-1/2 flex-col items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-2.5 text-center shadow-sm"
              style={{ x: sideRightX, opacity: sidesOpacity }}
              whileHover={heroHoverScale(reduce, 1.04)}
            >
              <p className="line-clamp-2 text-[9px] font-medium leading-snug text-emerald-900">{right.label}</p>
              <p className="mt-1 text-base font-semibold tabular-nums leading-none text-emerald-950">{right.amount}</p>
              <p className="mt-1 line-clamp-2 text-[9px] font-semibold leading-snug text-emerald-800">{right.pill}</p>
            </motion.div>
          </div>

          <motion.div className="mt-2 space-y-1.5" style={{ opacity: rowsOpacity, y: rowsY }}>
            {pinCopy.mockRows.map((row) => (
              <motion.div
                key={row.name}
                className="flex cursor-default items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                whileHover={heroHoverScale(reduce, 1.02)}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-900">{row.name}</p>
                  <p className="text-[11px] tabular-nums text-slate-600">{row.amount}</p>
                </div>
                <span
                  className={`max-w-[42%] shrink-0 rounded-full px-1.5 py-0.5 text-center text-[8px] font-bold uppercase leading-tight tracking-wide ring-1 sm:max-w-none sm:px-2 sm:text-[9px] ${statusChipClass(row.status)}`}
                >
                  {row.status}
                </span>
              </motion.div>
            ))}
          </motion.div>

          <motion.div className="relative z-30 mt-3 flex justify-center" style={{ opacity: ctaOpacity, y: ctaY }}>
            <HeroCtaLink
              href={trialHref}
              className="inline-flex min-h-[2.75rem] w-full max-w-sm items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-center text-xs font-semibold text-white shadow-lg shadow-slate-900/25 hover:bg-slate-800 hover:shadow-xl sm:px-6 sm:text-sm"
            >
              {pinCopy.tryFreeCta}
            </HeroCtaLink>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

type LandingBonsaiHeroProps = {
  t: LandingCopy;
  locale: AppLocale;
  isAuthenticated: boolean;
  primaryHref: string;
  secondaryHref: string;
  trustIntro: string;
  trustPills: readonly string[];
};

function LandingHeroAmbientLayers({
  blob1Motion,
}: {
  blob1Motion?: { x?: MotionValue<string>; y?: MotionValue<string> };
}) {
  return (
    <>
      <div className="pp-landing-hero-surface" aria-hidden>
        <div className="pp-landing-hero-surface__mesh-drift" />
        <div className="pp-landing-hero-surface__grid" />
        <div className="pp-landing-hero-surface__sheen" />
        <div className="pp-landing-hero-surface__fade" />
      </div>
      <div className="pp-landing-ambient pointer-events-none absolute inset-0 z-[1]" aria-hidden>
        <motion.div
          className={`pp-landing-ambient__blob ${blob1Motion ? "left-[-18%] top-[-8%] h-[min(520px,70vw)] w-[min(520px,70vw)]" : "left-[-12%] top-[4%] h-[min(380px,68vw)] w-[min(380px,68vw)]"}`}
          style={{
            background: blob1Motion
              ? "radial-gradient(circle, rgba(124,58,237,0.34) 0%, rgba(99,102,241,0.16) 48%, transparent 72%)"
              : "radial-gradient(circle, rgba(124,58,237,0.38) 0%, rgba(99,102,241,0.18) 42%, transparent 72%)",
            x: blob1Motion?.x,
            y: blob1Motion?.y,
          }}
        />
        <div
          className={`pp-landing-ambient__blob pp-landing-ambient__blob--2 ${blob1Motion ? "right-[-18%] top-[12%] h-[min(480px,65vw)] w-[min(480px,65vw)]" : "right-[-10%] top-[18%] h-[min(340px,62vw)] w-[min(340px,62vw)]"}`}
          style={{
            background:
              "radial-gradient(circle, rgba(99,213,208,0.34) 0%, rgba(16,185,129,0.14) 48%, transparent 74%)",
          }}
        />
        <motion.div
          className="pp-landing-ambient__blob left-[38%] top-[52%] h-[min(280px,50vw)] w-[min(280px,50vw)] opacity-35"
          style={{
            background:
              "radial-gradient(circle, rgba(59,130,246,0.22) 0%, rgba(167,139,250,0.1) 50%, transparent 72%)",
            animationDuration: "32s",
            animationDelay: "-12s",
          }}
        />
      </div>
    </>
  );
}

function LandingBonsaiHeroSimple({
  t,
  isAuthenticated,
  primaryHref,
  secondaryHref,
}: Pick<LandingBonsaiHeroProps, "t" | "isAuthenticated" | "primaryHref" | "secondaryHref">) {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={sectionRef}
      className="pp-landing-cursor-host relative isolate overflow-hidden px-4 pb-14 pt-12 sm:px-6 sm:pb-16 sm:pt-16"
    >
      <LandingHeroAmbientLayers />
      <LandingCursorLine hostRef={sectionRef} />
      <div className="relative z-[3] mx-auto max-w-4xl">
        <HeroCopyBlock className="relative z-[2]" t={t} isAuthenticated={isAuthenticated} primaryHref={primaryHref} secondaryHref={secondaryHref} />
      </div>
    </section>
  );
}

function LandingBonsaiHeroScrollPin({
  t,
  locale,
  isAuthenticated,
  primaryHref,
  secondaryHref,
}: LandingBonsaiHeroProps) {
  const hydrated = useHydrated();
  const pinCopy = getScrollPinCopy(locale);
  const railRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const railHeightPx = useHeroRailHeightPx();

  const { scrollYProgress } = useScroll({
    target: railRef,
    offset: ["start start", "end end"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.02, P.heroOut, P.heroOut + 0.04], [1, 1, 0, 0]);
  const heroBlurPx = useTransform(scrollYProgress, [0.02, P.heroOut + 0.04], [0, 18]);
  const heroBlurFilter = useTransform(heroBlurPx, (b) => `blur(${b}px)`);
  const heroY = useTransform(scrollYProgress, [0, P.heroOut + 0.04, 1], [0, -40, -40]);
  const heroHidden = useTransform(scrollYProgress, (v) => (v > P.heroOut ? "hidden" : "visible"));
  const heroPointer = useTransform(heroOpacity, (v) => (v > 0.35 ? "auto" : "none"));

  const scrimOpacity = useTransform(scrollYProgress, [P.zoomStart - 0.02, P.zoomStart + 0.02, 1], [0, 1, 1]);
  const auraOpacity = useTransform(scrollYProgress, [P.zoomStart, P.zoomStart + 0.06, 1], [0, 1, 1]);

  const blob1X = useTransform(scrollYProgress, [0, P.holdFrom, 1], ["-8%", "0%", "0%"]);
  const blob1Y = useTransform(scrollYProgress, [0, P.holdFrom, 1], ["0%", "10%", "10%"]);

  return (
    <motion.section
      ref={railRef}
      className="relative isolate hidden touch-pan-y overflow-x-clip text-slate-900 xl:block"
      style={{ minHeight: railHeightPx, background: PIN_SURFACE }}
      aria-label={pinCopy.sectionAria}
    >
      <div
        ref={stickyRef}
        className="pp-landing-cursor-host sticky top-0 z-20 h-[100dvh] min-h-[100svh] w-full overflow-x-clip overflow-y-hidden"
      >
        <LandingHeroAmbientLayers blob1Motion={hydrated ? { x: blob1X, y: blob1Y } : undefined} />
        <LandingCursorLine hostRef={stickyRef} />

        <motion.div
          className="absolute inset-0 z-[4]"
          style={{ opacity: scrimOpacity, backgroundColor: "rgba(248, 250, 252, 0.92)" }}
          aria-hidden
        />

        {hydrated ? (
          <motion.div className="pp-hero-device-aura" style={{ opacity: auraOpacity }} aria-hidden />
        ) : null}

        <motion.div
          className="absolute inset-0 z-10 flex items-center justify-center px-4 pb-8 pt-10 sm:px-6"
          style={
            hydrated
              ? {
                  opacity: heroOpacity,
                  y: heroY,
                  filter: heroBlurFilter,
                  visibility: heroHidden,
                  pointerEvents: heroPointer,
                }
              : { opacity: 1, pointerEvents: "auto" }
          }
        >
          <div className="relative z-30 mx-auto w-full max-w-4xl">
            <HeroCopyBlock t={t} isAuthenticated={isAuthenticated} primaryHref={primaryHref} secondaryHref={secondaryHref} />
          </div>
        </motion.div>

        {hydrated ? (
          <HeroDeviceDecompose
            cards={t.heroShowcaseCards}
            trialHref={primaryHref}
            pinCopy={pinCopy}
            scrollYProgress={scrollYProgress}
          />
        ) : null}
      </div>
    </motion.section>
  );
}

export function LandingBonsaiHero(props: LandingBonsaiHeroProps) {
  const hydrated = useHydrated();
  const scrollEffects = useLandingScrollEffects();

  if (!scrollEffects || !hydrated) {
    return (
      <LandingBonsaiHeroSimple
        t={props.t}
        isAuthenticated={props.isAuthenticated}
        primaryHref={props.primaryHref}
        secondaryHref={props.secondaryHref}
      />
    );
  }

  return <LandingBonsaiHeroScrollPin {...props} />;
}
