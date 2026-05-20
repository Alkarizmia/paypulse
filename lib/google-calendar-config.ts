import { getAppOrigin } from "@/lib/stripe-server";

function trimEnv(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

export function getGoogleCalendarRedirectUri(): string {
  const explicit = trimEnv(process.env.GOOGLE_CALENDAR_REDIRECT_URI);
  if (explicit) return explicit.replace(/\/$/, "");
  return `${getAppOrigin()}/api/integrations/google-calendar/callback`;
}

export function isGoogleCalendarConfigured(): boolean {
  return Boolean(
    trimEnv(process.env.GOOGLE_CALENDAR_CLIENT_ID) &&
      trimEnv(process.env.GOOGLE_CALENDAR_CLIENT_SECRET) &&
      trimEnv(process.env.GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY),
  );
}

export function getGoogleCalendarClientId(): string | null {
  const id = trimEnv(process.env.GOOGLE_CALENDAR_CLIENT_ID);
  return id || null;
}

export function getGoogleCalendarClientSecret(): string | null {
  const s = trimEnv(process.env.GOOGLE_CALENDAR_CLIENT_SECRET);
  return s || null;
}
