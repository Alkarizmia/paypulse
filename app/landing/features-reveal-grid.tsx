"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useSyncExternalStore, type ReactNode } from "react";

export type FeaturesRevealItem = {
  title: string;
  body: string;
  icon: ReactNode;
};

function clamp01(p: number) {
  return Math.min(1, Math.max(0, p));
}

function subscribeSm(onStoreChange: () => void) {
  const mq = window.matchMedia("(min-width: 640px)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getSmUp() {
  return window.matchMedia("(min-width: 640px)").matches;
}

/** `sm` : grille multi-colonnes ; dessous : une colonne (mobile). */
function useIsSmUp() {
  return useSyncExternalStore(subscribeSm, getSmUp, () => false);
}

/**
 * Carte liée au scroll : la translation suit le progrès du défilement (scrub),
 * pas un déclenchement « tout d’un coup ». En remontant, le progrès diminue et le mouvement s’inverse.
 */
function FeatureRevealCard({
  card,
  index,
  reduceMotion,
}: {
  card: FeaturesRevealItem;
  index: number;
  reduceMotion: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const smUp = useIsSmUp();
  const fromRight = index % 2 === 1;
  const slidePx = 58;

  const { scrollYProgress } = useScroll({
    target: ref,
    /* Zone plus haute dans le viewport = plus de pixels de scroll pour faire glisser la carte */
    offset: ["start 0.94", "start 0.32"],
  });

  const x = useTransform(scrollYProgress, (p) => {
    if (reduceMotion) return 0;
    const t = clamp01(p);
    if (smUp) return 0;
    return fromRight ? slidePx * (1 - t) : -slidePx * (1 - t);
  });

  const y = useTransform(scrollYProgress, (p) => {
    if (reduceMotion) return 0;
    const t = clamp01(p);
    if (!smUp) return 0;
    return 24 * (1 - t);
  });

  const opacity = useTransform(scrollYProgress, (p) => {
    if (reduceMotion) return 1;
    const t = clamp01(p);
    return 0.15 + 0.85 * t;
  });

  return (
    <motion.div
      ref={ref}
      style={{ x, y, opacity }}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur-md will-change-transform"
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: -4,
              borderColor: "rgba(167, 139, 250, 0.22)",
              boxShadow:
                "0 20px 40px -24px rgba(15,23,42,0.35), 0 0 0 1px rgba(139,92,246,0.2), 0 0 40px -18px rgba(139, 92, 246, 0.35)",
            }
      }
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
    >
      <div className="flex items-start gap-4">
        <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-[0_0_24px_-12px_rgba(139,92,246,0.3)]">
          {card.icon}
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900">{card.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{card.body}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function FeaturesRevealGrid({
  items,
  reduceMotion,
}: {
  items: readonly FeaturesRevealItem[];
  reduceMotion: boolean;
}) {
  return (
    <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((card, index) => (
        <FeatureRevealCard key={card.title} card={card} index={index} reduceMotion={reduceMotion} />
      ))}
    </div>
  );
}
