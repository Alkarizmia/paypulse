"use client";

import { useCallback, useId, useMemo, useState } from "react";
import type { Client } from "@/app/dashboard/types";
import { sortClientsForRelanceList } from "@/lib/dashboard-metrics";
import type { PlanId } from "@/lib/plans";
import { getMaxBulkMailRecipients } from "@/lib/plans";
import { buildMailtoBccRecipients, buildMailtoSingleRecipient, MAILTO_HREF_SAFE_MAX } from "@/lib/mailto-build";
import { intlLocaleFor, type AppLocale } from "@/lib/app-locale";
import { useMoney } from "@/app/display-currency-context";

type RecipientTab = "everyone" | "list" | "manual";

type Labels = {
  sendNow: string;
  envelopeAria: string;
  modalTitle: string;
  modalHint: string;
  previewHeading: string;
  toLabel: string;
  toPlaceholder: string;
  copy: string;
  copied: string;
  openMail: string;
  cancel: string;
  tabEveryone: string;
  tabList: string;
  tabManual: string;
  listTitle: string;
  listHint: string;
  listEmpty: string;
  listOpenMailDisabled: string;
  everyoneSummary: (n: number) => string;
  everyoneEmpty: string;
  /** Même ordre d’e-mails que l’envoi, si le total du tableau de bord dépasse le plafond. */
  everyoneCapped: (included: number, totalAddresses: number) => string;
  toggleSelectAria: string;
  mailtoTooLong: string;
  statusPaid: string;
  statusUnpaid: string;
  /** Fiches cochées, e-mails uniques, plafond (affiche l’explication si 2 fiches = 1 e-mail). */
  listSelectedSummary: (rowCount: number, distinctEmailCount: number, max: number) => string;
  listLimitReached: (max: number) => string;
};

type Props = {
  subject: string;
  body: string;
  labels: Labels;
  clients: Client[];
  locale: AppLocale;
  planId: PlanId;
};

