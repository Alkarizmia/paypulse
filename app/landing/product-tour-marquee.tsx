"use client";

import { useCallback, useEffect, useState } from "react";
import { usePreferMinimalMotion } from "@/lib/use-prefer-minimal-motion";

export type ProductTourMarqueePanel = {
  kind: "clients" | "reminders" | "treasury" | "deadlines" | "security" | "rhythm";
  title: string;
  body: string;
};

/** Illustrations SVG minimalistes (produit en images). */
function MiniArt({ kind, artId }: { kind: ProductTourMarqueePanel["kind"]; artId: string }) {
  const g = {
    surface: `ppt-surface-${artId}`,
    violet: `ppt-violet-${artId}`,
    emerald: `ppt-emerald-${artId}`,
  };

  return (
    <svg
      viewBox="0 0 240 136"
      className="h-full max-h-[7.5rem] w-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id={g.surface} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#eef2ff" />
        </linearGradient>
        <linearGradient id={g.violet} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id={g.emerald} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>

      {kind === "clients" && (
        <>
          <rect x="28" y="24" width="184" height="88" rx="14" fill={`url(#${g.surface})`} stroke="#e2e8f0" strokeWidth="1.25" />
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(44 ${40 + i * 24})`}>
              <circle cx="10" cy="8" r="7" fill="#ede9fe" stroke="#8b5cf6" strokeWidth="1.25" />
              <rect x="26" y="4" width="88" height="4" rx="2" fill="#cbd5e1" />
              <rect x="26" y="12" width="58" height="3" rx="1.5" fill="#e2e8f0" />
              <rect x="128" y="3" width="44" height="12" rx="6" fill="#d1fae5" stroke="#34d399" strokeWidth="1" />
            </g>
          ))}
        </>
      )}

      {kind === "reminders" && (
        <>
          <rect x="52" y="28" width="136" height="80" rx="14" fill={`url(#${g.surface})`} stroke="#e2e8f0" strokeWidth="1.25" />
          <path d="M72 48h96M72 62h68M72 76h84" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
          <path
            d="M168 34c12 0 22 10 22 22v8H146v-8c0-12 10-22 22-22Z"
            fill="#ede9fe"
            stroke="#8b5cf6"
            strokeWidth="1.25"
          />
          <circle cx="120" cy="96" r="16" fill={`url(#${g.emerald})`} opacity="0.9" />
          <path d="M114 96h12M120 90v12" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
        </>
      )}

      {kind === "treasury" && (
        <>
          <rect x="32" y="88" width="32" height="32" rx="6" fill="#ddd6fe" />
          <rect x="72" y="68" width="32" height="52" rx="6" fill={`url(#${g.violet})`} opacity="0.85" />
          <rect x="112" y="48" width="32" height="72" rx="6" fill="#818cf8" opacity="0.9" />
          <rect x="152" y="60" width="32" height="60" rx="6" fill={`url(#${g.emerald})`} opacity="0.9" />
          <path
            d="M40 44c36-22 88-22 124 6"
            stroke="#94a3b8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="4 6"
          />
          <path d="M36 44c32-18 80-18 112 8" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <circle cx="176" cy="38" r="6" fill="#34d399" />
        </>
      )}

      {kind === "deadlines" && (
        <>
          <rect x="56" y="26" width="128" height="84" rx="14" fill={`url(#${g.surface})`} stroke="#e2e8f0" strokeWidth="1.25" />
          <rect x="72" y="40" width="96" height="8" rx="4" fill="#e2e8f0" />
          <rect x="88" y="58" width="64" height="40" rx="8" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1.25" />
          <circle cx="120" cy="78" r="10" fill="#0ea5e9" opacity="0.2" />
          <path d="M120 72v12M114 78h12" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
          <rect x="72" y="54" width="12" height="12" rx="3" fill="#fbbf24" opacity="0.35" />
        </>
      )}

      {kind === "security" && (
        <>
          <path
            d="M120 24 76 44v38c0 26 20 42 44 46 24-4 44-20 44-46V44Z"
            fill={`url(#${g.surface})`}
            stroke="#cbd5e1"
            strokeWidth="1.25"
          />
          <rect x="92" y="58" width="56" height="5" rx="2.5" fill="#e2e8f0" />
          <rect x="92" y="72" width="40" height="5" rx="2.5" fill="#e2e8f0" />
          <circle cx="120" cy="48" r="12" fill={`url(#${g.emerald})`} />
          <path d="M114 48l5 5 10-11" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}

      {kind === "rhythm" && (
        <>
          <circle cx="120" cy="68" r="44" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.25" />
          <path d="M120 68V38M120 68l20 12" stroke={`url(#${g.violet})`} strokeWidth="3" strokeLinecap="round" />
          <circle cx="120" cy="68" r="5" fill="#475569" />
          {[0, 1, 2, 3].map((i) => {
            const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
            const cx = 120 + Math.cos(a) * 34;
            const cy = 68 + Math.sin(a) * 34;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={i === 0 ? 5 : 4}
                fill={i === 0 ? "#34d399" : "#cbd5e1"}
                opacity={i === 0 ? 1 : 0.7}
              />
            );
          })}
        </>
      )}
    </svg>
  );
}

function TourCard({ panel, artId }: { panel: ProductTourMarqueePanel; artId: string }) {
  return (
    <article
      data-tour-accent={panel.kind}
      className="pp-product-tour-card group flex w-[min(19rem,calc(100vw-2.5rem))] shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm sm:w-80"
    >
      <div className="pp-product-tour-visual relative aspect-[5/3] w-full overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 px-5 py-4">
        <div className="pp-product-tour-blur-halo pointer-events-none absolute inset-0 z-[1]" aria-hidden />
        <div className="pp-product-tour-img absolute inset-0 z-[2] flex items-center justify-center px-4">
          <MiniArt kind={panel.kind} artId={artId} />
        </div>
        <div className="pp-product-tour-glow pointer-events-none absolute inset-0 z-[3]" aria-hidden />
        <div className="pp-product-tour-shine pointer-events-none absolute inset-0 z-[4]" aria-hidden />
      </div>
      <div className="flex flex-1 flex-col border-t border-slate-100 bg-white p-5">
        <h3 className="text-base font-semibold text-slate-900">{panel.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{panel.body}</p>
      </div>
    </article>
  );
}

export function ProductTourMarquee({
  panels,
  ariaLabel,
}: {
  panels: readonly ProductTourMarqueePanel[];
  ariaLabel: string;
}) {
  const reduceMotion = usePreferMinimalMotion();
  const [paused, setPaused] = useState(false);
  const [mounted, setMounted] = useState(false);
  const loop = [...panels, ...panels] as ProductTourMarqueePanel[];

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showGrid = mounted && reduceMotion;

  if (showGrid) {
    return (
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label={ariaLabel}>
        {panels.map((panel, i) => (
          <TourCard key={panel.title} panel={panel} artId={`${panel.kind}-grid-${i}`} />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`pp-product-tour-marquee-wrap relative mt-10 sm:mt-12${paused ? " is-paused" : ""}`}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocusCapture={pause}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) resume();
      }}
    >
      <div className="relative">
        <div className="pp-product-tour-marquee-viewport py-1">
          <div className="pp-product-tour-marquee-track" role="list" aria-label={ariaLabel}>
            {loop.map((panel, i) => (
              <div key={`${panel.kind}-${i}`} className="shrink-0" role="listitem">
                <TourCard panel={panel} artId={`${panel.kind}-${i}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
