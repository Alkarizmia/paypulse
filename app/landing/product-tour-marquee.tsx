"use client";

import { usePreferMinimalMotion } from "@/lib/use-prefer-minimal-motion";

export type ProductTourMarqueePanel = {
  kind: "clients" | "reminders" | "treasury" | "deadlines" | "security" | "rhythm";
  title: string;
  body: string;
};

function MiniArt({ kind }: { kind: ProductTourMarqueePanel["kind"] }) {
  const stroke = "currentColor";
  return (
    <svg
      viewBox="0 0 200 120"
      className="h-full w-full text-slate-400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {kind === "clients" && (
        <>
          <rect x="14" y="18" width="172" height="84" rx="10" className="text-slate-200" strokeWidth="1.5" stroke={stroke} />
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(28 ${34 + i * 22})`}>
              <circle cx="8" cy="8" r="6" className="text-violet-400" strokeWidth="1.5" stroke="currentColor" fill="none" />
              <path d="M22 6h72M22 12h48" strokeWidth="2" strokeLinecap="round" className="text-slate-300" stroke="currentColor" />
              <rect x="118" y="3" width="40" height="12" rx="4" className="text-emerald-400/90" fill="currentColor" opacity="0.35" />
            </g>
          ))}
        </>
      )}
      {kind === "reminders" && (
        <>
          <rect x="36" y="22" width="128" height="76" rx="12" className="text-slate-200" strokeWidth="1.5" stroke={stroke} />
          <path
            d="M52 42h96M52 56h72M52 70h88"
            strokeWidth="2.2"
            strokeLinecap="round"
            className="text-slate-300"
            stroke="currentColor"
          />
          <path
            d="M156 28c10 0 18 8 18 18v6h-36v-6c0-10 8-18 18-18Z"
            className="text-violet-400"
            strokeWidth="1.5"
            stroke="currentColor"
            fill="none"
          />
          <circle cx="100" cy="88" r="14" className="text-emerald-500" fill="currentColor" opacity="0.2" />
          <path d="M94 88h12M100 82v12" strokeWidth="2" strokeLinecap="round" className="text-emerald-600" stroke="currentColor" />
        </>
      )}
      {kind === "treasury" && (
        <>
          <rect x="20" y="72" width="28" height="28" rx="4" className="text-violet-400" fill="currentColor" opacity="0.25" />
          <rect x="56" y="56" width="28" height="44" rx="4" className="text-violet-500" fill="currentColor" opacity="0.35" />
          <rect x="92" y="40" width="28" height="60" rx="4" className="text-indigo-500" fill="currentColor" opacity="0.4" />
          <rect x="128" y="48" width="28" height="52" rx="4" className="text-emerald-500" fill="currentColor" opacity="0.35" />
          <path
            d="M24 34c28-18 72-18 100 4"
            strokeWidth="2"
            strokeLinecap="round"
            className="text-slate-400"
            stroke="currentColor"
          />
          <circle cx="164" cy="30" r="5" className="text-emerald-500" fill="currentColor" opacity="0.6" />
        </>
      )}
      {kind === "deadlines" && (
        <>
          <rect x="48" y="24" width="104" height="80" rx="10" className="text-slate-200" strokeWidth="1.5" stroke={stroke} />
          <path d="M64 40h72M64 52h56" strokeWidth="2" strokeLinecap="round" className="text-slate-300" stroke="currentColor" />
          <rect x="72" y="64" width="56" height="28" rx="6" className="text-sky-400" fill="currentColor" opacity="0.2" />
          <circle cx="100" cy="78" r="8" className="text-sky-500" strokeWidth="2" stroke="currentColor" fill="none" />
          <path d="M100 74v8M96 78h8" strokeWidth="1.8" strokeLinecap="round" className="text-sky-600" stroke="currentColor" />
        </>
      )}
      {kind === "security" && (
        <>
          <path
            d="M100 22 62 40v34c0 22 18 36 38 40 20-4 38-18 38-40V40Z"
            className="text-slate-200"
            strokeWidth="1.5"
            stroke="currentColor"
            fill="none"
          />
          <path d="M88 58h24M88 72h24M88 86h16" strokeWidth="2.2" strokeLinecap="round" className="text-slate-300" stroke="currentColor" />
          <circle cx="100" cy="52" r="10" className="text-emerald-500" strokeWidth="2" stroke="currentColor" fill="none" />
          <path d="M95 52l4 4 8-8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600" stroke="currentColor" />
        </>
      )}
      {kind === "rhythm" && (
        <>
          <circle cx="100" cy="60" r="38" className="text-slate-200" strokeWidth="1.5" stroke={stroke} fill="none" />
          <path d="M100 60V36M100 60l18 10" strokeWidth="2.5" strokeLinecap="round" className="text-violet-500" stroke="currentColor" />
          <circle cx="100" cy="60" r="4" className="text-slate-600" fill="currentColor" />
          {[0, 1, 2, 3].map((i) => (
            <circle
              key={i}
              cx={100 + Math.cos((i / 4) * Math.PI * 2 - Math.PI / 2) * 30}
              cy={60 + Math.sin((i / 4) * Math.PI * 2 - Math.PI / 2) * 30}
              r="3"
              className={i === 0 ? "text-emerald-500" : "text-slate-300"}
              fill="currentColor"
              opacity={i === 0 ? 0.85 : 0.45}
            />
          ))}
        </>
      )}
    </svg>
  );
}

function TourCard({ panel }: { panel: ProductTourMarqueePanel }) {
  return (
    <article
      data-tour-accent={panel.kind}
      className="pp-product-tour-card flex w-[min(19rem,calc(100vw-2.5rem))] shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:w-80"
    >
      <div className="pp-product-tour-visual relative aspect-[5/3] w-full bg-gradient-to-br from-slate-50 via-slate-100/90 to-violet-50/30 px-5 py-4">
        <div className="pp-product-tour-img absolute inset-0 z-0 flex items-center justify-center px-3">
          <MiniArt kind={panel.kind} />
        </div>
        <div className="pp-product-tour-glow" aria-hidden />
        <div className="pp-product-tour-shine" aria-hidden />
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
  scrollHint,
}: {
  panels: readonly ProductTourMarqueePanel[];
  /** Phrase d’aide (défilement auto + pause au survol). */
  scrollHint: string;
}) {
  const reduce = usePreferMinimalMotion();
  const loop = [...panels, ...panels] as ProductTourMarqueePanel[];

  if (reduce) {
    return (
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label={scrollHint}>
        {panels.map((panel) => (
          <article
            key={panel.title}
            data-tour-accent={panel.kind}
            className="pp-product-tour-card flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="pp-product-tour-visual relative aspect-[5/3] w-full bg-slate-100/80 px-6 py-5">
              <div className="pp-product-tour-img absolute inset-0 z-0 flex items-center justify-center px-3">
                <MiniArt kind={panel.kind} />
              </div>
              <div className="pp-product-tour-glow" aria-hidden />
              <div className="pp-product-tour-shine" aria-hidden />
            </div>
            <div className="flex flex-1 flex-col border-t border-slate-100 bg-white p-5">
              <h3 className="text-base font-semibold text-slate-900">{panel.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{panel.body}</p>
            </div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="pp-product-tour-marquee-wrap relative mt-10 sm:mt-12">
      <p className="mb-3 text-center text-xs text-slate-500 sm:text-sm">{scrollHint}</p>
      <div className="relative">
        <div
          className="pp-product-tour-marquee-fade pointer-events-none absolute inset-y-0 left-0 z-[2] w-10 bg-gradient-to-r from-slate-50 to-transparent sm:w-14"
          aria-hidden
        />
        <div
          className="pp-product-tour-marquee-fade pointer-events-none absolute inset-y-0 right-0 z-[2] w-10 bg-gradient-to-l from-slate-50 to-transparent sm:w-14"
          aria-hidden
        />
        <div className="pp-product-tour-marquee-viewport py-1">
          <div className="pp-product-tour-marquee-track" role="list" aria-label={scrollHint}>
            {loop.map((panel, i) => (
              <div key={`${panel.kind}-${i}`} className="shrink-0" role="listitem">
                <TourCard panel={panel} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
