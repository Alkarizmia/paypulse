import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

function trimEnv(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

/** URL projet Supabase (https://xxxxx.supabase.co). */
function isValidSupabaseUrl(url: string): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(".supabase.co") && u.hostname.length > ".supabase.co".length;
  } catch {
    return false;
  }
}

/** Clé Supabase publique: ancien JWT anon (eyJ...) ou nouveau publishable (sb_publishable_...). */
function isValidAnonKey(key: string): boolean {
  const normalized = key.trim();
  return (normalized.startsWith("eyJ") && normalized.length >= 80) || normalized.startsWith("sb_publishable_");
}

/**
 * True uniquement si l’URL et la clé ont l’air réelles (évite les placeholders du .env.example).
 * Les variables NEXT_PUBLIC_* sont figées au build : après modification de .env.local, relancer `npm run dev`.
 */
export function isSupabaseReady(): boolean {
  const url = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return isValidSupabaseUrl(url) && isValidAnonKey(key);
}

/** @deprecated Utiliser isSupabaseReady — garde la compat si d’autres fichiers l’importent. */
export function isSupabaseConfigured(): boolean {
  return isSupabaseReady();
}

/** Message lisible si Supabase n’est pas prêt (pas de throw). */
export function getSupabaseEnvHint(): string | null {
  if (isSupabaseReady()) return null;
  const url = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url && !key) {
    return "Renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local (voir .env.example), puis redémarrez le serveur de dev.";
  }
  if (!isValidSupabaseUrl(url)) {
    return "NEXT_PUBLIC_SUPABASE_URL doit être l’URL HTTPS de votre projet, du type https://abcdefgh.supabase.co (Project Settings → API).";
  }
  if (!isValidAnonKey(key)) {
    return "NEXT_PUBLIC_SUPABASE_ANON_KEY doit être une clé publique Supabase (anon/public/publishable), pas une clé secret/service_role.";
  }
  return "Vérifiez vos variables Supabase dans .env.local et redémarrez npm run dev.";
}

/** Client navigateur ; null si l’environnement n’est pas valide (l’app ne crash pas). */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseReady()) {
    return null;
  }
  if (!browserClient) {
    browserClient = createClient(trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL), trimEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));
  }
  return browserClient;
}
