import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type ServerSupabaseError =
  | "MISSING_SUPABASE_URL"
  | "MISSING_SUPABASE_SERVICE_ROLE_KEY"
  | "INVALID_SUPABASE_URL";

type ServerSupabaseResult =
  | { ok: true; client: SupabaseClient }
  | { ok: false; error: ServerSupabaseError };

function trimEnv(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function isValidSupabaseUrl(url: string): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

export function getSupabaseServerClient(): ServerSupabaseResult {
  const url = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = trimEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!url) return { ok: false, error: "MISSING_SUPABASE_URL" };
  if (!isValidSupabaseUrl(url)) return { ok: false, error: "INVALID_SUPABASE_URL" };
  if (!serviceRoleKey) return { ok: false, error: "MISSING_SUPABASE_SERVICE_ROLE_KEY" };

  return {
    ok: true,
    client: createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
  };
}
