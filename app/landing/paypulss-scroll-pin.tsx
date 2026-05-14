"use client";

/* eslint-disable @next/next/no-img-element -- Avatars SVG DiceBear (URL externe). */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useLocale } from "@/app/locale-context";
import { usePreferMinimalMotion } from "@/lib/use-prefer-minimal-motion";

/** Fond du rail (sticky) : même gris que l’entrée du pin. */
const PIN_RAIL_SURFACE =
  "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 12%, #e8edf4 48%, #eef1f7 100%)";

const DEMO_FACES = [
  { seed: "Paypulss-Aya", altFr: "Avatar illustratif A", altEn: "Illustrative avatar A" },
  { seed: "Paypulss-Lucas", altFr: "Avatar illustratif B", altEn: "Illustrative avatar B" },
  { seed: "Paypulss-Mira", altFr: "Avatar illustratif C", altEn: "Illustrative avatar C" },
  { seed: "Paypulss-Sam", altFr: "Avatar illustratif D", altEn: "Illustrative avatar D" },
] as const;

/**
 * Hauteur du rail = distance de scroll pour animer le sticky.
 * Mobile : rail plus court (moins de « friction »), sans min 2200px qui forçait ~3 écrans de scroll.
 * Desktop : un peu plus long pour un scrub plus doux.
 */
