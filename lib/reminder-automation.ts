import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeDaysAfterDue } from "@/lib/reminder-rules";

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
  | "retry_scheduled";

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

function reminderSubject(clientName: string, scheduleDays: number): string {
  return `Rappel J+${scheduleDays} — facture en attente (${clientName})`;
}

function reminderText(client: ClientRow, scheduleDays: number): string {
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

function reminderHtml(text: string): string {
  const escaped = text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
  return `<div>${escaped.replaceAll("\n", "<br/>")}</div>`;
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
    // Do not fail the whole run on event log issues.
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

export async function enqueueDueReminderJobs(supabase: SupabaseClient): Promise<{ scannedClients: number; queuedJobs: number }> {
  const today = toIsoDay(new Date());
  const { data, error } = await supabase
    .from("clients")
    .select("id,workspace_id,user_id,name,email,amount_due,due_date,status,deleted_at")
    .eq("status", "unpaid")
    .is("deleted_at", null)
    .lte("due_date", today);
  if (error) throw error;

  const clients = (data ?? []) as ClientRow[];
  let queuedJobs = 0;

  for (const client of clients) {
    if (!client.workspace_id || !client.user_id) continue;
    const rule = await getRuleByWorkspace(supabase, client.workspace_id);
    const enabled = rule?.enabled ?? true;
    if (!enabled) continue;
    const days = normalizeDaysAfterDue(rule?.days_after_due);
    const ownerUserId = rule?.owner_user_id ?? client.user_id;

    for (const scheduleDays of days) {
      const fireDay = addDays(client.due_date, scheduleDays);
      if (fireDay > today) continue;
      const idempotencyKey = `${client.id}:${scheduleDays}:${fireDay}`;
      const scheduledFor = scheduledForIso(fireDay);
      const subject = reminderSubject(client.name, scheduleDays);

      const { error: insertErr } = await supabase.from("reminder_jobs").insert({
        client_id: client.id,
        workspace_id: client.workspace_id,
        owner_user_id: ownerUserId,
        schedule_days: scheduleDays,
        due_date: client.due_date,
        scheduled_for: scheduledFor,
        status: "pending",
        max_attempts: 3,
        idempotency_key: idempotencyKey,
        subject,
      });

      if (insertErr) {
        // duplicate key => already queued, ignore
        if (!String(insertErr.message).toLowerCase().includes("duplicate")) {
          console.error("[reminders] enqueue error:", insertErr.message);
        }
        continue;
      }

      queuedJobs += 1;
      await insertEvent(supabase, {
        eventType: "queued",
        ownerUserId,
        workspaceId: client.workspace_id,
        clientId: client.id,
        clientEmail: client.email,
        subject,
        details: { scheduleDays, fireDay },
      });
    }
  }

  return { scannedClients: clients.length, queuedJobs };
}

export async function processDueReminderJobs(supabase: SupabaseClient): Promise<ProcessSummary> {
  const nowIso = new Date().toISOString();
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.MAIL_FROM?.trim();
  if (!resendKey || !from) {
    throw new Error("Missing RESEND_API_KEY or MAIL_FROM for reminder automation.");
  }
  const resend = new Resend(resendKey);

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

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const job of jobs) {
    // best-effort lock
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
      .select("id,workspace_id,user_id,name,email,amount_due,due_date,status,deleted_at")
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

    const subject = reminderSubject(client.name, job.schedule_days);
    const text = reminderText(client, job.schedule_days);
    const html = reminderHtml(text);

    const { error: sendErr } = await resend.emails.send({
      from,
      to: client.email.trim().toLowerCase(),
      subject,
      text,
      html,
    });

    if (sendErr) {
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
            last_error: sendErr.message,
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
          errorMessage: sendErr.message,
          details: { retryAt, attempts: nextAttempts },
        });
      } else {
        await supabase
          .from("reminder_jobs")
          .update({
            status: "failed",
            attempts: nextAttempts,
            last_error: sendErr.message,
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
          errorMessage: sendErr.message,
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
