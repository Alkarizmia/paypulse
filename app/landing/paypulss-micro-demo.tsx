"use client";

import { useState } from "react";
import { useLocale } from "@/app/locale-context";

type Row = { id: string; name: string; amount: string; phase: 0 | 1 | 2 };

const INITIAL_ROWS: Row[] = [
  { id: "1", name: "Studio Mirabelle", amount: "1 890 €", phase: 0 },
  { id: "2", name: "Atelier Nord", amount: "640 €", phase: 1 },
  { id: "3", name: "Lefèvre & Co", amount: "2 100 €", phase: 2 },
];

/**
 * Démo 100 % locale : clics / interrupteur ne touchent pas au backend ni au compte.
 */
export function PaypulssMicroDemo({
  demoAnchor,
  pricingAnchor,
  /** Fond opaque (ex. section scroll-pin) : meilleure lisibilité, sans texte en transparence. */
  opaqueCard = false,
}: {
  demoAnchor: string;
  pricingAnchor: string;
  opaqueCard?: boolean;
}) {
  const { locale } = useLocale();
  const [rows, setRows] = useState<Row[]>(INITIAL_ROWS);
  const [autoNudge, setAutoNudge] = useState(true);

  const t =
    locale === "fr"
      ? {
          title: "Mini zone de test",
          subtitle: "Quelques gestes du produit, sans compte et sans envoi de données.",
          colClient: "Client",
          colAmount: "Montant",
          colStatus: "Statut",
          toggle: "Rappel auto (démo)",
          hint: "Cliquez une ligne pour faire tourner le statut.",
          st0: "En attente",
          st1: "Relancé",
          st2: "Payé",
          ctaDemo: "Voir la démo complète",
          ctaPricing: "Voir les offres",
        }
      : {
          title: "Try-it sandbox",
          subtitle: "A few product gestures. No account, nothing is sent.",
          colClient: "Client",
          colAmount: "Amount",
          colStatus: "Status",
          toggle: "Auto nudge (demo)",
          hint: "Click a row to cycle the status.",
          st0: "Pending",
          st1: "Nudged",
          st2: "Paid",
          ctaDemo: "Full interactive preview",
          ctaPricing: "See plans",
        };

  function cycleRow(id: string) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, phase: ((r.phase + 1) % 3) as 0 | 1 | 2 } : r)),
    );
  }

  function chip(phase: 0 | 1 | 2) {
    const base = "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide";
    if (phase === 0) return `${base} bg-amber-100 text-amber-900 ring-1 ring-amber-200/80`;
    if (phase === 1) return `${base} bg-violet-100 text-violet-900 ring-1 ring-violet-200/80`;
    return `${base} bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80`;
  }

  function label(phase: 0 | 1 | 2) {
    return phase === 0 ? t.st0 : phase === 1 ? t.st1 : t.st2;
  }

  return (
    <div
      className={
        opaqueCard
          ? "w-full max-w-md rounded-2xl border border-slate-200/90 bg-white p-4 shadow-lg shadow-slate-900/10 ring-1 ring-slate-200/50 sm:p-5"
          : "w-full max-w-md rounded-2xl border border-slate-200/90 bg-white/90 p-4 shadow-lg shadow-slate-900/10 ring-1 ring-white/80 backdrop-blur-md sm:p-5"
      }
    >
      <div className="flex flex-col gap-1 border-b border-slate-100 pb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t.title}</p>
        <p className="text-xs leading-snug text-slate-600">{t.subtitle}</p>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
        <span className="text-xs font-medium text-slate-700">{t.toggle}</span>
        <button
          type="button"
          role="switch"
          aria-checked={autoNudge}
          onClick={() => setAutoNudge((v) => !v)}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
            autoNudge ? "bg-emerald-500" : "bg-slate-300"
          }`}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
              autoNudge ? "left-5" : "left-0.5"
            }`}
          />
        </button>
      </div>

      <p className="mt-2 text-[11px] text-slate-500">{t.hint}</p>

      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 border-b border-slate-100 bg-slate-50/90 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          <span>{t.colClient}</span>
          <span className="text-right">{t.colAmount}</span>
          <span className="text-right">{t.colStatus}</span>
        </div>
        {rows.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => cycleRow(r.id)}
            className="grid w-full grid-cols-[1fr_auto_auto] gap-2 border-b border-slate-100 px-2 py-2 text-left text-xs transition hover:bg-slate-50/90 last:border-b-0"
          >
            <span className="truncate font-medium text-slate-800">{r.name}</span>
            <span className="text-right tabular-nums text-slate-700">{r.amount}</span>
            <span className="flex justify-end">
              <span className={chip(r.phase)}>{label(r.phase)}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <a
          href={`#${demoAnchor}`}
          className="inline-flex flex-1 items-center justify-center rounded-xl bg-slate-900 px-3 py-2.5 text-center text-xs font-semibold text-white transition hover:bg-slate-800"
        >
          {t.ctaDemo}
        </a>
        <a
          href={`#${pricingAnchor}`}
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center text-xs font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
        >
          {t.ctaPricing}
        </a>
      </div>
    </div>
  );
}