/** Enveloppe : envoi manuel via client mail (mailto) + modale copier / prévisualiser. */
export function EnvelopeSendButton({ subject, body, labels, clients, locale, planId }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<RecipientTab>("everyone");
  const [manualTo, setManualTo] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [copied, setCopied] = useState(false);
  const [listLimitHint, setListLimitHint] = useState<string | null>(null);
  const titleId = useId();

  const maxRecipients = useMemo(() => getMaxBulkMailRecipients(planId), [planId]);

  const activeClients = useMemo(() => clients.filter((c) => !c.deletedAt), [clients]);
  const sortedForList = useMemo(() => sortClientsForRelanceList(activeClients), [activeClients]);

  const everyoneEmails = useMemo(
    () =>
      [...new Set(activeClients.map((c) => c.email.trim().toLowerCase()).filter(Boolean))],
    [activeClients],
  );

  const everyoneForSend = useMemo(() => everyoneEmails.slice(0, maxRecipients), [everyoneEmails, maxRecipients]);
  const everyoneIsCapped = everyoneEmails.length > maxRecipients;

  const listEmails = useMemo(() => {
    const set = new Set<string>();
    for (const c of activeClients) {
      if (selectedIds.has(c.id)) {
        const e = c.email.trim().toLowerCase();
        if (e) set.add(e);
      }
    }
    return [...set];
  }, [activeClients, selectedIds]);

  const listRowCount = useMemo(
    () => activeClients.reduce((n, c) => n + (selectedIds.has(c.id) ? 1 : 0), 0),
    [activeClients, selectedIds],
  );

  const listEmailsCapped = useMemo(() => listEmails.slice(0, maxRecipients), [listEmails, maxRecipients]);

  const mailtoHref = useMemo(() => {
    if (tab === "manual") return buildMailtoSingleRecipient(manualTo, subject, body);
    if (tab === "everyone") return buildMailtoBccRecipients(everyoneForSend, subject, body);
    return buildMailtoBccRecipients(listEmailsCapped, subject, body);
  }, [tab, manualTo, subject, body, everyoneForSend, listEmailsCapped]);

  const mailtoTooLong = mailtoHref.length > MAILTO_HREF_SAFE_MAX;

  const canOpenMail = useMemo(() => {
    if (mailtoTooLong) return false;
    if (tab === "manual") return true;
    if (tab === "everyone") return everyoneForSend.length > 0;
    return listEmailsCapped.length > 0;
  }, [mailtoTooLong, tab, everyoneForSend.length, listEmailsCapped.length]);

  const handleCopy = useCallback(async () => {
    const toLine =
      tab === "manual"
        ? `${labels.toLabel}: ${manualTo || "–"}`
        : tab === "everyone"
          ? (() => {
              const base = labels.everyoneSummary(everyoneForSend.length);
              if (!everyoneIsCapped) return base;
              return `${base}\n${labels.everyoneCapped(everyoneForSend.length, everyoneEmails.length)}`;
            })()
          : `${labels.listSelectedSummary(listRowCount, listEmails.length, maxRecipients)}`;
    const text = `${toLine}\n\n${subject}\n\n${body}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [
    body,
    everyoneForSend.length,
    everyoneIsCapped,
    everyoneEmails.length,
    labels,
    listEmails.length,
    listRowCount,
    manualTo,
    maxRecipients,
    subject,
    tab,
  ]);

  const money = useMoney();
  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat(intlLocaleFor(locale), { dateStyle: "medium" }),
    [locale],
  );

  const toggleSelected = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        if (prev.has(id)) {
          queueMicrotask(() => setListLimitHint(null));
          const n = new Set(prev);
          n.delete(id);
          return n;
        }
        const next = new Set(prev);
        next.add(id);
        const emails = new Set<string>();
        for (const c of activeClients) {
          if (next.has(c.id)) {
            const e = c.email.trim().toLowerCase();
            if (e) emails.add(e);
          }
        }
        if (emails.size > maxRecipients) {
          queueMicrotask(() => setListLimitHint(labels.listLimitReached(maxRecipients)));
          return prev;
        }
        queueMicrotask(() => setListLimitHint(null));
        return next;
      });
    },
    [activeClients, labels, maxRecipients],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setCopied(false);
          setListLimitHint(null);
          setTab("everyone");
          setSelectedIds(new Set());
        }}
        className="inline-flex items-center gap-2 rounded-xl border border-fuchsia-400/40 bg-fuchsia-600/25 px-4 py-2.5 text-sm font-semibold text-fuchsia-50 shadow-[0_0_24px_-8px_rgba(232,121,249,0.5)] transition hover:bg-fuchsia-600/40 hover:border-fuchsia-300/50"
        aria-label={labels.envelopeAria}
      >
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
          />
        </svg>
        {labels.sendNow}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/[0.1] bg-[#12121a] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 id={titleId} className="text-base font-semibold text-white">
              {labels.modalTitle}
            </h4>
            <p className="mt-2 text-xs text-slate-400">{labels.modalHint}</p>

            <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Recipients">
              {(
                [
                  ["everyone", labels.tabEveryone],
                  ["list", labels.tabList],
                  ["manual", labels.tabManual],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={tab === k}
                  onClick={() => setTab(k)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    tab === k ? "bg-fuchsia-600 text-white" : "border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "manual" ? (
              <>
                <label className="mt-4 block text-xs font-medium text-slate-400">{labels.toLabel}</label>
                <input
                  type="email"
                  value={manualTo}
                  onChange={(e) => setManualTo(e.target.value)}
                  placeholder={labels.toPlaceholder}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-fuchsia-500/50 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/40"
                  autoComplete="email"
                />
              </>
            ) : null}

            {tab === "everyone" ? (
              <div className="mt-4 space-y-2 rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2 text-sm text-slate-200">
                {everyoneEmails.length > 0 ? (
                  <>
                    <p>{labels.everyoneSummary(everyoneForSend.length)}</p>
                    {everyoneIsCapped ? <p className="text-xs text-amber-200/95">{labels.everyoneCapped(everyoneForSend.length, everyoneEmails.length)}</p> : null}
                  </>
                ) : (
                  <p>{labels.everyoneEmpty}</p>
                )}
              </div>
            ) : null}

            {tab === "list" ? (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-slate-300">{labels.listTitle}</p>
                <p className="text-[11px] leading-snug text-slate-500">{labels.listHint}</p>
                {sortedForList.length === 0 ? (
                  <p className="text-sm text-slate-500">{labels.listEmpty}</p>
                ) : (
                  <ul className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-white/[0.08] bg-black/25 p-2">
                    {sortedForList.map((c) => {
                      const on = selectedIds.has(c.id);
                      return (
                        <li
                          key={c.id}
                          className="flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5 hover:border-white/[0.06] hover:bg-white/[0.03]"
                        >
                          <button
                            type="button"
                            onClick={() => toggleSelected(c.id)}
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-sm font-bold ${
                              on
                                ? "border-emerald-500/50 bg-emerald-950/50 text-emerald-300"
                                : "border-white/10 bg-black/40 text-slate-500"
                            }`}
                            aria-pressed={on}
                            aria-label={labels.toggleSelectAria}
                            title={labels.toggleSelectAria}
                          >
                            v
                          </button>
                          <div className="min-w-0 flex-1 text-left">
                            <p className="truncate text-xs font-medium text-white">{c.name}</p>
                            <p className="truncate text-[11px] text-slate-500">{c.email}</p>
                          </div>
                          <div className="shrink-0 text-right text-[10px] text-slate-500">
                            <p className="tabular-nums text-slate-400">{money.format(c.amountDue)}</p>
                            <p>{dateFmt.format(new Date(c.dueDate + "T12:00:00"))}</p>
                            <p className={c.status === "paid" ? "text-emerald-400/90" : "text-amber-300/90"}>
                              {c.status === "paid" ? labels.statusPaid : labels.statusUnpaid}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {listRowCount > 0 ? (
                  <p className="text-xs text-violet-300/90">
                    {labels.listSelectedSummary(listRowCount, listEmails.length, maxRecipients)}
                  </p>
                ) : null}
                {listLimitHint ? <p className="text-xs text-amber-200/90">{listLimitHint}</p> : null}
              </div>
            ) : null}

            <div className="mt-4 rounded-lg border border-white/[0.08] bg-black/30 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{labels.previewHeading}</p>
              <p className="mt-2 text-xs font-medium text-fuchsia-200/90">{subject || "–"}</p>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-300">
                {body || "–"}
              </pre>
            </div>

            {mailtoTooLong ? <p className="mt-3 text-xs text-amber-300/90">{labels.mailtoTooLong}</p> : null}

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="rounded-lg border border-white/[0.12] bg-white/[0.06] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.1]"
              >
                {copied ? labels.copied : labels.copy}
              </button>
              {canOpenMail ? (
                <a
                  href={mailtoHref}
                  className="inline-flex rounded-lg bg-fuchsia-600 px-3 py-2 text-xs font-semibold text-white hover:bg-fuchsia-500"
                >
                  {labels.openMail}
                </a>
              ) : (
                <span className="inline-flex cursor-not-allowed rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-500">
                  {tab === "list"
                    ? labels.listOpenMailDisabled
                    : tab === "everyone" && everyoneEmails.length === 0
                      ? labels.everyoneEmpty
                      : mailtoTooLong
                        ? labels.mailtoTooLong
                        : labels.openMail}
                </span>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
              >
                {labels.cancel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
