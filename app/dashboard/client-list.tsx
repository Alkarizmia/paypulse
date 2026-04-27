"use client";

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
  onDelete: (clientId: string) => void;
  onMarkPaid: (clientId: string) => void;
  /** Prochaine facture : repasse en impayé, conserve l’historique d’encaissement. */
  onAdvanceNextCycle?: (clientId: string) => void;
  /** Masque la corbeille (ex. membre invité lecture seule). */
  hideDelete?: boolean;
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
  onDelete,
  onMarkPaid,
  onAdvanceNextCycle,
  hideDelete,
  labels,
}: ClientListProps) {
  if (clients.length === 0) {
    return (
      <div className="pp-dashboard-card-interactive rounded-2xl border border-dashed border-white/15 bg-[#12121a] p-12 text-center hover:border-white/25">
        <p className="text-base font-medium text-slate-100">
          {labels?.emptyTitle ?? "Aucun client pour le moment, ajoute ton premier client"}
        </p>
        <p className="mt-2 text-sm text-slate-400">
          {labels?.emptyBody ?? "Ajoute ta première fiche client pour démarrer le suivi des paiements."}
        </p>
      </div>
    );
  }

  return (
    <section className="pp-dashboard-card-interactive rounded-2xl border border-white/[0.08] bg-[#14141c] p-6 sm:p-8 hover:border-white/15">
      <div className="mb-6">
        <h2 className="text-lg font-bold tracking-tight text-white">
          {labels?.title ?? "Vos clients"}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          {labels?.subtitle ?? "Statut des montants et relances (simulation email)."}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {clients.map((client) => (
          <article
            key={client.id}
            className="pp-dashboard-card-interactive rounded-2xl border border-white/[0.08] bg-[#1a1a22] p-5 hover:border-violet-500/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-white">{client.name}</h3>
                {client.companyName && <p className="text-xs text-slate-500">{client.companyName}</p>}
                <p className="mt-1 text-sm text-slate-400">{client.email}</p>
              </div>
              {client.status === "paid" ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-500/30">
                    {labels?.paid ?? "Payé"}
                  </span>
                  {onAdvanceNextCycle ? (
                    <button
                      type="button"
                      onClick={() => onAdvanceNextCycle(client.id)}
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-sky-500/40 bg-sky-500/10 text-sky-300 transition hover:border-sky-400/60 hover:bg-sky-500/20 hover:text-sky-200"
                      title={labels?.nextCycle ?? "Mois suivant : repasser en impayé"}
                      aria-label={labels?.nextCycle ?? "Mois suivant : repasser en impayé"}
                    >
                      <UturnIcon className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-orange-500/15 px-2.5 py-1 text-xs font-semibold text-orange-300 ring-1 ring-inset ring-orange-500/35">
                  {labels?.unpaid ?? "Impayé"}
                </span>
              )}
            </div>
            <div className="mt-5 flex items-end justify-between gap-3 border-t border-white/[0.06] pt-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {labels?.due ?? "Échéance"}
                </p>
                <p className="text-sm text-slate-300">
                  {dateFmt.format(new Date(client.dueDate + "T12:00:00"))}
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-white">
                  {money.format(client.amountDue)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {client.status === "unpaid" ? (
                  <button
                    type="button"
                    onClick={() => onMarkPaid(client.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/20"
                    title={labels?.markPaid ?? "Marquer comme payé"}
                    aria-label={labels?.markPaid ?? "Marquer comme payé"}
                  >
                    ✓
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={client.status === "paid"}
                  onClick={() => onSendReminder(client)}
                  className="inline-flex items-center justify-center rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-violet-900/40 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500 disabled:shadow-none"
                >
                  {labels?.remind ?? "Envoyer relance"}
                </button>
                {hideDelete ? null : (
                  <button
                    type="button"
                    onClick={() => onDelete(client.id)}
                    className="inline-flex items-center justify-center rounded-lg border border-red-500/35 bg-red-500/10 px-3.5 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/20"
                  >
                    {labels?.delete ?? "Supprimer"}
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
