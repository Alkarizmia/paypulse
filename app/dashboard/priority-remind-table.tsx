"use client";

import { useMemo } from "react";
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
  const light = appearance === "light";
  const t = getDashboardHomeCopy(locale);
  const money = useMoney();

  const priority = useMemo(() => {
    return clients
      .filter((c) => c.status === "unpaid" && isOverdue(c.dueDate))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 8);
  }, [clients]);

  return (
    <section
      className={`rounded-2xl border p-4 sm:p-5 ${
        light ? "border-slate-200 bg-white" : "border-white/[0.08] bg-[#14141c]"
      }`}
    >
      <h3 className={`text-sm font-semibold ${light ? "text-slate-900" : "text-white"}`}>{t.priorityTitle}</h3>
      {priority.length === 0 ? (
        <p className={`mt-4 text-sm ${light ? "text-slate-600" : "text-slate-400"}`}>{t.priorityEmpty}</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className={light ? "text-slate-500" : "text-slate-400"}>
                <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-wide">{t.priorityClient}</th>
                <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-wide">{t.priorityAmount}</th>
                <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-wide">{t.priorityDue}</th>
                <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-wide">{t.priorityLast}</th>
                <th className="pb-2 text-xs font-semibold uppercase tracking-wide">{t.priorityAction}</th>
              </tr>
            </thead>
            <tbody>
              {priority.map((c) => {
                const cooldown = remindCooldownUntil[c.id];
                const onCooldown = typeof cooldown === "number" && Date.now() < cooldown;
                const reminded = wasClientReminderSent(c.id);
                return (
                  <tr
                    key={c.id}
                    className={`border-t ${light ? "border-slate-100" : "border-white/[0.06]"}`}
                  >
                    <td className={`py-3 pr-4 font-medium ${light ? "text-slate-900" : "text-white"}`}>{c.name}</td>
                    <td className={`py-3 pr-4 tabular-nums ${light ? "text-slate-700" : "text-slate-200"}`}>
                      {money.format(c.amountDue)}
                    </td>
                    <td className={`py-3 pr-4 ${light ? "text-slate-600" : "text-slate-400"}`}>{c.dueDate}</td>
                    <td className={`py-3 pr-4 text-xs ${light ? "text-slate-500" : "text-slate-500"}`}>
                      {reminded ? t.priorityYesterday : t.priorityNever}
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        disabled={invoiceActionsDisabled || onCooldown || c.status !== "unpaid"}
                        onClick={() => onRemind(c)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                          light
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "bg-emerald-600/90 text-white hover:bg-emerald-600"
                        }`}
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
