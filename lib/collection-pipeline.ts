import type { Client } from "@/app/dashboard/types";
import { wasClientReminderSent } from "@/lib/client-reminder-track";

export type PipelineColumnId = "to_remind" | "reminder_sent" | "promised" | "paid";

export type PipelineColumn = {
  id: PipelineColumnId;
  clients: Client[];
};

function isOverdue(dueDate: string): boolean {
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

/**
 * Pipeline V1 sans colonne Supabase dédiée :
 * - paid : statut payé
 * - to_remind : impayé + échéance dépassée, sans relance enregistrée localement
 * - reminder_sent : impayé + relance ouverte via mailto (localStorage par client)
 * - promised : impayé + échéance future (échéance à venir)
 */
export function bucketClientsForPipeline(clients: Client[]): PipelineColumn[] {
  const paid: Client[] = [];
  const toRemind: Client[] = [];
  const reminderSent: Client[] = [];
  const promised: Client[] = [];

  for (const c of clients) {
    if (c.status === "paid") {
      paid.push(c);
      continue;
    }
    if (wasClientReminderSent(c.id)) {
      reminderSent.push(c);
      continue;
    }
    if (isOverdue(c.dueDate)) {
      toRemind.push(c);
      continue;
    }
    promised.push(c);
  }

  const byAmountDesc = (a: Client, b: Client) => b.amountDue - a.amountDue;

  return [
    { id: "to_remind", clients: toRemind.sort(byAmountDesc) },
    { id: "reminder_sent", clients: reminderSent.sort(byAmountDesc) },
    { id: "promised", clients: promised.sort(byAmountDesc) },
    { id: "paid", clients: paid.sort(byAmountDesc) },
  ];
}

export function daysOverdueLabel(dueDate: string, locale: string): string {
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - d.getTime()) / 86_400_000);
  if (diff <= 0) return locale.startsWith("fr") ? "Échéance" : "Due";
  if (locale.startsWith("fr")) return `J+${diff}`;
  if (locale.startsWith("nl")) return `D+${diff}`;
  if (locale.startsWith("es")) return `D+${diff}`;
  return `D+${diff}`;
}
