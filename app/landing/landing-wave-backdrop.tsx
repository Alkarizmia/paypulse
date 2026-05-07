"use client";

/**
 * Vagues qui tournent en cercle — double conic-gradient, rotation CSS pure (`transform`).
 * Parent doit être `relative overflow-hidden` avec coins arrondis ; le clip vient du parent.
 */
export function LandingGreyWaveBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]" aria-hidden>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="pp-landing-wave-disk pp-landing-wave-disk--a h-[min(88vmin,920px)] w-[min(88vmin,920px)] shrink-0 rounded-full" />
      </div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="pp-landing-wave-disk pp-landing-wave-disk--b h-[min(72vmin,720px)] w-[min(72vmin,720px)] shrink-0 rounded-full" />
      </div>
    </div>
  );
}
