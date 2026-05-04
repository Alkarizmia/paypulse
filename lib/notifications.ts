import type { SupabaseClient } from "@supabase/supabase-js";

export type DashboardNotification = {
  id: string;
  recipientUserId: string;
  actorUserId: string | null;
  workspaceId: string | null;
  type: string;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

type NotificationRow = {
  id: string;
  recipient_user_id: string;
  actor_user_id: string | null;
  workspace_id: string | null;
  type: string;
  title: string;
  body: string;
  payload: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};

function mapNotification(row: NotificationRow): DashboardNotification {
  return {
    id: row.id,
    recipientUserId: row.recipient_user_id,
    actorUserId: row.actor_user_id,
    workspaceId: row.workspace_id,
    type: row.type,
    title: row.title,
    body: row.body,
    payload: row.payload ?? {},
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export async function fetchNotifications(supabase: SupabaseClient, userId: string, limit = 20): Promise<DashboardNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id,recipient_user_id,actor_user_id,workspace_id,type,title,body,payload,read_at,created_at")
    .eq("recipient_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as NotificationRow[]).map(mapNotification);
}

export async function markNotificationRead(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).is("read_at", null);
  if (error) throw error;
}

export async function markAllNotificationsRead(supabase: SupabaseClient, userId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_user_id", userId)
    .is("read_at", null);
  if (error) throw error;
}

export async function createMemberActionNotifications(
  supabase: SupabaseClient,
  params: {
    ownerUserId: string;
    actorUserId: string;
    workspaceId?: string | null;
    type?: string;
    title: string;
    body: string;
    payload?: Record<string, unknown>;
    notificationKeyBase?: string;
  },
): Promise<void> {
  const recipientIds = new Set<string>([params.ownerUserId]);
  const { data: members, error: membersErr } = await supabase
    .from("account_members")
    .select("member_user_id")
    .eq("owner_user_id", params.ownerUserId);
  if (membersErr) throw membersErr;
  for (const m of members ?? []) {
    const memberId = (m as { member_user_id?: string }).member_user_id;
    if (typeof memberId === "string" && memberId.length > 0) recipientIds.add(memberId);
  }
  recipientIds.delete(params.actorUserId);
  if (recipientIds.size === 0) return;

  const now = new Date().toISOString();
  const rows = [...recipientIds].map((recipientId) => ({
    recipient_user_id: recipientId,
    actor_user_id: params.actorUserId,
    workspace_id: params.workspaceId ?? null,
    type: params.type ?? "member_action",
    title: params.title,
    body: params.body,
    payload: params.payload ?? {},
    notification_key: params.notificationKeyBase ? `${params.notificationKeyBase}:${recipientId}` : null,
    created_at: now,
  }));
  const { error } = await supabase.from("notifications").insert(rows);
  if (error) throw error;
}
