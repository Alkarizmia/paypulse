"use client";

import { ACCENT } from "@/lib/brand-colors";

type LocaleCode = "fr" | "en";

/** Aperçu interface : liste dossiers (même logique que le tableau de bord). */
export function ProductTourClientsPreview({ locale }: { locale: LocaleCode }) {
  const t =
    locale === "fr"
      ? {
          win: "PayPulss – Dossiers",
          colClient: "Client / facture",
          colAmount: "Montant",
          colDue: "Échéance",
          colStatus: "Statut",
          r1: "Studio North",
          r1a: "1 240 €",
          r1d: "12 juin",
          s1: "En retard",
          r2: "Agence Lefèvre",
          r2a: "860 €",
          r2d: "3 juil.",
          s2: "Payé",
          r3: "Belair SRL",
          r3a: "2 100 €",
          r3d: "28 juin",
          s3: "En attente",
        }
      : {
          win: "PayPulss – Cases",
          colClient: "Client / invoice",
          colAmount: "Amount",
          colDue: "Due",
          colStatus: "Status",
          r1: "Studio North",
          r1a: "€1,240",
          r1d: "Jun 12",
          s1: "Overdue",
          r2: "Lefèvre Agency",
          r2a: "€860",
          r2d: "Jul 3",
          s2: "Paid",
          r3: "Belair LLC",
          r3a: "€2,100",
          r3d: "Jun 28",
          s3: "Pending",
        };

  const rows = [
    { name: t.r1, amount: t.r1a, due: t.r1d, status: t.s1, tone: "late" as const },
    { name: t.r2, amount: t.r2a, due: t.r2d, status: t.s2, tone: "paid" as const },
    { name: t.r3, amount: t.r3a, due: t.r3d, status: t.s3, tone: "wait" as const },
  ];

  return (
    <div className="absolute inset-0 flex flex-col bg-gradient-to-br from-slate-50 via-white to-violet-50/40">
      <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-red-400/90" aria-hidden />
        <span className="h-2 w-2 rounded-full bg-amber-400/90" aria-hidden />
        <span className="h-2 w-2 rounded-full bg-emerald-400/90" aria-hidden />
        <span className="truncate text-[10px] font-medium text-slate-500">{t.win}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden p-2 sm:p-3">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-2 border-b border-slate-100 px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400 sm:grid">
            <span className="truncate">{t.colClient}</span>
            <span>{t.colAmount}</span>
            <span>{t.colDue}</span>
            <span className="text-right">{t.colStatus}</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {rows.map((row) => (
              <li key={row.name} className="grid grid-cols-1 gap-1 px-2 py-2 text-[11px] sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-center sm:gap-2 sm:py-1.5">
                <span className="truncate font-medium text-slate-800">{row.name}</span>
                <span className="font-semibold tabular-nums text-slate-900 sm:text-right">{row.amount}</span>
                <span className="tabular-nums text-slate-500">{row.due}</span>
                <span className="sm:text-right">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      row.tone === "paid"
                        ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80"
                        : row.tone === "late"
                          ? "bg-orange-50 text-orange-800 ring-1 ring-orange-200/80"
                          : "bg-sky-50 text-sky-800 ring-1 ring-sky-200/80"
                    }`}
                  >
                    {row.status}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** Aperçu interface : brouillon de relance (comme dans l’app). */
export function ProductTourRemindersPreview({ locale }: { locale: LocaleCode }) {
  const t =
    locale === "fr"
      ? {
          win: "Prévisualisation relance",
          subj: "Objet",
          subjVal: "Rappel facture en attente",
          body: "Bonjour,\n\nPetit rappel pour la facture ci-jointe. Merci de nous indiquer la date de règlement prévue.\n\nCordialement",
          cta: "Envoyer relance",
        }
      : {
          win: "Reminder preview",
          subj: "Subject",
          subjVal: "Pending invoice reminder",
          body: "Hello,\n\nA quick reminder about the invoice below. Please let us know when you plan to pay.\n\nRegards",
          cta: "Send reminder",
        };

  return (
    <div className="absolute inset-0 flex flex-col bg-gradient-to-br from-emerald-50/80 via-white to-sky-50/60">
      <div className="flex shrink-0 items-center gap-2 border-b border-emerald-200/60 bg-white/90 px-3 py-2 backdrop-blur-sm">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#63D5D0]/15 text-[#63D5D0]">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </span>
        <span className="truncate text-[10px] font-medium text-slate-600">{t.win}</span>
      </div>
      <div className="min-h-0 flex-1 p-2 sm:p-3">
        <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-md shadow-slate-200/60">
          <label className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{t.subj}</label>
          <input
            readOnly
            type="text"
            value={t.subjVal}
            className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] font-medium text-slate-800"
          />
          <label className="mt-3 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
            {locale === "fr" ? "Message" : "Message"}
          </label>
          <textarea
            readOnly
            rows={4}
            value={t.body}
            className="mt-1 flex-1 resize-none rounded-lg border border-slate-200 bg-white px-2 py-2 font-mono text-[10px] leading-relaxed text-slate-700"
          />
          <div className="mt-3 flex justify-end">
            <span
              className="inline-flex items-center rounded-full px-3 py-1.5 text-[10px] font-semibold text-white shadow-md"
              style={{ background: `linear-gradient(90deg, ${ACCENT}, #9AE8E4)` }}
            >
              {t.cta}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
