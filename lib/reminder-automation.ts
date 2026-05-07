import type { SupabaseClient } from "@supabase/supabase-js";
import { sendResendReminderEmail } from "@/lib/resend-reminder-send";
import {
  listReminderEmailTemplates,
  type ReminderEmailTemplate,
  type ReminderEmailTemplateRow,
  scheduleDaysFromTemplates,
} from "@/lib/reminder-email-templates";
import { normalizeDaysAfterDue } from "@/lib/reminder-rules";
import {
  reminderBodyToHtml,
  reminderBodyToPlainText,
  substituteReminderTemplate,
  type ReminderSubstitutionContext,
} from "@/lib/reminder-template-substitution";
import { createNotificationServer, listAccountRecipientIds } from "@/lib/notifications-server";

type ClientRow = {
  id: string;
  workspace_id: string | null;
  user_id: string | null;
  name: string;
  email: string;
  amount_due: number | string;
  due_date: string;
  status: "paid" | "unpaid";
  deleted_at: string | null;
  created_at: string;
};

type ReminderRuleRow = {
  workspace_id: string;
  owner_user_id: string;
  enabled: boolean;
  timezone: string;
  days_after_due: number[];
  max_jobs_per_run: number;
};

type ReminderJobRow = {
  id: string;
  client_id: string;
  workspace_id: string;
  owner_user_id: string;
  schedule_days: number;
  due_date: string;
  scheduled_for: string;
  attempts: number;
  max_attempts: number;
  status: "pending" | "processing" | "sent" | "failed" | "skipped" | "cancelled";
};

type ProcessSummary = {
  scannedClients: number;
  queuedJobs: number;
  processedJobs: number;
  sent: number;
  failed: number;
  skipped: number;
};

type EventType =
  | "queued"
  | "processing"
  | "sent"
  | "failed"
  | "skipped_paid"
  | "skipped_not_due"
  | "retry_scheduled"
  | "skipped_duplicate_email";

