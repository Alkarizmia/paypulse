"use client";

import { useReducedMotion } from "framer-motion";

/**
 * Coupe les animations Framer (scroll pin, reveals, scrub cartes, etc.).
 * Uniquement si l’utilisateur a activé « réduire les animations » dans l’OS.
 *
 * L’allègement RAM / mobile passe par `useLowPerformanceDevice` + `data-low-performance`
 * (CSS), sans retirer toutes les animations sur un PC bureau 4 Go.
 */
export function usePreferMinimalMotion(): boolean {
  return Boolean(useReducedMotion());
}
