import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "./supabase";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function signOutCurrentUser(): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return "Supabase non configuré.";
  const { error } = await supabase.auth.signOut();
  return error?.message ?? null;
}
