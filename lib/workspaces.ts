import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanId } from "@/lib/plans";
import { getMaxWorkspaces } from "@/lib/plans";

export type Workspace = {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: string;
};

type WorkspaceRow = {
  id: string;
  user_id: string;
  name: string;
  sort_order: number;
  created_at: string;
};

function mapRow(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export async function fetchWorkspaces(supabase: SupabaseClient, userId: string): Promise<Workspace[]> {
  const { data, error } = await supabase
    .from("workspaces")
    .select("id,user_id,name,sort_order,created_at")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as WorkspaceRow[]).map(mapRow);
}

/**
 * Crée « Principal » si aucun portefeuille (uniquement si l’utilisateur connecté est le propriétaire du compte).
 * Un membre invité ne peut pas bootstrapper les workspaces du propriétaire.
 */
export async function ensureAtLeastOneWorkspace(
  supabase: SupabaseClient,
  workspaceOwnerUserId: string,
  authUserId: string,
): Promise<Workspace[]> {
  const existing = await fetchWorkspaces(supabase, workspaceOwnerUserId);
  if (existing.length > 0) return existing;
  if (workspaceOwnerUserId !== authUserId) {
    return [];
  }
  const { data, error } = await supabase
    .from("workspaces")
    .insert({ user_id: workspaceOwnerUserId, name: "Principal", sort_order: 0 })
    .select("id,user_id,name,sort_order,created_at")
    .single();
  if (error) throw error;
  return [mapRow(data as WorkspaceRow)];
}

export async function countClientsInWorkspace(supabase: SupabaseClient, workspaceId: string): Promise<number> {
  const { count, error } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);
  if (error) throw error;
  return count ?? 0;
}

export async function createWorkspace(
  supabase: SupabaseClient,
  userId: string,
  planId: PlanId,
  name: string,
): Promise<Workspace> {
  const list = await fetchWorkspaces(supabase, userId);
  const max = getMaxWorkspaces(planId);
  if (list.length >= max) {
    throw new Error("WORKSPACE_LIMIT");
  }
  const nextOrder = list.length === 0 ? 0 : Math.max(...list.map((w) => w.sortOrder)) + 1;
  const { data, error } = await supabase
    .from("workspaces")
    .insert({ user_id: userId, name: name.trim() || "Portefeuille", sort_order: nextOrder })
    .select("id,user_id,name,sort_order,created_at")
    .single();
  if (error) throw error;
  return mapRow(data as WorkspaceRow);
}

export async function updateWorkspaceName(supabase: SupabaseClient, workspaceId: string, name: string): Promise<void> {
  const { error } = await supabase.from("workspaces").update({ name: name.trim() || "—" }).eq("id", workspaceId);
  if (error) throw error;
}

export async function deleteWorkspaceIfEmpty(supabase: SupabaseClient, workspaceId: string): Promise<void> {
  const n = await countClientsInWorkspace(supabase, workspaceId);
  if (n > 0) {
    throw new Error("WORKSPACE_NOT_EMPTY");
  }
  const { error } = await supabase.from("workspaces").delete().eq("id", workspaceId);
  if (error) throw error;
}

/** Monte ou descend le portefeuille dans la liste (sort_order). */
export async function moveWorkspace(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
  direction: "up" | "down",
): Promise<void> {
  const list = await fetchWorkspaces(supabase, userId);
  const idx = list.findIndex((w) => w.id === workspaceId);
  if (idx < 0) return;
  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= list.length) return;
  const a = list[idx]!;
  const b = list[swapWith]!;
  const { error: e1 } = await supabase.from("workspaces").update({ sort_order: b.sortOrder }).eq("id", a.id);
  if (e1) throw e1;
  const { error: e2 } = await supabase.from("workspaces").update({ sort_order: a.sortOrder }).eq("id", b.id);
  if (e2) throw e2;
}
