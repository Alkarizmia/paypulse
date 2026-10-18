/** Choix de consentement cookies analytics (RGPD / Consent Mode). */
export type CookieConsentChoice = "accepted" | "refused";

export const COOKIE_CONSENT_STORAGE_KEY = "paypulss_cookie_consent";

/** ID GA4 public (aligné sur app/google-analytics.tsx). */
export const GA_MEASUREMENT_ID =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim()) ||
  "G-JJ2FRKBE3L";

type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GtagFn;
  }
}

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

/**
 * Assure une fonction gtag compatible dataLayer (objet arguments),
 * puis met à jour le Consent Mode. Si accepté : envoie un page_view
 * (sinon le premier hit a souvent été bloqué pendant analytics_storage=denied).
 */
export function applyAnalyticsConsent(granted: boolean): void {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  // Signature classique Google : dataLayer.push(arguments), pas un Array.
  if (typeof window.gtag !== "function") {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
  }

  const gtag = window.gtag;

  if (granted) {
    gtag("consent", "update", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "granted",
    });
    gtag("event", "page_view", {
      send_to: GA_MEASUREMENT_ID,
      page_title: document.title,
      page_location: window.location.href,
    });
  } else {
    gtag("consent", "update", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    });
  }
}
