import type { SupabaseClient } from "@supabase/supabase-js";

/** Same rules as `lib/reminder-automation.ts` enqueue (integers 0–120, dedupe, sort). */
export function normalizeDaysAfterDue(values: number[] | null | undefined): number[] {
  if (!Array.isArray(values)) return [3, 7, 21];
  const valid = values.filter((v) => Number.isInteger(v) && v >= 0 && v <= 120);
  if (valid.length === 0) return [3, 7, 21];
  return [...new Set(valid)].sort((a, b) => a - b);
}

export type ReminderRule = {
  workspaceId: string;
  ownerUserId: string;
  enabled: boolean;
  timezone: string;
  daysAfterDue: number[];
  maxJobsPerRun: number;
};

type ReminderRuleRow = {
  workspace_id: string;
  owner_user_id: string;
  enabled: boolean;
  timezone: string;
  days_after_due: number[];
  max_jobs_per_run: number;
};

function mapRule(row: ReminderRuleRow): ReminderRule {
  return {
    workspaceId: row.workspace_id,
    ownerUserId: row.owner_user_id,
    enabled: row.enabled,
    timezone: row.timezone,
    daysAfterDue: normalizeDaysAfterDue(row.days_after_due),
    maxJobsPerRun: row.max_jobs_per_run,
  };
}

export async function getReminderRule(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<ReminderRule | null> {
  const { data, error } = await supabase
    .from("reminder_rules")
    .select("workspace_id,owner_user_id,enabled,timezone,days_after_due,max_jobs_per_run")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapRule(data as ReminderRuleRow);
}

export async function upsertReminderRule(
  supabase: SupabaseClient,
  input: ReminderRule,
): Promise<ReminderRule> {
  const daysAfterDue = normalizeDaysAfterDue(input.daysAfterDue);
  const { data, error } = await supabase
    .from("reminder_rules")
    .upsert(
      {
        workspace_id: input.workspaceId,
        owner_user_id: input.ownerUserId,
        enabled: input.enabled,
        timezone: input.timezone,
        days_after_due: daysAfterDue,
        max_jobs_per_run: input.maxJobsPerRun,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id" },
    )
    .select("workspace_id,owner_user_id,enabled,timezone,days_after_due,max_jobs_per_run")
    .single();
  if (error) throw error;
  return mapRule(data as ReminderRuleRow);
}
