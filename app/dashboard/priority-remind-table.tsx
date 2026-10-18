"use client";

import { useMemo, type CSSProperties } from "react";
import type { Client } from "./types";
import { wasClientReminderSent } from "@/lib/client-reminder-track";
import type { UiResolvedAppearance } from "@/lib/ui-theme";
import type { AppLocale } from "@/lib/app-locale";
import { useMoney } from "@/app/display-currency-context";
import { getDashboardHomeCopy } from "@/lib/messages/dashboard-home-copy";

function isOverdue(dueDate: string): boolean {
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

type PriorityRemindTableProps = {
  clients: Client[];
  locale: AppLocale;
  appearance: UiResolvedAppearance;
  onRemind: (client: Client) => void;
  remindCooldownUntil: Record<string, number>;
  /** Spectateur : pas de relance. */
  invoiceActionsDisabled?: boolean;
};

export function PriorityRemindTable({
  clients,
  locale,
  appearance,
  onRemind,
  remindCooldownUntil,
  invoiceActionsDisabled,
}: PriorityRemindTableProps) {
  void appearance;
  const t = getDashboardHomeCopy(locale);
  const money = useMoney();

  const priority = useMemo(() => {
    return clients
      .filter((c) => c.status === "unpaid" && isOverdue(c.dueDate))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 8);
  }, [clients]);

  return (
    <section className="pp-dash-panel pp-dash-blur-in p-4 sm:p-5" style={{ "--pp-rise-delay": "0.28s" } as CSSProperties}>
      <h3 className="text-sm font-semibold tracking-tight text-[var(--pp-dash-ink)]">{t.priorityTitle}</h3>
      {priority.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--pp-dash-muted)]">{t.priorityEmpty}</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="text-[var(--pp-dash-muted)]">
                <th className="pb-2 pr-4 text-[11px] font-semibold uppercase tracking-[0.08em]">{t.priorityClient}</th>
                <th className="pb-2 pr-4 text-[11px] font-semibold uppercase tracking-[0.08em]">{t.priorityAmount}</th>
                <th className="pb-2 pr-4 text-[11px] font-semibold uppercase tracking-[0.08em]">{t.priorityDue}</th>
                <th className="pb-2 pr-4 text-[11px] font-semibold uppercase tracking-[0.08em]">{t.priorityLast}</th>
                <th className="pb-2 text-[11px] font-semibold uppercase tracking-[0.08em]">{t.priorityAction}</th>
              </tr>
            </thead>
            <tbody>
              {priority.map((c) => {
                const cooldown = remindCooldownUntil[c.id];
                const onCooldown = typeof cooldown === "number" && Date.now() < cooldown;
                const reminded = wasClientReminderSent(c.id);
                return (
                  <tr key={c.id} className="pp-dash-row border-t border-[var(--pp-dash-line)]">
                    <td className="py-3.5 pr-4 font-medium tracking-tight text-[var(--pp-dash-ink)]">{c.name}</td>
                    <td className="py-3.5 pr-4 tabular-nums text-[var(--pp-dash-ink)]">{money.format(c.amountDue)}</td>
                    <td className="py-3.5 pr-4 text-[var(--pp-dash-muted)]">{c.dueDate}</td>
                    <td className="py-3.5 pr-4 text-xs text-[var(--pp-dash-muted)]">
                      {reminded ? t.priorityYesterday : t.priorityNever}
                    </td>
                    <td className="py-3.5">
                      <button
                        type="button"
                        disabled={invoiceActionsDisabled || onCooldown || c.status !== "unpaid"}
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
      )}
    </section>
  );
}
