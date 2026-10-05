"use client";

import { useEffect, useRef, useState } from "react";
import { usePreferMinimalMotion } from "@/lib/use-prefer-minimal-motion";

/**
 * IntersectionObserver one-shot (seuil ~0.2).
 * `armed` n’est posé qu’après le premier callback IO pour éviter un flash hide/show.
 */
export function useOnceInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const reduce = usePreferMinimalMotion();
  const [inView, setInView] = useState(false);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (reduce) {
      setInView(true);
      setArmed(false);
      return;
    }

    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      setArmed(false);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
        setArmed(true);
      },
      { threshold },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [reduce, threshold]);

  return { ref, inView, armed, reduce };
}
