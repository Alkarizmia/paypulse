import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptGoogleRefreshToken, encryptGoogleRefreshToken } from "@/lib/google-calendar-crypto";

export type GoogleCalendarConnectionRow = {
  user_id: string;
  refresh_token_encrypted: string;
  calendar_id: string;
  sync_enabled: boolean;
  last_sync_at: string | null;
};

export async function getGoogleCalendarConnection(
  admin: SupabaseClient,
  userId: string,
): Promise<GoogleCalendarConnectionRow | null> {
  const { data, error } = await admin
    .from("google_calendar_connections")
    .select("user_id, refresh_token_encrypted, calendar_id, sync_enabled, last_sync_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data as GoogleCalendarConnectionRow | null) ?? null;
}

export async function upsertGoogleCalendarConnection(
  admin: SupabaseClient,
  userId: string,
  refreshToken: string,
): Promise<void> {
  const encrypted = encryptGoogleRefreshToken(refreshToken);
  const { error } = await admin.from("google_calendar_connections").upsert(
    {
      user_id: userId,
      refresh_token_encrypted: encrypted,
      calendar_id: "primary",
      sync_enabled: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

export async function deleteGoogleCalendarConnection(admin: SupabaseClient, userId: string): Promise<void> {
  await admin.from("google_calendar_event_map").delete().eq("user_id", userId);
  const { error } = await admin.from("google_calendar_connections").delete().eq("user_id", userId);
  if (error) throw error;
}

export async function getDecryptedRefreshToken(admin: SupabaseClient, userId: string): Promise<string | null> {
  const row = await getGoogleCalendarConnection(admin, userId);
  if (!row) return null;
  return decryptGoogleRefreshToken(row.refresh_token_encrypted);
}

export async function touchGoogleCalendarLastSync(admin: SupabaseClient, userId: string): Promise<void> {
  const { error } = await admin
    .from("google_calendar_connections")
    .update({ last_sync_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (error) throw error;
}

export async function getGoogleEventIdMap(
  admin: SupabaseClient,
  userId: string,
): Promise<Map<string, string>> {
  const { data, error } = await admin
    .from("google_calendar_event_map")
    .select("paypulss_event_id, google_event_id")
    .eq("user_id", userId);

  if (error) throw error;
  const map = new Map<string, string>();
  for (const row of data ?? []) {
    map.set(row.paypulss_event_id as string, row.google_event_id as string);
  }
  return map;
}

export async function upsertGoogleEventIdMap(
  admin: SupabaseClient,
  userId: string,
  paypulssEventId: string,
  googleEventId: string,
): Promise<void> {
  const { error } = await admin.from("google_calendar_event_map").upsert(
    {
      user_id: userId,
      paypulss_event_id: paypulssEventId,
      google_event_id: googleEventId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,paypulss_event_id" },
  );
  if (error) throw error;
}
