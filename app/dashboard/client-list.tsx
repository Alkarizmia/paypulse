"use client";

import type { UiResolvedAppearance } from "@/lib/ui-theme";
import type { Client } from "./types";

const money = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
});

type ClientListProps = {
  clients: Client[];
  onSendReminder: (client: Client) => void;
  /** Timestamp (ms): remind button disabled for that client until `Date.now() >= value`. */
  remindCooldownUntil?: Record<string, number>;
  onDelete: (clientId: string) => void;
  onMarkPaid: (clientId: string) => void;
  /** Prochaine facture : repasse en impayé, conserve l’historique d’encaissement. */
  onAdvanceNextCycle?: (clientId: string) => void;
  /** Masque la corbeille (ex. membre invité lecture seule). */
  hideDelete?: boolean;
  appearance: UiResolvedAppearance;
  labels?: {
    title: string;
    subtitle: string;
    emptyTitle: string;
    emptyBody: string;
    paid: string;
    unpaid: string;
    due: string;
    remind: string;
    delete: string;
    markPaid: string;
    nextCycle: string;
  };
};

function UturnIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
    </svg>
  );
}

export function ClientList({
  clients,
  onSendReminder,
  remindCooldownUntil,
  onDelete,
  onMarkPaid,
  onAdvanceNextCycle,
  hideDelete,
  appearance,
  labels,
}: ClientListProps) {
  const light = appearance === "light";
  if (clients.length === 0) {
    return (
      <div
        className={`pp-dashboard-card-interactive rounded-2xl border border-dashed p-7 text-center sm:p-12 ${
          light
            ? "border-slate-300 bg-white hover:border-slate-400"
            : "border-white/20 bg-[#14141c] hover:border-white/30"
        }`}
      >
        <p className={`text-sm font-medium sm:text-base ${light ? "text-slate-900" : "text-white"}`}>
          {labels?.emptyTitle ?? "Aucun client pour le moment, ajoute ton premier client"}
        </p>
        <p className={`mt-2 text-sm ${light ? "text-slate-600" : "text-slate-400"}`}>
          {labels?.emptyBody ?? "Ajoute ta première fiche client pour démarrer le suivi des paiements."}
        </p>
      </div>
    );
  }

  return (
    <section
      className={`pp-dashboard-card-interactive min-w-0 rounded-2xl border p-4 sm:p-8 ${
        light ? "border-slate-200 bg-white hover:border-slate-300" : "border-white/[0.08] bg-[#14141c] hover:border-white/12"
      }`}
    >
      <div className="mb-5 sm:mb-6">
        <h2 className={`text-lg font-bold tracking-tight ${light ? "text-slate-900" : "text-white"}`}>
          {labels?.title ?? "Vos clients"}
        </h2>
        <p className={`mt-1 text-sm ${light ? "text-slate-600" : "text-slate-400"}`}>
          {labels?.subtitle ?? "Statut des montants et relances, relance via votre messagerie (mailto)."}
        </p>
      </div>
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
        {clients.map((client) => {
          const cooldownUntil = remindCooldownUntil?.[client.id];
          const remindLocked =
            client.status === "paid" ||
            (typeof cooldownUntil === "number" && Date.now() < cooldownUntil);
          return (
          <article
            key={client.id}
            className={`pp-dashboard-card-interactive min-w-0 rounded-2xl border p-4 sm:p-5 ${
              light
                ? "border-slate-200 bg-slate-50 hover:border-violet-300/60"
                : "border-white/10 bg-black/25 hover:border-violet-500/40"
            }`}
          >
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className={`break-words font-semibold ${light ? "text-slate-900" : "text-white"}`}>{client.name}</h3>
                {client.companyName && <p className={`text-xs ${light ? "text-slate-500" : "text-slate-500"}`}>{client.companyName}</p>}
                <p className={`mt-1 break-all text-xs sm:text-sm ${light ? "text-slate-600" : "text-slate-300"}`}>{client.email}</p>
              </div>
              {client.status === "paid" ? (
                <span className="inline-flex items-center gap-1.5 self-start sm:self-auto">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                      light
                        ? "bg-emerald-100 text-emerald-800 ring-emerald-200"
                        : "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30"
                    }`}
                  >
                    {labels?.paid ?? "Payé"}
                  </span>
                  {onAdvanceNextCycle ? (
                    <button
                      type="button"
                      onClick={() => onAdvanceNextCycle(client.id)}
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-sky-300 bg-sky-100 text-sky-700 transition hover:border-sky-400 hover:bg-sky-200 hover:text-sky-800"
                      title={labels?.nextCycle ?? "Mois suivant : repasser en impayé"}
                      aria-label={labels?.nextCycle ?? "Mois suivant : repasser en impayé"}
                    >
                      <UturnIcon className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </span>
              ) : (
                <span
                  className={`inline-flex items-center self-start rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset sm:self-auto ${
                    light
                      ? "bg-orange-100 text-orange-700 ring-orange-300"
                      : "bg-orange-500/15 text-orange-300 ring-orange-500/35"
                  }`}
                >
                  {labels?.unpaid ?? "Impayé"}
                </span>
              )}
            </div>
            <div
              className={`mt-4 flex min-w-0 flex-col gap-3 border-t pt-3.5 sm:mt-5 sm:flex-row sm:items-end sm:justify-between sm:gap-3 sm:pt-4 ${
                light ? "border-slate-200" : "border-white/10"
              }`}
            >
              <div className="min-w-0">
                <p className={`text-xs uppercase tracking-wide ${light ? "text-slate-500" : "text-slate-500"}`}>
                  {labels?.due ?? "Échéance"}
                </p>
                <p className={`text-xs sm:text-sm ${light ? "text-slate-600" : "text-slate-300"}`}>
                  {dateFmt.format(new Date(client.dueDate + "T12:00:00"))}
                </p>
                <p className={`mt-1 text-base font-semibold tabular-nums sm:text-lg ${light ? "text-slate-900" : "text-white"}`}>
                  {money.format(client.amountDue)}
                </p>
              </div>
              <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-1.5">
                {client.status === "unpaid" ? (
                  <button
                    type="button"
                    onClick={() => onMarkPaid(client.id)}
                    className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-emerald-300 bg-emerald-100 text-sm font-bold text-emerald-700 transition hover:bg-emerald-200 sm:h-8 sm:w-8"
                    title={labels?.markPaid ?? "Marquer comme payé"}
                    aria-label={labels?.markPaid ?? "Marquer comme payé"}
                  >
                    ✓
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={remindLocked}
                  onClick={() => {
                    if (!remindLocked) onSendReminder(client);
                  }}
                  className={`inline-flex w-full items-center justify-center rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:shadow-none sm:w-auto ${
                    light ? "shadow-sm shadow-violet-200 disabled:bg-slate-200 disabled:text-slate-500" : "shadow-md shadow-black/30 disabled:bg-white/10 disabled:text-slate-500"
                  }`}
                >
                  {labels?.remind ?? "Envoyer relance"}
                </button>
                {hideDelete ? null : (
                  <button
                    type="button"
                    onClick={() => onDelete(client.id)}
                    className="inline-flex w-full items-center justify-center rounded-lg border border-red-300 bg-red-100 px-3.5 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-200 sm:w-auto"
                  >
                    {labels?.delete ?? "Supprimer"}
                  </button>
                )}
              </div>
            </div>
          </article>
        );
        })}
      </div>
    </section>
  );
}
