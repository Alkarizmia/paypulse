import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeDaysAfterDue, upsertReminderRule, type ReminderRule } from "@/lib/reminder-rules";

export type ReminderEmailTemplateRow = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  days_after_due: number;
  subject_template: string;
  body_template: string;
  payment_link: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ReminderEmailTemplate = {
  id: string;
  workspaceId: string;
  ownerUserId: string;
  daysAfterDue: number;
  subjectTemplate: string;
  bodyTemplate: string;
  paymentLink: string | null;
  sortOrder: number;
};

function mapRow(row: ReminderEmailTemplateRow): ReminderEmailTemplate {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    ownerUserId: row.owner_user_id,
    daysAfterDue: Number(row.days_after_due),
    subjectTemplate: row.subject_template,
    bodyTemplate: row.body_template,
    paymentLink: row.payment_link,
    sortOrder: Number(row.sort_order),
  };
}

export async function listReminderEmailTemplates(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<ReminderEmailTemplate[]> {
  const { data, error } = await supabase
    .from("reminder_email_templates")
    .select(
      "id,workspace_id,owner_user_id,days_after_due,subject_template,body_template,payment_link,sort_order,created_at,updated_at",
    )
    .eq("workspace_id", workspaceId)
    .order("sort_order", { ascending: true })
    .order("days_after_due", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as ReminderEmailTemplateRow));
}

export type ReminderEmailTemplateInput = {
  daysAfterDue: number;
  subjectTemplate: string;
  bodyTemplate: string;
  paymentLink: string | null;
  sortOrder: number;
};

/** Remplace tous les modèles du portefeuille (transaction logique : delete puis insert batch). */
export async function replaceReminderEmailTemplatesForWorkspace(
  supabase: SupabaseClient,
  workspaceId: string,
  ownerUserId: string,
  templates: ReminderEmailTemplateInput[],
): Promise<ReminderEmailTemplate[]> {
  const { error: delErr } = await supabase.from("reminder_email_templates").delete().eq("workspace_id", workspaceId);
  if (delErr) throw delErr;
  if (templates.length === 0) return [];
  const rows = templates.map((t) => ({
    workspace_id: workspaceId,
    owner_user_id: ownerUserId,
    days_after_due: t.daysAfterDue,
    subject_template: t.subjectTemplate,
    body_template: t.bodyTemplate,
    payment_link: t.paymentLink?.trim() || null,
    sort_order: t.sortOrder,
    updated_at: new Date().toISOString(),
  }));
  const { data, error } = await supabase
    .from("reminder_email_templates")
    .insert(rows)
    .select(
      "id,workspace_id,owner_user_id,days_after_due,subject_template,body_template,payment_link,sort_order,created_at,updated_at",
    );
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as ReminderEmailTemplateRow));
}

/** Jours J+n distincts issus des modèles (triés). */
export function scheduleDaysFromTemplates(templates: ReminderEmailTemplate[]): number[] {
  const set = new Set<number>();
  for (const t of templates) {
    const d = Number(t.daysAfterDue);
    if (Number.isInteger(d) && d >= 0 && d <= 120) {
      set.add(d);
    }
  }
  return [...set].sort((a, b) => a - b);
}

/**
 * Synchronise `reminder_rules.days_after_due` avec les jours des modèles (pour compat / lecture).
 * Ne modifie pas enabled ni max_jobs_per_run.
 */
export async function syncReminderRuleDaysFromTemplates(
  supabase: SupabaseClient,
  rule: ReminderRule,
  templates: ReminderEmailTemplate[],
): Promise<ReminderRule> {
  const days = scheduleDaysFromTemplates(templates);
  const daysAfterDue = days.length > 0 ? normalizeDaysAfterDue(days) : normalizeDaysAfterDue([3, 7, 21]);
  return upsertReminderRule(supabase, {
    ...rule,
    daysAfterDue,
  });
}

/**
 * Premier modèle (tri sort_order, days_after_due).
 * Réservé aux fiches impayées pour la relance manuelle ; sinon utiliser le brouillon.
 */
export function pickFirstReminderTemplate(templates: ReminderEmailTemplate[]): ReminderEmailTemplate | null {
  if (templates.length === 0) return null;
  const sorted = [...templates].sort((a, b) => a.sortOrder - b.sortOrder || a.daysAfterDue - b.daysAfterDue);
  return sorted[0] ?? null;
}
