import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppLocale } from "@/lib/app-locale";
import { pickQuad } from "@/lib/messages/pick";
import { getGoogleWebClientId, signInWithGoogleGis } from "@/lib/auth-google-gis";

/** Origine publique pour les redirections OAuth (Vercel / local). */
export function getAuthSiteOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  return fromEnv || "http://localhost:3000";
}

export function getGoogleOAuthRedirectUrl(nextPath = "/dashboard"): string {
  const origin = getAuthSiteOrigin();
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export function mapGoogleAuthErrorMessage(message: string | null | undefined, locale: AppLocale): string {
  const generic = pickQuad(locale, {
    fr: "Connexion Google impossible. Reessayez.",
    en: "Google sign-in failed. Please try again.",
    nl: "Google-aanmelding mislukt. Probeer opnieuw.",
    es: "No se pudo iniciar sesion con Google. Intentalo de nuevo.",
  });

  if (!message) return generic;
  const normalized = message.toLowerCase();

  if (normalized.includes("not enabled") || normalized.includes("unsupported provider")) {
    return pickQuad(locale, {
      fr: "Google n'est pas active dans Supabase. Ouvrez Authentication → Providers → Google, activez-le et enregistrez vos identifiants Google (Client ID + secret).",
      en: "Google is not enabled in Supabase. Open Authentication → Providers → Google, enable it, and save your Google Client ID and secret.",
      nl: "Google is niet ingeschakeld in Supabase. Ga naar Authentication → Providers → Google en schakel het in met je Client ID en secret.",
      es: "Google no esta activado en Supabase. Abre Authentication → Providers → Google, activalo y guarda tu Client ID y secret.",
    });
  }

  if (normalized.includes("google_sign_in_cancelled")) {
    return pickQuad(locale, {
      fr: "Connexion Google annulee.",
      en: "Google sign-in was cancelled.",
      nl: "Google-aanmelding geannuleerd.",
      es: "Inicio de sesion con Google cancelado.",
    });
  }

  if (normalized.includes("origin") || normalized.includes("unregistered")) {
    return pickQuad(locale, {
      fr: "Origine non autorisee pour Google. Ajoutez https://www.paypulss.com et http://localhost:3000 dans Google Cloud → Clients → Origines JavaScript autorisees.",
      en: "Unauthorized origin for Google. Add https://www.paypulss.com and http://localhost:3000 under Google Cloud → Clients → Authorized JavaScript origins.",
      nl: "Niet-geautoriseerde origin voor Google. Voeg https://www.paypulss.com en http://localhost:3000 toe bij Authorized JavaScript origins.",
      es: "Origen no autorizado para Google. Anade https://www.paypulss.com y http://localhost:3000 en Authorized JavaScript origins.",
    });
  }

  return message;
}

export type SignInWithGoogleResult =
  | { ok: true; mode: "session"; nextPath: string }
  | { ok: true; mode: "oauth_redirect" }
  | { ok: false; message: string };

async function signInWithGoogleOAuth(
  supabase: SupabaseClient,
  nextPath: string,
): Promise<SignInWithGoogleResult> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getGoogleOAuthRedirectUrl(nextPath),
      skipBrowserRedirect: true,
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  const url = data?.url;
  if (!url) {
    return { ok: false, message: "Unsupported provider: provider is not enabled" };
  }

  window.location.assign(url);
  return { ok: true, mode: "oauth_redirect" };
}

/** Prefere Google Identity Services (nom PayPulss) si NEXT_PUBLIC_GOOGLE_CLIENT_ID est defini. */
export async function signInWithGoogle(
  supabase: SupabaseClient,
  nextPath = "/dashboard",
): Promise<SignInWithGoogleResult> {
  const clientId = getGoogleWebClientId();
  if (clientId) {
    const gis = await signInWithGoogleGis(supabase, clientId, nextPath);
    if (gis.ok || !gis.fallbackToOAuth) {
      return gis.ok
        ? { ok: true, mode: "session", nextPath: gis.nextPath }
        : { ok: false, message: gis.message };
    }
  }

  return signInWithGoogleOAuth(supabase, nextPath);
}