function usePinRailHeightPx() {
  const [px, setPx] = useState(2000);
  const measure = () => {
    if (typeof window === "undefined") return;
    const h = window.innerHeight || 800;
    const w = window.innerWidth;
    let next: number;
    if (w < 640) {
      next = Math.max(1480, Math.round(h * 1.78));
    } else if (w < 1024) {
      next = Math.max(1600, Math.round(h * 1.95));
    } else {
      next = Math.max(2100, Math.round(h * 2.45));
    }
    setPx(next);
  };
  useLayoutEffect(() => {
    measure();
  }, []);
  useEffect(() => {
    const onResize = () => requestAnimationFrame(measure);
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return px;
}

export type PaypulssScrollPinProps = {
  trustIntro: string;
  trustPills: readonly string[];
};

export function PaypulssScrollPin({ trustIntro, trustPills }: PaypulssScrollPinProps) {
  const ref = useRef<HTMLDivElement>(null);
  const railHeightPx = usePinRailHeightPx();
  const { locale } = useLocale();
  const reduce = usePreferMinimalMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const introOpacity = useTransform(scrollYProgress, [0, 0.08, 0.14], [1, 1, 0]);

  const chip1Op = useTransform(scrollYProgress, [0.02, 0.05, 0.12, 0.14], [0, 1, 1, 0]);
  const chip2Op = useTransform(scrollYProgress, [0.035, 0.065, 0.12, 0.14], [0, 1, 1, 0]);
  const chip3Op = useTransform(scrollYProgress, [0.05, 0.08, 0.12, 0.14], [0, 1, 1, 0]);

  const facesGroupOpacity = useTransform(scrollYProgress, [0, 0.06, 0.12, 0.2], [1, 1, 1, 0]);
  /** Pas de blur au scroll (très coûteux sur mobile) : léger lift GPU + fondu. */
  const facesLiftY = useTransform(scrollYProgress, [0, 0.08, 0.12, 0.2], [0, 0, 0, 10]);

  const captionOpacity = useTransform(scrollYProgress, [0, 0.08, 0.16], [1, 1, 0]);

  const tintOpacity = useTransform(scrollYProgress, [0, 0.08, 0.16], [1, 1, 0]);

  const trustOpacity = useTransform(scrollYProgress, [0, 0.08, 0.12, 0.48, 0.62], [0, 0, 1, 1, 0]);
  const trustY = useTransform(scrollYProgress, [0.08, 0.12, 0.44, 0.62], [18, 0, 0, -12]);
  const trustScale = useTransform(scrollYProgress, [0.08, 0.12, 0.44, 0.62], [0.98, 1, 1, 0.98]);

  const scrollMoreOpacity = useTransform(scrollYProgress, [0, 0.48, 0.58, 1], [0, 0, 1, 1]);

  const copy =
    locale === "fr"
      ? {
          kicker: "Faites défiler",
          scene1Title: "Interface pensée pour l’encaissement",
          scene1Sub:
            "Statuts lisibles, relances calées sur l’échéance, tableau de bord aéré, sans surcharge visuelle.",
          chip1: "Échéances visibles",
          chip2: "Relances cadrées",
          chip3: "Cash lisible",
          facesCaption: "Portraits illustratifs (générés, style avatar). Aucun vrai client.",
          arrowHint: "La suite du site est en dessous.",
        }
      : {
          kicker: "Keep scrolling",
          scene1Title: "Built for getting paid",
          scene1Sub:
            "Readable statuses, due-date nudges, a breathable dashboard, without visual noise.",
          chip1: "Due dates at a glance",
          chip2: "Nudges on schedule",
          chip3: "Cash in view",
          facesCaption: "Illustrative portraits (generated, avatar-style). Not real clients.",
          arrowHint: "The rest of the site is below.",
        };

  if (reduce) {
    return (
      <section
        className="border-y border-slate-200/80 bg-gradient-to-b from-slate-100 to-violet-50/40 py-14"
        aria-label={locale === "fr" ? "Aperçu PayPulss" : "PayPulss preview"}
      >
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{copy.kicker}</p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">{copy.scene1Title}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600">{copy.scene1Sub}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {[copy.chip1, copy.chip2, copy.chip3].map((label) => (
              <span
                key={label}
                className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-[11px] font-medium text-slate-700 shadow-sm"
              >
                {label}
              </span>
            ))}
          </div>
          <div className="mt-8 flex justify-center gap-3">
            {DEMO_FACES.map((f) => (
              <img
                key={f.seed}
                src={`https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(f.seed)}&backgroundType=gradientLinear`}
                alt={locale === "fr" ? f.altFr : f.altEn}
                width={56}
                height={56}
                className="h-14 w-14 rounded-full ring-2 ring-white shadow-md shadow-slate-900/10"
                loading="lazy"
                decoding="async"
              />
            ))}
          </div>
          <p className="mt-3 text-[11px] text-slate-500">{copy.facesCaption}</p>

          <div className="mx-auto mt-10 w-full max-w-2xl rounded-2xl border border-slate-200/90 bg-white px-5 py-8 text-center shadow-md shadow-slate-900/5 ring-1 ring-slate-200/60 sm:px-8">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 sm:text-sm">{trustIntro}</h3>
            <div className="mt-5 flex flex-wrap justify-center gap-2 sm:gap-2.5">
              {trustPills.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-slate-200/90 bg-slate-50/90 px-3 py-1.5 text-[11px] font-medium text-slate-700 shadow-sm sm:text-xs"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
          <p className="mt-8 text-xs text-slate-500" aria-hidden>
            ↓
          </p>
          <p className="mt-2 text-xs text-slate-600">{copy.arrowHint}</p>
        </div>
      </section>
    );
  }

  return (
    <div
      ref={ref}
      className="relative isolate touch-pan-y text-slate-900"
      style={{
        minHeight: railHeightPx,
        background: PIN_RAIL_SURFACE,
      }}
      id="paypulss-scroll-pin"
    >
      <div
        className="sticky top-0 z-20 isolate flex h-[100dvh] min-h-[100svh] w-full flex-col overflow-x-clip will-change-transform"
        style={{ background: PIN_RAIL_SURFACE }}
      >
        <motion.div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            opacity: tintOpacity,
            background:
              "linear-gradient(180deg, rgba(248,250,252,0.98) 0%, rgba(241,245,249,0.98) 38%, rgba(237,233,254,0.42) 100%), radial-gradient(ellipse 90% 55% at 50% 0%, rgba(167,139,250,0.14), transparent 52%), radial-gradient(ellipse 65% 45% at 85% 55%, rgba(52,211,153,0.1), transparent 48%)",
          }}
          aria-hidden
        />

        <motion.div
          className="pointer-events-none absolute inset-0 z-[1] flex flex-col items-center justify-center overflow-hidden px-5 py-8"
          style={{ opacity: introOpacity }}
        >
          <p className="mb-5 text-center text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">
            {copy.kicker}
          </p>
          <h2 className="max-w-2xl text-balance text-center text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-[2.65rem] md:leading-tight">
            {copy.scene1Title}
          </h2>
          <p className="mt-4 max-w-xl text-center text-sm leading-relaxed text-slate-600 sm:text-base">
            {copy.scene1Sub}
          </p>

          <div className="mt-7 flex max-w-lg flex-wrap justify-center gap-2 sm:gap-2.5">
            <motion.span
              style={{ opacity: chip1Op }}
              className="rounded-full border border-violet-200/80 bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-violet-900 shadow-sm sm:text-xs"
            >
              {copy.chip1}
            </motion.span>
            <motion.span
              style={{ opacity: chip2Op }}
              className="rounded-full border border-emerald-200/80 bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-emerald-900 shadow-sm sm:text-xs"
            >
              {copy.chip2}
            </motion.span>
            <motion.span
              style={{ opacity: chip3Op }}
              className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-slate-800 shadow-sm sm:text-xs"
            >
              {copy.chip3}
            </motion.span>
          </div>
        </motion.div>

        <motion.div
          className="pointer-events-none absolute inset-0 z-[1] flex flex-col items-center justify-end overflow-hidden px-5 pb-[min(22vh,9rem)] sm:pb-[min(24vh,10rem)]"
          style={{ opacity: facesGroupOpacity }}
        >
          <motion.div
            className="flex flex-wrap justify-center gap-3 sm:gap-4"
            style={{ y: facesLiftY, willChange: "transform" }}
          >
            {DEMO_FACES.map((f) => (
              <img
                key={f.seed}
                src={`https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(f.seed)}&backgroundType=gradientLinear`}
                alt={locale === "fr" ? f.altFr : f.altEn}
                width={56}
                height={56}
                className="h-14 w-14 rounded-full ring-2 ring-slate-100 shadow-md shadow-slate-900/15 sm:h-16 sm:w-16"
                loading="eager"
                decoding="async"
                fetchPriority="low"
              />
            ))}
          </motion.div>
          <motion.p
            className="pointer-events-none mt-4 max-w-md text-center text-[11px] leading-snug text-slate-500"
            style={{ opacity: captionOpacity }}
          >
            {copy.facesCaption}
          </motion.p>
        </motion.div>

        <motion.div
          className="pointer-events-none absolute inset-0 z-[2] flex flex-col items-center justify-center overflow-hidden px-5 py-8"
          style={{ opacity: trustOpacity, y: trustY, scale: trustScale }}
        >
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200/90 bg-white px-5 py-8 shadow-md shadow-slate-900/5 ring-1 ring-slate-200/60 sm:px-8">
            <h3 className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 sm:text-sm">
              {trustIntro}
            </h3>
            <div className="mt-5 flex flex-wrap justify-center gap-2 sm:gap-2.5">
              {trustPills.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-slate-200/90 bg-slate-50/90 px-3 py-1.5 text-[11px] font-medium text-slate-700 shadow-sm sm:text-xs"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="pointer-events-none absolute inset-x-0 bottom-[min(12vh,5rem)] z-[3] flex flex-col items-center justify-end px-4 sm:bottom-[min(14vh,5.5rem)]"
          style={{ opacity: scrollMoreOpacity }}
          aria-hidden
        >
          <span className="text-xl text-slate-500 sm:text-2xl">↓</span>
          <p className="mt-2 max-w-xs text-center text-[11px] font-medium text-slate-600 sm:text-xs">{copy.arrowHint}</p>
        </motion.div>
      </div>
    </div>
  );
}
