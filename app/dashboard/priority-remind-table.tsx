"use client";

import { useMemo, type CSSProperties } from "react";
import type { Client } from "./types";
import { getClientReminderSentAt } from "@/lib/client-reminder-track";
import {
  daysFromTodayToDue,
  formatInvoiceDueDate,
  unpaidDueBucket,
} from "@/lib/dashboard-metrics";
import type { UiResolvedAppearance } from "@/lib/ui-theme";
import type { AppLocale } from "@/lib/app-locale";
import { useMoney } from "@/app/display-currency-context";
import { getDashboardHomeCopy, type DashboardHomeCopy } from "@/lib/messages/dashboard-home-copy";

const PREVIEW = 5;

type PriorityRemindTableProps = {
  clients: Client[];
  locale: AppLocale;
  appearance: UiResolvedAppearance;
  onRemind: (client: Client) => void;
  remindCooldownUntil: Record<string, number>;
  invoiceActionsDisabled?: boolean;
  onViewAll?: () => void;
};

function lastReminderLabel(clientId: string, t: DashboardHomeCopy): string {
  const raw = getClientReminderSentAt(clientId);
  if (!raw) return t.priorityNever;
  const at = new Date(raw);
  if (Number.isNaN(at.getTime())) return t.priorityNever;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(at);
  day.setHours(0, 0, 0, 0);
  const days = Math.round((today.getTime() - day.getTime()) / (24 * 60 * 60 * 1000));
  if (days <= 0) return t.priorityDaysAgo(0);
  return t.priorityDaysAgo(days);
}

export function PriorityRemindTable({
  clients,
  locale,
  appearance,
  onRemind,
  remindCooldownUntil,
  invoiceActionsDisabled,
  onViewAll,
}: PriorityRemindTableProps) {
  void appearance;
  const t = getDashboardHomeCopy(locale);
  const money = useMoney();

  const ranked = useMemo(() => {
    return clients
      .filter((c) => c.status === "unpaid")
      .map((c) => ({
        client: c,
        days: daysFromTodayToDue(c.dueDate) ?? 0,
        bucket: unpaidDueBucket(c.dueDate),
      }))
      .sort((a, b) => a.days - b.days);
  }, [clients]);

  const rows = ranked.slice(0, PREVIEW);
  const hasMore = ranked.length > PREVIEW;
  const nothingOverdue = ranked.every((r) => r.bucket !== "overdue");

  function statusChip(
    days: number,
    bucket: ReturnType<typeof unpaidDueBucket>,
    dueDate: string,
  ) {
    if (bucket === "overdue") {
      const n = Math.max(1, Math.abs(days));
      return {
        label: t.priorityStatusOverdue(n),
        className: "pp-dash-status-chip pp-dash-status-chip--overdue",
      };
    }
    if (bucket === "dueSoon") {
      return {
        label: t.priorityStatusDueIn(Math.max(days, 0)),
        className: "pp-dash-status-chip pp-dash-status-chip--due-soon",
      };
    }
    return {
      label: t.priorityStatusDueOn(formatInvoiceDueDate(dueDate, locale)),
      className: "pp-dash-status-chip pp-dash-status-chip--not-due",
    };
  }

  return (
    <section
      className="pp-dash-card pp-dash-blur-in p-4 sm:p-5"
      style={{ "--pp-rise-delay": "0.22s" } as CSSProperties}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-tight text-[var(--pp-dash-ink)]">
          {t.priorityTitle}
        </h3>
        {hasMore && onViewAll ? (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-medium text-[var(--pp-dash-link)] hover:underline"
          >
            {t.priorityViewAll}
          </button>
        ) : null}
      </div>

      {ranked.length === 0 || nothingOverdue ? (
        <p className="mt-4 text-sm text-[var(--pp-dash-muted)]">{t.priorityEmpty}</p>
      ) : null}

      {ranked.length > 0 && !nothingOverdue ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="text-[var(--pp-dash-muted)]">
                <th className="pb-2 pr-4 text-[11px] font-semibold uppercase tracking-[0.08em]">
                  {t.priorityClient}
                </th>
                <th className="pb-2 pr-4 text-[11px] font-semibold uppercase tracking-[0.08em]">
                  {t.priorityAmount}
                </th>
                <th className="pb-2 pr-4 text-[11px] font-semibold uppercase tracking-[0.08em]">
                  {t.priorityDue}
                </th>
                <th className="pb-2 pr-4 text-[11px] font-semibold uppercase tracking-[0.08em]">
                  {t.priorityLast}
                </th>
                <th className="pb-2 text-[11px] font-semibold uppercase tracking-[0.08em]">
                  {t.priorityAction}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ client: c, days, bucket }) => {
                const chip = statusChip(days, bucket, c.dueDate);
                const cooldown = remindCooldownUntil[c.id];
                const onCooldown = typeof cooldown === "number" && Date.now() < cooldown;
                return (
                  <tr key={c.id} className="pp-dash-row border-t border-[var(--pp-dash-line)]">
                    <td className="py-3.5 pr-4 font-medium tracking-tight text-[var(--pp-dash-ink)]">
                      {c.name}
                    </td>
                    <td className="py-3.5 pr-4 tabular-nums text-[var(--pp-dash-ink)]">
                      {money.format(c.amountDue)}
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className={chip.className}>{chip.label}</span>
                    </td>
                    <td className="py-3.5 pr-4 text-xs text-[var(--pp-dash-muted)]">
                      {lastReminderLabel(c.id, t)}
                    </td>
                    <td className="py-3.5">
                      <button
                        type="button"
                        disabled={invoiceActionsDisabled || onCooldown}
                        onClick={() => onRemind(c)}
                        className="pp-dash-btn-ink inline-flex rounded-lg px-3 py-1.5 text-xs disabled:opacity-50"
                      >
                        {t.priorityRemind}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
