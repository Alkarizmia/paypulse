import type { SupabaseClient } from "@supabase/supabase-js";

export type CreateNotificationInput = {
  recipientUserId: string;
  actorUserId?: string | null;
  workspaceId?: string | null;
  type: string;
  title: string;
  body: string;
  payload?: Record<string, unknown>;
  notificationKey?: string | null;
};

export async function createNotificationServer(supabase: SupabaseClient, input: CreateNotificationInput): Promise<void> {
  const row = {
    recipient_user_id: input.recipientUserId,
    actor_user_id: input.actorUserId ?? null,
    workspace_id: input.workspaceId ?? null,
    type: input.type,
    title: input.title,
    body: input.body,
    payload: input.payload ?? {},
    notification_key: input.notificationKey ?? null,
  };
  const { error } = await supabase.from("notifications").insert(row);
  if (!error) return;
  const code = (error as { code?: string }).code;
  // Ne pas réécraser une ligne existante : sinon un upsert réinitialisait read_at et « tout lu » semblait cassé.
  if (code === "23505" && input.notificationKey) return;
  throw error;
}

export async function listAccountRecipientIds(supabase: SupabaseClient, ownerUserId: string): Promise<string[]> {
  const recipientIds = new Set<string>([ownerUserId]);
  const { data, error } = await supabase
    .from("account_members")
    .select("member_user_id")
    .eq("owner_user_id", ownerUserId);
  if (error) throw error;
  for (const row of data ?? []) {
    const id = (row as { member_user_id?: string }).member_user_id;
    if (typeof id === "string" && id.length > 0) recipientIds.add(id);
  }
  return [...recipientIds];
}
