/** Squelette léger pour Suspense / `loading.tsx` — feedback immédiat sans logique métier. */

export function DashboardRouteSkeleton() {
  return (
    <div className="min-h-screen bg-[#08080c] px-4 py-8 sm:px-6">
      <div className="mx-auto w-full min-w-0 max-w-7xl space-y-6 animate-pulse">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="h-8 w-40 rounded-lg bg-white/[0.08]" />
          <div className="flex gap-2">
            <div className="h-9 w-24 rounded-full bg-white/[0.06]" />
            <div className="h-9 w-9 rounded-full bg-white/[0.06]" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-28 rounded-2xl bg-white/[0.05]" />
          <div className="h-28 rounded-2xl bg-white/[0.05]" />
          <div className="h-28 rounded-2xl bg-white/[0.05]" />
        </div>
        <div className="h-64 rounded-2xl bg-white/[0.04]" />
      </div>
    </div>
  );
}
