"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * Allège surtout les animations CSS coûteuses (`data-low-performance` dans globals.css).
 * Ne doit pas couper les animations Framer « métier » (scroll, reveals) sur un PC bureau 4 Go.
 *
 * Déclenchement :
 * - `prefers-reduced-data: reduce`
 * - RAM ≤ 2 Go (si le navigateur expose `deviceMemory`)
 * - Mobile tactile étroit + (RAM ≤ 4 Go ou ≤ 4 cœurs logiques)
 *
 * Un PC fixe avec 4 Go (ex. i5-3470) n’est plus traité comme « sans animation ».
 */
export function computeLowPerformanceDevice(): boolean {
  if (typeof window === "undefined") return false;

  const nav = navigator as Navigator & { deviceMemory?: number };

  try {
    if (window.matchMedia("(prefers-reduced-data: reduce)").matches) {
      return true;
    }
  } catch {
    /* Safari ancien */
  }

  const mem = typeof nav.deviceMemory === "number" ? nav.deviceMemory : null;
  if (mem !== null && mem <= 2) {
    return true;
  }

  const narrow = window.matchMedia("(max-width: 767px)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const mobile = narrow && coarse;
  if (!mobile) {
    return false;
  }

  const cores = typeof nav.hardwareConcurrency === "number" ? nav.hardwareConcurrency : 8;
  if (mem !== null && mem <= 4) return true;
  if (cores <= 4) return true;
  if (cores <= 2) return true;

  return false;
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const mqs = [
    window.matchMedia("(max-width: 767px)"),
    window.matchMedia("(pointer: coarse)"),
  ];
  let mqData: MediaQueryList | null = null;
  try {
    mqData = window.matchMedia("(prefers-reduced-data: reduce)");
  } catch {
    mqData = null;
  }

  const handler = () => onChange();
  for (const mq of mqs) {
    mq.addEventListener("change", handler);
  }
  if (mqData) mqData.addEventListener("change", handler);

  return () => {
    for (const mq of mqs) {
      mq.removeEventListener("change", handler);
    }
    if (mqData) mqData.removeEventListener("change", handler);
  };
}

/** Détection stable SSR/hydration ; réévalue si les media queries changent (rotation, fenêtre). */
export function useLowPerformanceDevice(): boolean {
  return useSyncExternalStore(subscribe, computeLowPerformanceDevice, () => false);
}

/** Pose `data-low-performance` sur `<html>` pour les règles CSS globales. */
export function LowPerformanceHtmlAttrs() {
  const low = useLowPerformanceDevice();

  useEffect(() => {
    document.documentElement.dataset.lowPerformance = low ? "true" : "false";
    return () => {
      delete document.documentElement.dataset.lowPerformance;
    };
  }, [low]);

  return null;
}
