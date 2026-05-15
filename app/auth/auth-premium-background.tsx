"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { useReducedMotion } from "framer-motion";
import { useLowPerformanceDevice } from "@/lib/low-performance";

/**
 * Fond blanc premium : reflets statiques + (si souris fine) boule lissée et vagues
 * positionnées au curseur. Pas de canvas / WebGL.
 */
export function AuthPremiumBackground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef({ x: 0.5, y: 0.5 });
  const currentRef = useRef({ x: 0.5, y: 0.5 });
  const rafRef = useRef<number | null>(null);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPulseRef = useRef(0);
  const reduceMotion = Boolean(useReducedMotion());
  const lowPerf = useLowPerformanceDevice();
  const interactive = !reduceMotion && !lowPerf;

  useEffect(() => {
    if (!interactive) return;

    const root = rootRef.current;
    if (!root) return;

    const finePointer = window.matchMedia("(pointer: fine)");
    if (!finePointer.matches) return;

    const setVars = (x: number, y: number) => {
      const px = `${x * 100}%`;
      const py = `${y * 100}%`;
      root.style.setProperty("--pp-auth-x", px);
      root.style.setProperty("--pp-auth-y", py);
    };

    const tick = () => {
      const lerp = 0.13;
      const c = currentRef.current;
      const t = targetRef.current;
      c.x += (t.x - c.x) * lerp;
      c.y += (t.y - c.y) * lerp;
      setVars(c.x, c.y);

      const stillMoving = Math.abs(t.x - c.x) > 0.002 || Math.abs(t.y - c.y) > 0.002;
      rafRef.current = stillMoving ? requestAnimationFrame(tick) : null;
    };

    const scheduleTick = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };

    const pulseWave = () => {
      const now = performance.now();
      if (now - lastPulseRef.current < 140) return;
      lastPulseRef.current = now;
      root.dataset.pulse = "1";
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = setTimeout(() => {
        delete root.dataset.pulse;
      }, 520);
    };

    const onMove = (e: MouseEvent) => {
      const rect = root.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      targetRef.current = {
        x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
        y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
      };
      scheduleTick();
      pulseWave();
    };

    const onLeave = () => {
      targetRef.current = { x: 0.5, y: 0.5 };
      scheduleTick();
    };

    root.addEventListener("mousemove", onMove, { passive: true });
    root.addEventListener("mouseleave", onLeave, { passive: true });

    const onVis = () => {
      if (document.hidden && rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    document.addEventListener("visibilitychange", onVis);

    setVars(0.5, 0.5);

    return () => {
      root.removeEventListener("mousemove", onMove);
      root.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    };
  }, [interactive]);

  const cssVars = {
    "--pp-auth-x": "50%",
    "--pp-auth-y": "50%",
  } as CSSProperties;

  return (
    <div
      ref={rootRef}
      className={`pp-auth-premium-bg${interactive ? " pp-auth-premium-bg--interactive" : ""}`}
      aria-hidden
      style={cssVars}
    >
      <div className="pp-auth-premium-bg__base" />
      <div className="pp-auth-premium-bg__sheen" />
      <div className="pp-auth-premium-bg__grid" />
      <div className="pp-auth-premium-bg__wave pp-auth-premium-bg__wave--a" />
      <div className="pp-auth-premium-bg__wave pp-auth-premium-bg__wave--b" />
      <div className="pp-auth-premium-bg__wave pp-auth-premium-bg__wave--c" />
      {interactive ? <div className="pp-auth-premium-bg__ball" /> : null}
    </div>
  );
}
