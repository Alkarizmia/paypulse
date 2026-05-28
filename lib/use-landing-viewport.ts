"use client";

import { useSyncExternalStore } from "react";
import { useLowPerformanceDevice } from "@/lib/low-performance";
import { usePreferMinimalMotion } from "@/lib/use-prefer-minimal-motion";

/** Largeur tablette / portable (scroll pin désactivé en dessous). */
const COMPACT_MAX_WIDTH = 1279;

/** Hauteur courte (ex. portable 768px, 1366×768). */
const SHORT_MAX_HEIGHT = 860;

function subscribe(onStoreChange: () => void) {
  const mqs = [
    window.matchMedia(`(max-width: ${COMPACT_MAX_WIDTH}px)`),
    window.matchMedia(`(max-height: ${SHORT_MAX_HEIGHT}px)`),
  ];
  const handler = () => onStoreChange();
  for (const mq of mqs) {
    mq.addEventListener("change", handler);
  }
  return () => {
    for (const mq of mqs) {
      mq.removeEventListener("change", handler);
    }
  };
}

function getCompactViewport() {
  return (
    window.matchMedia(`(max-width: ${COMPACT_MAX_WIDTH}px)`).matches ||
    window.matchMedia(`(max-height: ${SHORT_MAX_HEIGHT}px)`).matches
  );
}

/** SSR / 1er paint : compact pour éviter le flash scroll-pin sur mobile. */
function getServerCompactViewport() {
  return true;
}

export function useLandingCompactViewport() {
  return useSyncExternalStore(subscribe, getCompactViewport, getServerCompactViewport);
}

/** Scroll pin hero + section How : grands écrans, hauteur suffisante, pas d’allègement forcé. */
export function useLandingScrollEffects() {
  const compact = useLandingCompactViewport();
  const reduce = usePreferMinimalMotion();
  const lowPerf = useLowPerformanceDevice();
  return !compact && !reduce && !lowPerf;
}

/** Animations coûteuses (blur filtre, etc.). */
export function useLandingLiteMotion() {
  const compact = useLandingCompactViewport();
  const reduce = usePreferMinimalMotion();
  const lowPerf = useLowPerformanceDevice();
  return compact || reduce || lowPerf;
}
