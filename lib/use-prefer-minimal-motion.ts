"use client";

import { useReducedMotion } from "framer-motion";
import { useHydrated } from "@/lib/use-hydrated";

/**
 * Coupe les animations Framer (scroll pin, reveals, scrub cartes, etc.).
 * Uniquement si l’utilisateur a activé « réduire les animations » dans l’OS.
 *
 * L’allègement RAM / mobile passe par `useLowPerformanceDevice` + `data-low-performance`
 * (CSS), sans retirer toutes les animations sur un PC bureau 4 Go.
 *
 * Avant hydratation, retourne toujours `false` pour que le HTML serveur = premier paint client.
 */
export function usePreferMinimalMotion(): boolean {
  const hydrated = useHydrated();
  const prefersReduced = useReducedMotion();
  if (!hydrated) return false;
  return Boolean(prefersReduced);
}
