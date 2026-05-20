import type { SupabaseClient } from "@supabase/supabase-js";

export type AccountRole = "admin" | "member" | "spectator";

export function isAccountRole(v: string | null | undefined): v is AccountRole {
  return v === "admin" || v === "member" || v === "spectator";
}

export type AccountInvite = {
  id: string;
  ownerUserId: string;
  email: string;
  role: AccountRole;
  token: string;
  status: string;
  createdAt: string;
  acceptedAt: string | null;
};

export type AccountMember = {
  id: string;
  ownerUserId: string;
  memberUserId: string;
  role: AccountRole;
  createdAt: string;
};

type InviteRow = {
  id: string;
  owner_user_id: string;
  email: string;
  role: AccountRole;
  token: string;
  status: string;
  created_at: string;
  accepted_at: string | null;
};

type MemberRow = {
  id: string;
  owner_user_id: string;
  member_user_id: string;
  role: AccountRole;
  created_at: string;
};

function mapInvite(r: InviteRow): AccountInvite {
  return {
    id: r.id,
    ownerUserId: r.owner_user_id,
    email: r.email,
    role: r.role,
    token: r.token,
    status: r.status,
    createdAt: r.created_at,
    acceptedAt: r.accepted_at,
  };
}

function mapMember(r: MemberRow): AccountMember {
  return {
    id: r.id,
    ownerUserId: r.owner_user_id,
    memberUserId: r.member_user_id,
    role: r.role,
    createdAt: r.created_at,
  };
}

export async function fetchAccountInvites(supabase: SupabaseClient, ownerUserId: string): Promise<AccountInvite[]> {
  const { data, error } = await supabase
    .from("account_invites")
    .select("id,owner_user_id,email,role,token,status,created_at,accepted_at")
    .eq("owner_user_id", ownerUserId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as InviteRow[]).map(mapInvite);
}

export async function fetchAccountMembers(supabase: SupabaseClient, ownerUserId: string): Promise<AccountMember[]> {
  const { data, error } = await supabase
    .from("account_members")
    .select("id,owner_user_id,member_user_id,role,created_at")
    .eq("owner_user_id", ownerUserId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as MemberRow[]).map(mapMember);
}

/** Comptes dont l’utilisateur connecté est collaborateur (pour le sélecteur de compte). */
export async function fetchMembershipsForMember(supabase: SupabaseClient, memberUserId: string): Promise<AccountMember[]> {
  const { data, error } = await supabase
    .from("account_members")
    .select("id,owner_user_id,member_user_id,role,created_at")
    .eq("member_user_id", memberUserId);
  if (error) throw error;
  return ((data ?? []) as MemberRow[]).map(mapMember);
}

export async function createAccountInvite(
  supabase: SupabaseClient,
  ownerUserId: string,
  email: string,
  role: AccountRole,
): Promise<AccountInvite> {
  const clean = email.trim().toLowerCase();
  const { data, error } = await supabase
    .from("account_invites")
    .insert({ owner_user_id: ownerUserId, email: clean, role, status: "pending" })
    .select("id,owner_user_id,email,role,token,status,created_at,accepted_at")
    .single();
  if (error) throw error;
  return mapInvite(data as InviteRow);
}

export async function cancelAccountInvite(supabase: SupabaseClient, inviteId: string): Promise<void> {
  const { error } = await supabase.from("account_invites").update({ status: "cancelled" }).eq("id", inviteId);
  if (error) throw error;
}

export async function removeAccountMember(supabase: SupabaseClient, memberRowId: string): Promise<void> {
  const { error } = await supabase.from("account_members").delete().eq("id", memberRowId);
  if (error) throw error;
}

/** Membres actifs + invitations en attente (plafond plan Pro / Agency). */
export function countTeamSlots(members: AccountMember[], invites: AccountInvite[]): number {
  const pending = invites.filter((i) => i.status === "pending").length;
  return members.length + pending;
}

export async function acceptAccountInviteRpc(
  supabase: SupabaseClient,
  token: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("accept_account_invite", { p_token: token });
  if (error) {
    return { ok: false, error: error.message };
  }
  const row = data as { ok?: boolean; error?: string } | null;
  if (row && typeof row === "object" && "ok" in row) {
    return { ok: Boolean(row.ok), error: typeof row.error === "string" ? row.error : undefined };
  }
  return { ok: false, error: "unknown" };
}
