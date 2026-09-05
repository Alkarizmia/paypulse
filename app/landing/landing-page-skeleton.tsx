/** Placeholder pendant le chargement client de la landing. */
export function LandingPageSkeleton() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-bg-alt" aria-busy="true" aria-label="Chargement">
      <div
        className="pointer-events-none absolute left-[6%] top-[-12%] h-[480px] w-[640px] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(49,91,203,0.26) 0%, rgba(114,84,214,0.16) 40%, transparent 70%)",
          filter: "blur(90px)",
        }}
        aria-hidden
      />
      <div className="relative animate-pulse">
        <div className="mx-auto max-w-6xl px-4 pt-3 sm:px-6">
          <div className="h-12 rounded-full border border-border bg-white/80" />
        </div>
        <div className="mx-auto max-w-3xl px-6 pb-10 pt-24 text-center">
          <div className="mx-auto h-3 w-40 rounded bg-[var(--color-border)]" />
          <div className="mx-auto mt-8 h-12 w-full max-w-lg rounded-xl bg-[var(--color-border)]" />
          <div className="mx-auto mt-3 h-12 w-full max-w-md rounded-xl bg-[var(--color-border)]" />
          <div className="mx-auto mt-8 h-11 w-48 rounded-full bg-[#dbe0ea]" />
        </div>
        <div className="mx-auto max-w-5xl px-6">
          <div className="h-[22rem] rounded-2xl border border-border bg-white" />
        </div>
      </div>
    </div>
  );
}