function toIsoDay(input: Date): string {
  const y = input.getUTCFullYear();
  const m = String(input.getUTCMonth() + 1).padStart(2, "0");
  const d = String(input.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(isoDay: string, days: number): string {
  const date = new Date(`${isoDay}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDay(date);
}

function scheduledForIso(isoDay: string): string {
  return `${isoDay}T08:00:00.000Z`;
}

function normalizeAmount(value: number | string): number {
  const num = typeof value === "string" ? Number.parseFloat(value) : value;
  return Number.isFinite(num) ? num : 0;
}

function normalizeReminderEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Même créneau (e-mail + J+n + jour d’envoi) : une seule fiche « gagne » l’envoi.
 * Ordre : échéance (due_date) la plus ancienne → montant dû le plus élevé → created_at le plus ancien → id client (stable).
 */
function compareClientsForReminderWinner(a: ClientRow, b: ClientRow): number {
  if (a.due_date !== b.due_date) return a.due_date.localeCompare(b.due_date);
  const am = normalizeAmount(a.amount_due);
  const bm = normalizeAmount(b.amount_due);
  if (am !== bm) return bm - am;
  const at = a.created_at ?? "";
  const bt = b.created_at ?? "";
  if (at !== bt) return at.localeCompare(bt);
  return a.id.localeCompare(b.id);
}

type ReminderQueueCandidate = {
  client: ClientRow;
  scheduleDays: number;
  fireDay: string;
  scheduledFor: string;
  ownerUserId: string;
  subject: string;
  templateId: string | null;
  idempotencyKey: string;
};

function isGlobalReminderEmailDedupEnabled(): boolean {
  const v = process.env.REMINDER_GLOBAL_EMAIL_DEDUP?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

function reminderDedupGroupKey(candidate: ReminderQueueCandidate, globalMode: boolean): string {
  const em = normalizeReminderEmail(candidate.client.email);
  if (globalMode) {
    return `${em}|${candidate.scheduleDays}|${candidate.fireDay}`;
  }
  const ws = candidate.client.workspace_id ?? "";
  return `${ws}|${em}|${candidate.scheduleDays}|${candidate.fireDay}`;
}

function defaultReminderSubject(clientName: string, scheduleDays: number): string {
  return `Rappel J+${scheduleDays} — facture en attente (${clientName})`;
}

function defaultReminderText(client: ClientRow, scheduleDays: number): string {
  const amount = normalizeAmount(client.amount_due);
  return [
    "Bonjour,",
    "",
    `Petit rappel concernant la facture de ${amount.toFixed(2)} € échue le ${client.due_date}.`,
    `Relance programmée automatiquement à J+${scheduleDays}.`,
    "Merci de nous confirmer la date de règlement.",
    "",
    "Cordialement,",
    "PayPulss",
  ].join("\n");
}

function substitutionCtx(client: ClientRow, scheduleDays: number): ReminderSubstitutionContext {
  const amount = normalizeAmount(client.amount_due);
  return {
    clientName: client.name,
    amountFormatted: amount.toFixed(2),
    dueDate: client.due_date,
    scheduleDays,
  };
}

function mapTemplateRow(r: ReminderEmailTemplateRow): ReminderEmailTemplate {
  return {
    id: r.id,
    workspaceId: r.workspace_id,
    ownerUserId: r.owner_user_id,
    daysAfterDue: Number(r.days_after_due),
    subjectTemplate: r.subject_template,
    bodyTemplate: r.body_template,
    paymentLink: r.payment_link,
    sortOrder: Number(r.sort_order),
  };
}

function pickAutomationTemplate(
  templates: ReminderEmailTemplate[],
  scheduleDays: number,
): ReminderEmailTemplate | null {
  const n = Number(scheduleDays);
  if (!Number.isFinite(n)) return null;
  const sorted = [...templates].sort((a, b) => a.sortOrder - b.sortOrder || a.daysAfterDue - b.daysAfterDue);
  const exact = sorted.find((t) => Number(t.daysAfterDue) === n);
  if (exact) return exact;
  // Fallback: si aucun modèle exact J+n n'existe, utiliser le premier modèle enregistré
  // pour éviter l'envoi du texte générique par défaut.
  return sorted[0] ?? null;
}

async function insertEvent(
  supabase: SupabaseClient,
  payload: {
    eventType: EventType;
    ownerUserId: string;
    workspaceId: string | null;
    clientId: string | null;
    jobId?: string | null;
    clientEmail?: string | null;
    subject?: string | null;
    errorMessage?: string | null;
    details?: Record<string, unknown>;
  },
) {
  const { error } = await supabase.from("reminder_events").insert({
    job_id: payload.jobId ?? null,
    owner_user_id: payload.ownerUserId,
    workspace_id: payload.workspaceId,
    client_id: payload.clientId,
    event_type: payload.eventType,
    client_email: payload.clientEmail ?? null,
    subject: payload.subject ?? null,
    error_message: payload.errorMessage ?? null,
    details: payload.details ?? {},
  });
  if (error) {
    console.error("[reminders] reminder_events insert failed:", error.message);
  }
}

async function getRuleByWorkspace(supabase: SupabaseClient, workspaceId: string): Promise<ReminderRuleRow | null> {
  const { data, error } = await supabase
    .from("reminder_rules")
    .select("workspace_id,owner_user_id,enabled,timezone,days_after_due,max_jobs_per_run")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (error) throw error;
  return (data as ReminderRuleRow | null) ?? null;
}

async function loadTemplatesByWorkspaceMap(
  supabase: SupabaseClient,
  workspaceIds: string[],
): Promise<Map<string, ReminderEmailTemplate[]>> {
  const map = new Map<string, ReminderEmailTemplate[]>();
  if (workspaceIds.length === 0) return map;
  const { data, error } = await supabase
    .from("reminder_email_templates")
    .select(
      "id,workspace_id,owner_user_id,days_after_due,subject_template,body_template,payment_link,sort_order,created_at,updated_at",
    )
    .in("workspace_id", workspaceIds);
  if (error) throw error;
  for (const row of data ?? []) {
    const t = mapTemplateRow(row as ReminderEmailTemplateRow);
    const list = map.get(t.workspaceId) ?? [];
    list.push(t);
    map.set(t.workspaceId, list);
  }
  for (const [ws, list] of map) {
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.daysAfterDue - b.daysAfterDue);
    map.set(ws, list);
  }
  return map;
}

function effectiveScheduleDaysForWorkspace(
  templates: ReminderEmailTemplate[] | undefined,
  rule: ReminderRuleRow | null,
): number[] {
  const autoDays = scheduleDaysFromTemplates(templates ?? []);
  if (autoDays.length > 0) return autoDays;
  return normalizeDaysAfterDue(rule?.days_after_due);
}

export async function enqueueDueReminderJobs(supabase: SupabaseClient): Promise<{ scannedClients: number; queuedJobs: number }> {
  const today = toIsoDay(new Date());
  const { data, error } = await supabase
    .from("clients")
    .select("id,workspace_id,user_id,name,email,amount_due,due_date,status,deleted_at,created_at")
    .eq("status", "unpaid")
    .is("deleted_at", null)
    .lte("due_date", today);
  if (error) throw error;

  const clients = (data ?? []) as ClientRow[];
  const workspaceIds = [...new Set(clients.map((c) => c.workspace_id).filter(Boolean))] as string[];
  const templatesMap = await loadTemplatesByWorkspaceMap(supabase, workspaceIds);

  const globalDedup = isGlobalReminderEmailDedupEnabled();
  const candidates: ReminderQueueCandidate[] = [];

  for (const client of clients) {
    if (!client.workspace_id || !client.user_id) continue;
    const rule = await getRuleByWorkspace(supabase, client.workspace_id);
    const enabled = rule?.enabled ?? true;
    if (!enabled) continue;
    const wsTemplates = templatesMap.get(client.workspace_id);
    const days = effectiveScheduleDaysForWorkspace(wsTemplates, rule);
    const ownerUserId = rule?.owner_user_id ?? client.user_id;

    const tplList = wsTemplates ?? [];

    for (const scheduleDays of days) {
      const tpl = pickAutomationTemplate(tplList, scheduleDays);

      const fireDay = addDays(client.due_date, scheduleDays);
      if (fireDay > today) continue;
      const idempotencyKey = `${client.id}:${scheduleDays}:${fireDay}`;
      const scheduledFor = scheduledForIso(fireDay);
      const ctx = substitutionCtx(client, scheduleDays);
      const subject = tpl
        ? substituteReminderTemplate(tpl.subjectTemplate, ctx)
        : defaultReminderSubject(client.name, scheduleDays);

      candidates.push({
        client,
        scheduleDays,
        fireDay,
        scheduledFor,
        ownerUserId,
        subject,
        templateId: tpl?.id ?? null,
        idempotencyKey,
      });
    }
  }

  const groups = new Map<string, ReminderQueueCandidate[]>();
  for (const c of candidates) {
    const key = reminderDedupGroupKey(c, globalDedup);
    const list = groups.get(key) ?? [];
    list.push(c);
    groups.set(key, list);
  }

  let queuedJobs = 0;
  const overdueNotified = new Set<string>();

  for (const [, group] of groups) {
    const sorted = [...group].sort((a, b) => compareClientsForReminderWinner(a.client, b.client));
    const winner = sorted[0];
    if (!winner) continue;

    const { error: insertErr } = await supabase.from("reminder_jobs").insert({
      client_id: winner.client.id,
      workspace_id: winner.client.workspace_id,
      owner_user_id: winner.ownerUserId,
      schedule_days: winner.scheduleDays,
      due_date: winner.client.due_date,
      scheduled_for: winner.scheduledFor,
      status: "pending",
      max_attempts: 3,
      idempotency_key: winner.idempotencyKey,
      subject: winner.subject,
    });

    if (insertErr) {
      if (!String(insertErr.message).toLowerCase().includes("duplicate")) {
        console.error("[reminders] enqueue error:", insertErr.message);
      }
      continue;
    }

    queuedJobs += 1;
    await insertEvent(supabase, {
      eventType: "queued",
      ownerUserId: winner.ownerUserId,
      workspaceId: winner.client.workspace_id,
      clientId: winner.client.id,
      clientEmail: winner.client.email,
      subject: winner.subject,
      details: {
        scheduleDays: winner.scheduleDays,
        fireDay: winner.fireDay,
        templateId: winner.templateId,
        dedupScope: globalDedup ? "global_email" : "workspace_email",
      },
    });

    for (let i = 1; i < sorted.length; i++) {
      const loser = sorted[i];
      await insertEvent(supabase, {
        eventType: "skipped_duplicate_email",
        ownerUserId: loser.ownerUserId,
        workspaceId: loser.client.workspace_id,
        clientId: loser.client.id,
        clientEmail: loser.client.email,
        subject: loser.subject,
        errorMessage: null,
        details: {
          reason: globalDedup ? "duplicate_email_global_slot" : "duplicate_email_same_workspace",
          scheduleDays: loser.scheduleDays,
          fireDay: loser.fireDay,
          winning_client_id: winner.client.id,
          winning_workspace_id: winner.client.workspace_id,
          deferred_idempotency_key: loser.idempotencyKey,
        },
      });
    }

    const overdueKey = `${winner.client.id}:${today}`;
    if (!overdueNotified.has(overdueKey)) {
      overdueNotified.add(overdueKey);
      try {
        const recipients = await listAccountRecipientIds(supabase, winner.ownerUserId);
        await Promise.all(
          recipients.map((recipientId) =>
            createNotificationServer(supabase, {
              recipientUserId: recipientId,
              actorUserId: null,
              workspaceId: winner.client.workspace_id,
              type: "overdue_detected",
              title: "Echeance depassee",
              body: `${winner.client.name} a depasse sa date d'echeance (${winner.client.due_date}).`,
              payload: { clientId: winner.client.id, dueDate: winner.client.due_date },
              notificationKey: `overdue:${winner.client.id}:${today}:${recipientId}`,
            }),
          ),
        );
      } catch (error) {
        console.error("[reminders] overdue notification failed:", error);
      }
    }
  }

  return { scannedClients: clients.length, queuedJobs };
}

