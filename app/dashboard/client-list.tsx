"use client";

import { useMoney } from "@/app/display-currency-context";
import type { UiResolvedAppearance } from "@/lib/ui-theme";
import type { Client } from "./types";

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
  /** Tag Intl (ex. fr-FR, nl-NL). */
  formatLocale?: string;
  /** Cartes plus serrées (préférence profil). */
  compact?: boolean;
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
  formatLocale = "fr-FR",
  compact = false,
  labels,
}: ClientListProps) {
  const money = useMoney();
  const dateFmt = new Intl.DateTimeFormat(formatLocale, {
    dateStyle: "medium",
  });
  const light = appearance === "light";

  /** Mode compact : écart visuel net vs confort (padding, typo, zone actions). */
  const d = compact
    ? {
        wrap: "p-2.5 sm:p-4",
        headMb: "mb-2 sm:mb-3",
        title: "text-base font-bold tracking-tight",
        subtitle: "mt-0.5 text-xs leading-snug",
        grid: "grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5",
        card: "rounded-xl p-2.5 sm:p-3.5",
        topRow: "gap-1.5 sm:flex-row sm:items-start sm:justify-between",
        h3: "break-words text-sm font-semibold leading-snug",
        company: "text-[10px] leading-tight",
        email: "mt-0.5 break-all text-[11px] leading-snug sm:text-xs",
        lower: "mt-2 flex min-w-0 flex-col gap-1.5 border-t pt-2 sm:mt-2 sm:flex-row sm:items-end sm:justify-between sm:gap-2 sm:pt-2",
        dueLab: "text-[10px] uppercase tracking-wide",
        dueVal: "text-[11px] sm:text-xs",
        amount: "mt-0.5 text-sm font-semibold tabular-nums sm:text-base",
        btnRow: "flex w-full flex-col items-stretch gap-1.5 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-1",
        markPaid:
          "inline-flex h-8 w-full items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-xs font-bold text-emerald-700 transition hover:bg-emerald-500/15 sm:h-7 sm:w-7",
        remind:
          "pp-dash-btn-ink inline-flex w-full items-center justify-center px-2.5 py-1.5 text-[11px] disabled:cursor-not-allowed sm:w-auto",
        trash:
          "pp-dash-btn-ghost inline-flex w-full items-center justify-center px-2.5 py-1.5 text-[11px] text-red-600 sm:w-auto",
        badgePad: "px-2 py-0.5 text-[11px]",
        uturnWrap:
          "pp-dash-btn-ghost inline-flex h-6 w-6 shrink-0 items-center justify-center text-[var(--pp-dash-ink)]",
        uturnIcon: "h-3 w-3",
      }
    : {
        wrap: "p-4 sm:p-8",
        headMb: "mb-5 sm:mb-6",
        title: "text-lg font-bold tracking-tight",
        subtitle: "mt-1 text-sm",
        grid: "grid gap-3 sm:grid-cols-2 sm:gap-4",
        card: "rounded-2xl p-4 sm:p-5",
        topRow: "gap-3 sm:flex-row sm:items-start sm:justify-between",
        h3: "break-words font-semibold",
        company: "text-xs",
        email: "mt-1 break-all text-xs sm:text-sm",
        lower:
          "mt-3 flex min-w-0 flex-col gap-2 border-t pt-3 sm:mt-4 sm:flex-row sm:items-end sm:justify-between sm:gap-3 sm:pt-3.5",
        dueLab: "text-xs uppercase tracking-wide",
        dueVal: "text-xs sm:text-sm",
        amount: "mt-1 text-base font-semibold tabular-nums sm:text-lg",
        btnRow: "flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-1.5",
        markPaid:
          "inline-flex h-9 w-full items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-sm font-bold text-emerald-700 transition hover:bg-emerald-500/15 sm:h-8 sm:w-8",
        remind:
          "pp-dash-btn-ink inline-flex w-full items-center justify-center px-3.5 py-2 text-xs disabled:cursor-not-allowed sm:w-auto",
        trash:
          "pp-dash-btn-ghost inline-flex w-full items-center justify-center px-3.5 py-2 text-xs text-red-600 sm:w-auto",
        badgePad: "px-2.5 py-1 text-xs",
        uturnWrap:
          "pp-dash-btn-ghost inline-flex h-7 w-7 shrink-0 items-center justify-center text-[var(--pp-dash-ink)]",
        uturnIcon: "h-3.5 w-3.5",
      };

  if (clients.length === 0) {
    return (
      <div className="pp-dash-panel pp-dashboard-card-interactive border-dashed p-7 text-center sm:p-12">
        <p className="text-sm font-medium tracking-tight text-[var(--pp-dash-ink)] sm:text-base">
          {labels?.emptyTitle ?? "Aucun client pour le moment, ajoute ton premier client"}
        </p>
        <p className="mt-2 text-sm text-[var(--pp-dash-muted)]">
          {labels?.emptyBody ?? "Ajoute ta première fiche client pour démarrer le suivi des paiements."}
        </p>
      </div>
    );
  }

  return (
    <section className={`pp-dash-panel pp-dash-blur-in min-w-0 ${d.wrap}`} style={{ ["--pp-rise-delay" as string]: "0.34s" }}>
      <div className={d.headMb}>
        <h2 className={`${d.title} text-[var(--pp-dash-ink)]`}>{labels?.title ?? "Vos clients"}</h2>
        <p className={`${d.subtitle} text-[var(--pp-dash-muted)]`}>
          {labels?.subtitle ?? "Statut des montants et relances, relance via votre messagerie (mailto)."}
        </p>
      </div>
      <div className={d.grid}>
        {clients.map((client) => {
          const cooldownUntil = remindCooldownUntil?.[client.id];
          const remindLocked =
            client.status === "paid" ||
            (typeof cooldownUntil === "number" && Date.now() < cooldownUntil);
          return (
          <article
            key={client.id}
            className={`pp-dashboard-card-interactive pp-dash-glass min-w-0 ${d.card}`}
          >
            <div className={`flex min-w-0 flex-col ${d.topRow}`}>
              <div className="min-w-0">
                <h3 className={`${d.h3} tracking-tight text-[var(--pp-dash-ink)]`}>{client.name}</h3>
                {client.companyName && (
                  <p className={`${d.company} text-[var(--pp-dash-muted)]`}>{client.companyName}</p>
                )}
                <p className={`${d.email} text-[var(--pp-dash-muted)]`}>{client.email}</p>
              </div>
              {client.status === "paid" ? (
                <span className="inline-flex items-center gap-1.5 self-start sm:self-auto">
                  <span
                    className={`${d.badgePad} inline-flex items-center rounded-lg font-semibold ring-1 ring-inset ${
                      light
                        ? "bg-emerald-500/10 text-emerald-800 ring-emerald-500/20"
                        : "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30"
                    }`}
                  >
                    {labels?.paid ?? "Payé"}
                  </span>
                  {onAdvanceNextCycle ? (
                    <button
                      type="button"
                      onClick={() => onAdvanceNextCycle(client.id)}
                      className={d.uturnWrap}
                      title={labels?.nextCycle ?? "Mois suivant : repasser en impayé"}
                      aria-label={labels?.nextCycle ?? "Mois suivant : repasser en impayé"}
                    >
                      <UturnIcon className={d.uturnIcon} />
                    </button>
                  ) : null}
                </span>
              ) : (
                <span
                  className={`${d.badgePad} inline-flex items-center self-start rounded-lg font-semibold ring-1 ring-inset sm:self-auto ${
                    light
                      ? "bg-orange-500/10 text-orange-700 ring-orange-500/25"
                      : "bg-orange-500/15 text-orange-300 ring-orange-500/35"
                  }`}
                >
                  {labels?.unpaid ?? "Impayé"}
                </span>
              )}
            </div>
            <div className={`${d.lower} border-[var(--pp-dash-line)]`}>
              <div className="min-w-0">
                <p className={`${d.dueLab} text-[var(--pp-dash-muted)]`}>{labels?.due ?? "Échéance"}</p>
                <p className={`${d.dueVal} text-[var(--pp-dash-muted)]`}>
                  {dateFmt.format(new Date(client.dueDate + "T12:00:00"))}
                </p>
                <p className={`${d.amount} tracking-tight text-[var(--pp-dash-ink)]`}>{money.format(client.amountDue)}</p>
              </div>
              <div className={d.btnRow}>
                {client.status === "unpaid" ? (
                  <button
                    type="button"
                    onClick={() => onMarkPaid(client.id)}
                    className={d.markPaid}
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
                  className={d.remind}
                >
                  {labels?.remind ?? "Envoyer relance"}
                </button>
                {hideDelete ? null : (
                  <button type="button" onClick={() => onDelete(client.id)} className={d.trash}>
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
