import type { SupabaseClient } from "@supabase/supabase-js";

export type UserProfile = {
  userId: string;
  fullName: string;
  companyName: string;
  phone: string;
  address: string;
  country: string;
  language: "fr" | "en";
  autoRemindersEnabled: boolean;
  /** Dernier portefeuille (workspace) actif sur le dashboard. */
  activeWorkspaceId: string | null;
};

type ProfileRow = {
  user_id: string;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  address: string | null;
  country: string | null;
  language: "fr" | "en" | null;
  auto_reminders_enabled: boolean | null;
  active_workspace_id: string | null;
};

function mapProfile(row: ProfileRow): UserProfile {
  return {
    userId: row.user_id,
    fullName: row.full_name ?? "",
    companyName: row.company_name ?? "",
    phone: row.phone ?? "",
    address: row.address ?? "",
    country: row.country ?? "",
    language: row.language === "en" ? "en" : "fr",
    autoRemindersEnabled: row.auto_reminders_enabled !== false,
    activeWorkspaceId: row.active_workspace_id ?? null,
  };
}

export async function getProfile(supabase: SupabaseClient, userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id,full_name,company_name,phone,address,country,language,auto_reminders_enabled,active_workspace_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapProfile(data as ProfileRow);
}

export async function upsertProfile(
  supabase: SupabaseClient,
  input: Omit<UserProfile, "userId"> & { userId: string },
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: input.userId,
        full_name: input.fullName || null,
        company_name: input.companyName || null,
        phone: input.phone || null,
        address: input.address || null,
        country: input.country || null,
        language: input.language,
        auto_reminders_enabled: input.autoRemindersEnabled,
        active_workspace_id: input.activeWorkspaceId ?? null,
      },
      { onConflict: "user_id" },
    )
    .select("user_id,full_name,company_name,phone,address,country,language,auto_reminders_enabled,active_workspace_id")
    .single();
  if (error) throw error;
  return mapProfile(data as ProfileRow);
}

export async function updateProfileAutoReminders(
  supabase: SupabaseClient,
  userId: string,
  enabled: boolean,
): Promise<void> {
  const { data: row } = await supabase.from("profiles").select("user_id").eq("user_id", userId).maybeSingle();
  if (row) {
    const { error } = await supabase.from("profiles").update({ auto_reminders_enabled: enabled }).eq("user_id", userId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("profiles").insert({
    user_id: userId,
    language: "fr",
    auto_reminders_enabled: enabled,
    active_workspace_id: null,
  });
  if (error) throw error;
}

/** Persiste le portefeuille actif (sidebar / header). */
export async function setProfileActiveWorkspace(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string | null,
): Promise<void> {
  const { data: row } = await supabase.from("profiles").select("user_id").eq("user_id", userId).maybeSingle();
  if (row) {
    const { error } = await supabase
      .from("profiles")
      .update({ active_workspace_id: workspaceId })
      .eq("user_id", userId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("profiles").insert({
    user_id: userId,
    language: "fr",
    auto_reminders_enabled: true,
    active_workspace_id: workspaceId,
  });
  if (error) throw error;
}
