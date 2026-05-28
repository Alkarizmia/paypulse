"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useReducedMotion } from "framer-motion";
import { useLowPerformanceDevice } from "@/lib/low-performance";

/**
 * Petite boule colorée au curseur (lerp continu tant que la souris est dans la zone).
 * Pas d’impulsions / vagues animées : moins de charge sur une utilisation prolongée.
 */
export function LandingCursorLine({ hostRef }: { hostRef: RefObject<HTMLElement | null> }) {
  const targetRef = useRef({ x: 0.5, y: 0.5 });
  const currentRef = useRef({ x: 0.5, y: 0.5 });
  const rafRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const reduceMotion = Boolean(useReducedMotion());
  const lowPerf = useLowPerformanceDevice();
  const interactive = !reduceMotion && !lowPerf;

  useEffect(() => {
    if (!interactive) return;

    const host = hostRef.current;
    if (!host) return;

    let finePointer = true;
    try {
      finePointer = window.matchMedia("(pointer: fine)").matches;
    } catch {
      finePointer = true;
    }
    if (!finePointer) return;

    host.classList.add("pp-landing-cursor-host");

    const setVars = (x: number, y: number) => {
      host.style.setProperty("--pp-landing-x", `${x * 100}%`);
      host.style.setProperty("--pp-landing-y", `${y * 100}%`);
    };

    const stopLoop = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    const tick = () => {
      rafRef.current = null;
      const lerp = activeRef.current ? 0.22 : 0.16;
      const c = currentRef.current;
      const t = targetRef.current;
      c.x += (t.x - c.x) * lerp;
      c.y += (t.y - c.y) * lerp;
      setVars(c.x, c.y);

      const delta = Math.abs(t.x - c.x) + Math.abs(t.y - c.y);
      const needsMore = activeRef.current || delta > 0.0008;
      if (needsMore) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    const scheduleTick = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      const rect = host.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      targetRef.current = {
        x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
        y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
      };
      scheduleTick();
    };

    const onEnter = () => {
      activeRef.current = true;
      scheduleTick();
    };

    const onLeave = () => {
      activeRef.current = false;
      targetRef.current = { x: 0.5, y: 0.5 };
      scheduleTick();
    };

    host.addEventListener("mouseenter", onEnter, { passive: true });
    host.addEventListener("mousemove", onMove, { passive: true });
    host.addEventListener("mouseleave", onLeave, { passive: true });

    const onVis = () => {
      if (document.hidden) stopLoop();
    };
    document.addEventListener("visibilitychange", onVis);

    setVars(0.5, 0.5);

    return () => {
      host.classList.remove("pp-landing-cursor-host");
      host.removeEventListener("mouseenter", onEnter);
      host.removeEventListener("mousemove", onMove);
      host.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
      stopLoop();
      host.style.removeProperty("--pp-landing-x");
      host.style.removeProperty("--pp-landing-y");
    };
  }, [hostRef, interactive]);

  if (!interactive) return null;

  return (
    <div className="pp-landing-cursor-bg pointer-events-none absolute inset-0 z-[2] overflow-hidden" aria-hidden>
      <div className="pp-landing-cursor-bg__glow" />
      <div className="pp-landing-cursor-bg__ball" />
    </div>
  );
};
