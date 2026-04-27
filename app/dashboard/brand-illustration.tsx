/** Placeholder visuel — ambiance freelance / business (SVG, pas d’asset externe). */
export function BrandIllustration() {
  return (
    <div
      className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-blue-50/60 shadow-inner dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(15_23_42_/_0.06)_1px,transparent_0)] [background-size:20px_20px]" />
      <svg viewBox="0 0 400 300" className="relative h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="48" y="52" width="220" height="160" rx="14" className="fill-white stroke-slate-200" strokeWidth="1.5" />
        <rect x="68" y="78" width="72" height="10" rx="5" className="fill-slate-200" />
        <rect x="68" y="98" width="140" height="8" rx="4" className="fill-slate-100" />
        <rect x="68" y="118" width="120" height="8" rx="4" className="fill-slate-100" />
        <path
          d="M68 158 L120 130 L168 152 L220 112 L268 138"
          className="stroke-blue-500"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="120" cy="130" r="5" className="fill-blue-500" />
        <circle cx="168" cy="152" r="5" className="fill-blue-400" />
        <circle cx="220" cy="112" r="5" className="fill-blue-600" />
        <rect x="260" y="168" width="92" height="56" rx="10" className="fill-blue-600/10 stroke-blue-200" strokeWidth="1.25" />
        <text x="278" y="202" fill="#1d4ed8" fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize="11" fontWeight="600">
          Cashflow
        </text>
        <rect x="288" y="64" width="64" height="64" rx="16" className="fill-emerald-500/15 stroke-emerald-400/40" strokeWidth="1.25" />
        <path
          d="M308 108 L320 96 L332 108"
          className="stroke-emerald-600"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
