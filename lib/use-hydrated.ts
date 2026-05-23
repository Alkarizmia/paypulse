"use client";

import { useEffect, useState } from "react";

/** `true` après le premier effet client (hydratation terminée). */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}
