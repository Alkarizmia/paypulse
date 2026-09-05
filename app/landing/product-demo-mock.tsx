import { ACCENT } from "@/lib/brand-colors";

export function ProductDemoMock({
  demo,
  className,
}: {
  demo: {
    panelTitle: string;
    tabIn: string;
    tabOut: string;
    rowClient: string;
    rowAmount: string;
    rowStatus: string;
    dueLabel: string;
    toggleLabel: string;
    receiptTitle: string;
    receiptLine: string;
    receiptTotal: string;
    floatLabel: string;
  };
  className?: string;
}) {
  return (
    <div className={`relative mx-auto max-w-xl lg:mx-0 ${className ?? ""}`}>
      <div className="absolute -right-6 -top-4 z-10 hidden max-w-[200px] rounded-xl border border-white/10 bg-[#0a1f35] p-3 shadow-xl sm:block">
        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: ACCENT }}>
          {demo.floatLabel}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-xs text-slate-400">{demo.toggleLabel}</span>
          <button
            type="button"
            className="relative h-5 w-9 rounded-full bg-[#63D5D0]/30 transition"
            aria-label="Toggle"
          >
            <span className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-[#63D5D0] shadow" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>
          <span className="text-xs font-medium text-slate-500">{demo.panelTitle}</span>
          <span className="w-10" />
        </div>
        <div className="grid gap-0 sm:grid-cols-[1fr_140px]">
          <div className="border-b border-slate-100 p-4 sm:border-b-0 sm:border-r">
            <div className="flex gap-2 text-xs font-semibold">
              <span className="rounded-full bg-slate-900 px-3 py-1 text-white">{demo.tabIn}</span>
              <span className="rounded-full px-3 py-1 text-slate-500">{demo.tabOut}</span>
            </div>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 text-sm">
                <span className="font-medium text-slate-800">{demo.rowClient}</span>
                <span className="font-semibold text-slate-900">{demo.rowAmount}</span>
              </li>
              <li className="flex items-center justify-between rounded-xl border border-dashed border-slate-200 px-3 py-2.5 text-xs text-slate-500">
                <span>{demo.rowStatus}</span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                  {demo.dueLabel}
                </span>
              </li>
            </ul>
          </div>
          <div className="bg-slate-50/50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{demo.receiptTitle}</p>
            <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-start gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-500">
                  PDF
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-800">{demo.receiptLine}</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{demo.receiptTotal}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
