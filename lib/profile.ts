import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppLocale } from "@/lib/app-locale";
import { isAppLocale } from "@/lib/app-locale";
import { isDisplayCurrency, type DisplayCurrency } from "@/lib/display-currency";
import type { UiThemePreference } from "@/lib/ui-theme";

export type { UiThemePreference };

export type UserProfile = {
  userId: string;
  fullName: string;
  companyName: string;
  phone: string;
  address: string;
  country: string;
  language: AppLocale;
  autoRemindersEnabled: boolean;
  /** E-mails occasionnels (nouveautés produit, astuces). */
  emailProductUpdates: boolean;
  /** Cartes factures plus serrées sur le dashboard. */
  invoiceListCompact: boolean;
  /** Thème interface dashboard (paramètres). */
  uiTheme: UiThemePreference;
  /** Dernier portefeuille (workspace) actif sur le dashboard. */
  activeWorkspaceId: string | null;
  /** Devise d’affichage et de saisie (montants stockés en EUR). */
  displayCurrency: DisplayCurrency;
};

type ProfileRow = {
  user_id: string;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  address: string | null;
  country: string | null;
  language: string | null;
  auto_reminders_enabled: boolean | null;
  email_product_updates: boolean | null;
  invoice_list_compact: boolean | null;
  ui_theme: string | null;
  active_workspace_id: string | null;
  display_currency: string | null;
};

function coerceUiTheme(v: string | null | undefined): UiThemePreference {
  if (v === "light" || v === "system") return v;
  return "dark";
}

function mapProfile(row: ProfileRow): UserProfile {
  const lang = isAppLocale(row.language) ? row.language : "fr";
  return {
    userId: row.user_id,
    fullName: row.full_name ?? "",
    companyName: row.company_name ?? "",
    phone: row.phone ?? "",
    address: row.address ?? "",
    country: row.country ?? "",
    language: lang,
    autoRemindersEnabled: row.auto_reminders_enabled !== false,
    emailProductUpdates: row.email_product_updates !== false,
    invoiceListCompact: row.invoice_list_compact === true,
    uiTheme: coerceUiTheme(row.ui_theme),
    activeWorkspaceId: row.active_workspace_id ?? null,
    displayCurrency: isDisplayCurrency(row.display_currency) ? row.display_currency : "EUR",
  };
}

const PROFILE_SELECT =
  "user_id,full_name,company_name,phone,address,country,language,auto_reminders_enabled,email_product_updates,invoice_list_compact,ui_theme,active_workspace_id,display_currency";

export async function getProfile(supabase: SupabaseClient, userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapProfile(data as ProfileRow);
}

/**
 * Tente de produire un E.164 pour `auth.users.phone` (colonne « Phone » du dashboard).
 * Si impossible, le numéro reste uniquement dans `user_metadata.contact_phone`.
 */
export function profilePhoneToAuthE164(raw: string): string | null {
  const s = raw.trim().replace(/[\s.\-/]/g, "");
  if (!s) return null;
  if (/^\+[1-9]\d{7,14}$/.test(s)) return s;
  // Belgique : 0XXXXXXXXX (9–10 chiffres après le 0)
  if (/^0[1-9]\d{7,8}$/.test(s)) return `+32${s.slice(1)}`;
  return null;
}

export type SyncAuthUserProfileResult = { ok: true } | { ok: false; message: string };

/** Données à fusionner dans `auth.users.raw_user_meta_data` + téléphone E.164 si possible. */
export function buildAuthUserMetadataFromProfile(
  profile: Pick<UserProfile, "fullName" | "companyName" | "phone" | "address" | "country">,
): { metadata: Record<string, string>; e164: string | null } {
  const fullName = profile.fullName.trim();
  const company = profile.companyName.trim();
  const phone = profile.phone.trim();
  const address = profile.address.trim();
  const country = profile.country.trim();

  const metadata: Record<string, string> = {};
  if (fullName) {
    metadata.full_name = fullName;
    metadata.display_name = fullName;
    metadata.name = fullName;
  }
  if (company) metadata.company_name = company;
  if (phone) metadata.contact_phone = phone;
  if (address) metadata.address = address;
  if (country) metadata.country = country;

  return { metadata, e164: profilePhoneToAuthE164(phone) };
}

type AuthSyncableProfile = Pick<UserProfile, "fullName" | "companyName" | "phone" | "address" | "country">;

/** Vrai si au moins un champ pertinent pour la synchro Auth diffère entre les deux profils. */
function authSyncProfileDiffers(a: AuthSyncableProfile, b: AuthSyncableProfile): boolean {
  return (
    a.fullName.trim() !== b.fullName.trim() ||
    a.companyName.trim() !== b.companyName.trim() ||
    a.phone.trim() !== b.phone.trim() ||
    a.address.trim() !== b.address.trim() ||
    a.country.trim() !== b.country.trim()
  );
}

/**
 * Met à jour `auth.users` (métadonnées visibles dans Authentication → Users).
 * Le tableau Supabase lit souvent `full_name` / `name` / `display_name` dans `user_metadata`.
 * La colonne Auth `phone` n’est mise à jour côté client que si GoTrue l’accepte (sinon ignorée).
 *
 * Si `previousProfile` est fourni et identique au profil courant sur tous les champs pertinents,
 * aucun appel `auth.updateUser` n'est émis (économie d'egress + de hits GoTrue).
 */
export async function syncAuthUserFromProfile(
  supabase: SupabaseClient,
  profile: AuthSyncableProfile,
  previousProfile?: AuthSyncableProfile,
): Promise<SyncAuthUserProfileResult> {
  if (previousProfile && !authSyncProfileDiffers(profile, previousProfile)) {
    return { ok: true };
  }

  const { metadata, e164 } = buildAuthUserMetadataFromProfile(profile);

  if (Object.keys(metadata).length > 0) {
    const { error: metaError } = await supabase.auth.updateUser({ data: metadata });
    if (metaError) {
      return { ok: false, message: metaError.message };
    }
  }

  if (!e164) {
    return { ok: true };
  }

  if (previousProfile) {
    const prevE164 = profilePhoneToAuthE164(previousProfile.phone);
    if (prevE164 === e164) {
      return { ok: true };
    }
  }

  const { error: phoneError } = await supabase.auth.updateUser({ phone: e164 });
  if (phoneError) {
    return { ok: true };
  }

  return { ok: true };
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
        email_product_updates: input.emailProductUpdates,
        invoice_list_compact: input.invoiceListCompact,
        ui_theme: input.uiTheme,
        active_workspace_id: input.activeWorkspaceId ?? null,
        display_currency: input.displayCurrency,
      },
      { onConflict: "user_id" },
    )
    .select(PROFILE_SELECT)
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
    email_product_updates: true,
    invoice_list_compact: false,
    ui_theme: "dark",
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
    email_product_updates: true,
    invoice_list_compact: false,
    ui_theme: "dark",
    active_workspace_id: workspaceId,
  });
  if (error) throw error;
}
