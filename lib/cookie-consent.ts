/** Choix de consentement cookies analytics (RGPD / Consent Mode). */
export type CookieConsentChoice = "accepted" | "refused";

export const COOKIE_CONSENT_STORAGE_KEY = "paypulss_cookie_consent";

export function isCookieConsentChoice(value: string | null | undefined): value is CookieConsentChoice {
  return value === "accepted" || value === "refused";
}

export function readCookieConsent(): CookieConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    return isCookieConsentChoice(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function writeCookieConsent(choice: CookieConsentChoice): void {
  try {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, choice);
  } catch {
    // ignore
  }
}

/** Met à jour Google Consent Mode après choix utilisateur. */
export function applyAnalyticsConsent(granted: boolean): void {
  if (typeof window === "undefined") return;
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== "function") return;
  gtag("consent", "update", {
    analytics_storage: granted ? "granted" : "denied",
  });
}
