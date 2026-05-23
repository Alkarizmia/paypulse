/** Placeholder pendant le chargement client de la landing (évite l’hydratation Framer Motion). */
export function LandingPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#f8fafc]" aria-busy="true" aria-label="Chargement">
      <div className="animate-pulse">
        <div className="border-b border-slate-200/80 bg-white px-4 py-3">
          <div className="mx-auto flex h-10 max-w-6xl items-center justify-between">
            <div className="h-8 w-28 rounded-lg bg-slate-200" />
            <div className="hidden gap-3 md:flex">
              <div className="h-4 w-16 rounded bg-slate-100" />
              <div className="h-4 w-16 rounded bg-slate-100" />
              <div className="h-4 w-16 rounded bg-slate-100" />
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-4xl px-6 pb-16 pt-16 text-center">
          <div className="mx-auto h-4 w-40 rounded bg-slate-200" />
          <div className="mx-auto mt-8 h-10 w-full max-w-md rounded-xl bg-slate-200" />
          <div className="mx-auto mt-3 h-10 w-full max-w-sm rounded-xl bg-slate-200" />
          <div className="mx-auto mt-8 h-12 w-52 rounded-full bg-slate-300" />
          <div className="mx-auto mt-10 flex justify-center gap-4">
            <div className="h-48 w-28 rounded-2xl bg-slate-200" />
            <div className="h-56 w-32 rounded-2xl bg-slate-300" />
            <div className="h-48 w-28 rounded-2xl bg-slate-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
