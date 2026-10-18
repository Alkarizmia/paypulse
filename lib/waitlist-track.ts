import type { AppLocale } from "@/lib/app-locale";
import { isAppLocale } from "@/lib/app-locale";
import { readWaitlistAttribution } from "@/lib/waitlist-attribution";

export type TrackEvent =
  | "cta_click"
  | "modal_open"
  | "email_focus"
  | "signup_success"
  | "signup_error";

export type TrackLocation = "hero" | "calculateur" | "fin_de_page" | "menu";

type TrackPayload = {
  event: TrackEvent;
  location?: TrackLocation | null;
  source?: string;
  lang?: string;
};

/** Incrémenté à chaque ouverture de modale pour dédupliquer les événements. */
let modalEpoch = 0;
const sentInEpoch = new Set<string>();

export function beginWaitlistModalTrackEpoch(): void {
  modalEpoch += 1;
  sentInEpoch.clear();
}

function trackingSource(): string {
  if (typeof window === "undefined") return "direct";
  const params = new URLSearchParams(window.location.search);
  const utm = (params.get("utm_source") ?? "").trim();
  if (utm) return utm.slice(0, 50);
  const src = (params.get("src") ?? "").trim();
  if (src) return src.slice(0, 50);
  const attr = readWaitlistAttribution("");
  if (attr && attr !== "landing") return attr.slice(0, 50);
  return "direct";
}

function trackingLang(locale?: AppLocale): string {
  if (locale && isAppLocale(locale)) return locale;
  if (typeof document !== "undefined") {
    const lang = document.documentElement.lang?.slice(0, 2).toLowerCase();
    if (isAppLocale(lang)) return lang;
  }
  return "en";
}

/**
 * Envoi anonyme vers /api/track (sendBeacon ou fetch keepalive).
 * Échec silencieux. Un seul envoi par (événement + epoch modale).
 */
export function track(
  event: TrackEvent,
  location?: TrackLocation | null,
  locale?: AppLocale,
): void {
  if (typeof window === "undefined") return;

  const dedupeKey = `${modalEpoch}:${event}:${location ?? ""}`;
  if (sentInEpoch.has(dedupeKey)) return;
  sentInEpoch.add(dedupeKey);

  const payload: TrackPayload = {
    event,
    location: location ?? null,
    source: trackingSource(),
    lang: trackingLang(locale),
  };

  const body = JSON.stringify(payload);
  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/track", blob)) return;
    }
  } catch {
    // fallback fetch
  }

  try {
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // never block UX
  }
}