export async function processDueReminderJobs(supabase: SupabaseClient): Promise<ProcessSummary> {
  const nowIso = new Date().toISOString();
  const hasReminderFrom =
    Boolean(process.env.MAIL_FROM_AUTO_REMINDERS?.trim()) || Boolean(process.env.MAIL_FROM?.trim());
  if (!process.env.RESEND_API_KEY?.trim() || !hasReminderFrom) {
    throw new Error(
      "Missing RESEND_API_KEY or MAIL_FROM (ou MAIL_FROM_AUTO_REMINDERS) for reminder automation.",
    );
  }

  const { data: pendingRows, error: pendingErr } = await supabase
    .from("reminder_jobs")
    .select("id,client_id,workspace_id,owner_user_id,schedule_days,due_date,scheduled_for,attempts,max_attempts,status")
    .eq("status", "pending")
    .lte("scheduled_for", nowIso)
    .order("scheduled_for", { ascending: true })
    .limit(100);
  if (pendingErr) throw pendingErr;

  const jobs = (pendingRows ?? []) as ReminderJobRow[];
  if (jobs.length === 0) {
    return { scannedClients: 0, queuedJobs: 0, processedJobs: 0, sent: 0, failed: 0, skipped: 0 };
  }

  const profileCache = new Map<string, boolean>();
  const templateCache = new Map<string, ReminderEmailTemplate | null | undefined>();

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const job of jobs) {
    const { data: lockRow, error: lockErr } = await supabase
      .from("reminder_jobs")
      .update({ status: "processing", locked_at: nowIso })
      .eq("id", job.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (lockErr || !lockRow) continue;

    await insertEvent(supabase, {
      eventType: "processing",
      ownerUserId: job.owner_user_id,
      workspaceId: job.workspace_id,
      clientId: job.client_id,
      jobId: job.id,
    });

    const { data: clientRow, error: clientErr } = await supabase
      .from("clients")
      .select("id,workspace_id,user_id,name,email,amount_due,due_date,status,deleted_at,created_at")
      .eq("id", job.client_id)
      .maybeSingle();

    if (clientErr || !clientRow) {
      failed += 1;
      await supabase
        .from("reminder_jobs")
        .update({
          status: "failed",
          attempts: job.attempts + 1,
          last_error: clientErr?.message ?? "Missing client row",
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);
      await insertEvent(supabase, {
        eventType: "failed",
        ownerUserId: job.owner_user_id,
        workspaceId: job.workspace_id,
        clientId: job.client_id,
        jobId: job.id,
        errorMessage: clientErr?.message ?? "Missing client row",
      });
      continue;
    }

    const client = clientRow as ClientRow;
    if (!profileCache.has(job.owner_user_id)) {
      const { data: profileRow, error: profileErr } = await supabase
        .from("profiles")
        .select("auto_reminders_enabled")
        .eq("user_id", job.owner_user_id)
        .maybeSingle();
      if (profileErr) {
        console.error("[reminders] profile read failed:", profileErr.message);
        profileCache.set(job.owner_user_id, true);
      } else {
        profileCache.set(job.owner_user_id, (profileRow?.auto_reminders_enabled ?? true) !== false);
      }
    }
    if (!profileCache.get(job.owner_user_id)) {
      skipped += 1;
      await supabase
        .from("reminder_jobs")
        .update({
          status: "skipped",
          updated_at: new Date().toISOString(),
          last_error: "AUTO_REMINDERS_DISABLED",
        })
        .eq("id", job.id);
      await insertEvent(supabase, {
        eventType: "skipped_not_due",
        ownerUserId: job.owner_user_id,
        workspaceId: job.workspace_id,
        clientId: job.client_id,
        jobId: job.id,
        clientEmail: client.email,
        details: { reason: "AUTO_REMINDERS_DISABLED" },
      });
      continue;
    }

    if (client.status !== "unpaid" || client.deleted_at) {
      skipped += 1;
      await supabase
        .from("reminder_jobs")
        .update({
          status: "skipped",
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);
      await insertEvent(supabase, {
        eventType: "skipped_paid",
        ownerUserId: job.owner_user_id,
        workspaceId: job.workspace_id,
        clientId: job.client_id,
        jobId: job.id,
        clientEmail: client.email,
      });
      continue;
    }

    const cacheKey = `${job.workspace_id}:${job.schedule_days}`;
    if (!templateCache.has(cacheKey)) {
      const list = await listReminderEmailTemplates(supabase, job.workspace_id);
      templateCache.set(cacheKey, pickAutomationTemplate(list, job.schedule_days));
    }
    const tpl = templateCache.get(cacheKey) ?? null;

    const ctx = substitutionCtx(client, job.schedule_days);
    let subject: string;
    let text: string;
    let html: string;
    if (tpl) {
      subject = substituteReminderTemplate(tpl.subjectTemplate, ctx);
      const bodyRaw = substituteReminderTemplate(tpl.bodyTemplate, ctx);
      text = reminderBodyToPlainText(bodyRaw, tpl.paymentLink);
      html = reminderBodyToHtml(bodyRaw, tpl.paymentLink);
    } else {
      subject = defaultReminderSubject(client.name, job.schedule_days);
      text = defaultReminderText(client, job.schedule_days);
      html = reminderBodyToHtml(text, null);
    }

    const sendResult = await sendResendReminderEmail({
      to: client.email,
      subject,
      text,
      html,
      fromContext: "automation",
    });

    if (!sendResult.ok) {
      const errMsg = sendResult.error;
      const nextAttempts = job.attempts + 1;
      const canRetry = nextAttempts < Math.max(1, job.max_attempts);
      failed += 1;
      if (canRetry) {
        const retryDelayMinutes = Math.min(60, 10 * nextAttempts);
        const retryAt = new Date(Date.now() + retryDelayMinutes * 60_000).toISOString();
        await supabase
          .from("reminder_jobs")
          .update({
            status: "pending",
            attempts: nextAttempts,
            last_error: errMsg,
            scheduled_for: retryAt,
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);
        await insertEvent(supabase, {
          eventType: "retry_scheduled",
          ownerUserId: job.owner_user_id,
          workspaceId: job.workspace_id,
          clientId: job.client_id,
          jobId: job.id,
          clientEmail: client.email,
          subject,
          errorMessage: errMsg,
          details: { retryAt, attempts: nextAttempts },
        });
      } else {
        await supabase
          .from("reminder_jobs")
          .update({
            status: "failed",
            attempts: nextAttempts,
            last_error: errMsg,
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);
        await insertEvent(supabase, {
          eventType: "failed",
          ownerUserId: job.owner_user_id,
          workspaceId: job.workspace_id,
          clientId: job.client_id,
          jobId: job.id,
          clientEmail: client.email,
          subject,
          errorMessage: errMsg,
        });
      }
      continue;
    }

    sent += 1;
    await supabase
      .from("reminder_jobs")
      .update({
        status: "sent",
        attempts: job.attempts + 1,
        sent_at: new Date().toISOString(),
        subject,
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    await insertEvent(supabase, {
      eventType: "sent",
      ownerUserId: job.owner_user_id,
      workspaceId: job.workspace_id,
      clientId: job.client_id,
      jobId: job.id,
      clientEmail: client.email,
      subject,
      details: { scheduleDays: job.schedule_days },
    });
    try {
      const recipients = await listAccountRecipientIds(supabase, job.owner_user_id);
      await Promise.all(
        recipients.map((recipientId) =>
          Promise.all([
            createNotificationServer(supabase, {
              recipientUserId: recipientId,
              actorUserId: null,
              workspaceId: job.workspace_id,
              type: "reminder_sent",
              title: `Relance J+${job.schedule_days} envoyee`,
              body: `Relance envoyee a ${client.email}.`,
              payload: { jobId: job.id, clientId: client.id, scheduleDays: job.schedule_days, email: client.email },
              notificationKey: `reminder_sent:${job.id}:${recipientId}`,
            }),
            createNotificationServer(supabase, {
              recipientUserId: recipientId,
              actorUserId: null,
              workspaceId: job.workspace_id,
              type: "reminder_stage",
              title: `Palier J+${job.schedule_days}`,
              body: `Passage au palier J+${job.schedule_days} pour ${client.name}.`,
              payload: { jobId: job.id, clientId: client.id, stage: `J+${job.schedule_days}` },
              notificationKey: `reminder_stage:${job.id}:${recipientId}`,
            }),
          ]),
        ),
      );
    } catch (error) {
      console.error("[reminders] sent notification failed:", error);
    }
  }

  return {
    scannedClients: 0,
    queuedJobs: 0,
    processedJobs: jobs.length,
    sent,
    failed,
    skipped,
  };
}
