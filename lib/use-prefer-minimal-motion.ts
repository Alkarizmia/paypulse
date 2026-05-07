"use client";

import { useReducedMotion } from "framer-motion";
import { useLowPerformanceDevice } from "@/lib/low-performance";

/**
 * Combine OS « reduced motion » et détection appareil modeste (RAM / mobile budget).
 * À utiliser pour Framer Motion et fonds animés coûteux.
 */
export function usePreferMinimalMotion(): boolean {
  return Boolean(useReducedMotion()) || useLowPerformanceDevice();
}
