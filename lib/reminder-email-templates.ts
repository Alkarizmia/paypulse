import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeDaysAfterDue, upsertReminderRule, type ReminderRule } from "@/lib/reminder-rules";
import { REMINDER_ATTACHMENT_BUCKET } from "@/lib/reminder-template-attachment";

export type ReminderEmailTemplateRow = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  days_after_due: number;
  subject_template: string;
  body_template: string;
  payment_link: string | null;
  sort_order: number;
  attachment_storage_path: string | null;
  attachment_file_name: string | null;
  attachment_content_type: string | null;
  attachment_size_bytes: number | null;
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
  attachmentStoragePath: string | null;
  attachmentFileName: string | null;
  attachmentContentType: string | null;
  attachmentSizeBytes: number | null;
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
    attachmentStoragePath: row.attachment_storage_path,
    attachmentFileName: row.attachment_file_name,
    attachmentContentType: row.attachment_content_type,
    attachmentSizeBytes:
      row.attachment_size_bytes === null || row.attachment_size_bytes === undefined
        ? null
        : Number(row.attachment_size_bytes),
  };
}

export const REMINDER_EMAIL_TEMPLATE_SELECT =
  "id,workspace_id,owner_user_id,days_after_due,subject_template,body_template,payment_link,sort_order,attachment_storage_path,attachment_file_name,attachment_content_type,attachment_size_bytes";

export async function listReminderEmailTemplates(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<ReminderEmailTemplate[]> {
  const { data, error } = await supabase
    .from("reminder_email_templates")
    .select(REMINDER_EMAIL_TEMPLATE_SELECT)
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
  attachmentStoragePath?: string | null;
  attachmentFileName?: string | null;
  attachmentContentType?: string | null;
  attachmentSizeBytes?: number | null;
};

/** Supprime des fichiers Storage orphelins (best effort). */
export async function removeReminderAttachmentFiles(
  supabase: SupabaseClient,
  paths: string[],
): Promise<void> {
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return;
  const { error } = await supabase.storage.from(REMINDER_ATTACHMENT_BUCKET).remove(unique);
  if (error) throw error;
}

/** Remplace tous les modèles du portefeuille (transaction logique : delete puis insert batch). */
export async function replaceReminderEmailTemplatesForWorkspace(
  supabase: SupabaseClient,
  workspaceId: string,
  ownerUserId: string,
  templates: ReminderEmailTemplateInput[],
  options?: { orphanPathsToDelete?: string[] },
): Promise<ReminderEmailTemplate[]> {
  const previous = await listReminderEmailTemplates(supabase, workspaceId);
  const previousPaths = previous.map((t) => t.attachmentStoragePath).filter((p): p is string => Boolean(p));

  const { error: delErr } = await supabase.from("reminder_email_templates").delete().eq("workspace_id", workspaceId);
  if (delErr) throw delErr;

  let saved: ReminderEmailTemplate[] = [];
  if (templates.length > 0) {
    const rows = templates.map((t) => ({
      workspace_id: workspaceId,
      owner_user_id: ownerUserId,
      days_after_due: t.daysAfterDue,
      subject_template: t.subjectTemplate,
      body_template: t.bodyTemplate,
      payment_link: t.paymentLink?.trim() || null,
      sort_order: t.sortOrder,
      attachment_storage_path: t.attachmentStoragePath?.trim() || null,
      attachment_file_name: t.attachmentFileName?.trim() || null,
      attachment_content_type: t.attachmentContentType?.trim() || null,
      attachment_size_bytes: t.attachmentSizeBytes ?? null,
      updated_at: new Date().toISOString(),
    }));
    const { data, error } = await supabase
      .from("reminder_email_templates")
      .insert(rows)
      .select(REMINDER_EMAIL_TEMPLATE_SELECT);
    if (error) throw error;
    saved = (data ?? []).map((r) => mapRow(r as ReminderEmailTemplateRow));
  }

  const kept = new Set(saved.map((t) => t.attachmentStoragePath).filter((p): p is string => Boolean(p)));
  const toDelete = new Set<string>([...previousPaths, ...(options?.orphanPathsToDelete ?? [])]);
  for (const p of kept) toDelete.delete(p);
  if (toDelete.size > 0) {
    await removeReminderAttachmentFiles(supabase, [...toDelete]);
  }

  return saved;
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

export function pickFirstReminderTemplate(templates: ReminderEmailTemplate[]): ReminderEmailTemplate | null {
  if (templates.length === 0) return null;
  const sorted = [...templates].sort((a, b) => a.sortOrder - b.sortOrder || a.daysAfterDue - b.daysAfterDue);
  return sorted[0] ?? null;
}
