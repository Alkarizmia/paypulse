"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * Heuristique « appareil modeste » (≈ 4 Go RAM ou équivalent) :
 * - Chrome : `navigator.deviceMemory <= 4` quand disponible
 * - Sinon : mobile tactile étroit + peu de cœurs logiques
 * - `prefers-reduced-data` active aussi le mode léger (économie réseau + souvent batterie)
 */
export function computeLowPerformanceDevice(): boolean {
  if (typeof window === "undefined") return false;

  const nav = navigator as Navigator & { deviceMemory?: number };
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4) {
    return true;
  }

  try {
    if (window.matchMedia("(prefers-reduced-data: reduce)").matches) {
      return true;
    }
  } catch {
    /* Safari ancien */
  }

  const narrow = window.matchMedia("(max-width: 767px)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const cores = typeof nav.hardwareConcurrency === "number" ? nav.hardwareConcurrency : 8;

  if (narrow && coarse && cores <= 4) return true;
  if (narrow && cores <= 2) return true;

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
