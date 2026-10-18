const STORAGE_KEY = "pp_wl_src";
const COOKIE_KEY = "pp_wl_src";
const MAX_LEN = 96;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

function sanitize(raw: string): string {
  return raw.trim().slice(0, MAX_LEN).replace(/[^\w.\-:%/~]/g, "");
}

function writeCookie(value: string) {
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(value)};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
}

function readCookie(): string {
  if (typeof document === "undefined") return "";
  const parts = document.cookie.split("; ");
  for (const part of parts) {
    if (part.startsWith(`${COOKIE_KEY}=`)) {
      try {
        return sanitize(decodeURIComponent(part.slice(COOKIE_KEY.length + 1)));
      } catch {
        return "";
      }
    }
  }
  return "";
}

/**
 * Lit ?src= / utm_source (+ utm_campaign) et les mémorise (sessionStorage + cookie)
 * pour toute la visite. À appeler une fois sur la landing.
 */
export function captureWaitlistAttribution(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const src = (params.get("src") ?? params.get("utm_source") ?? "").trim();
  const campaign = (params.get("utm_campaign") ?? "").trim();
  if (!src) return;
  const value = sanitize(campaign ? `${src}:${campaign}` : src);
  if (!value) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* private mode */
  }
  writeCookie(value);
}

/** Source attribuée pour l'inscription waitlist (URL → mémoire → cookie). */
export function readWaitlistAttribution(fallback = "landing"): string {
  if (typeof window === "undefined") return fallback;
  try {
    const fromSession = sessionStorage.getItem(STORAGE_KEY);
    if (fromSession) {
      const s = sanitize(fromSession);
      if (s) return s;
    }
  } catch {
    /* ignore */
  }
  const fromCookie = readCookie();
  if (fromCookie) return fromCookie;
  return fallback;
}
