import {
  getGoogleCalendarClientId,
  getGoogleCalendarClientSecret,
  getGoogleCalendarRedirectUri,
  GOOGLE_CALENDAR_SCOPE,
} from "@/lib/google-calendar-config";
import { signGoogleCalendarOAuthState } from "@/lib/google-calendar-oauth-state";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";

export function buildGoogleCalendarAuthorizeUrl(userId: string): string {
  const clientId = getGoogleCalendarClientId();
  if (!clientId) throw new Error("GOOGLE_CALENDAR_CLIENT_ID missing");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleCalendarRedirectUri(),
    response_type: "code",
    scope: GOOGLE_CALENDAR_SCOPE,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state: signGoogleCalendarOAuthState(userId),
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
};

export async function exchangeGoogleCalendarCode(code: string): Promise<GoogleTokenResponse> {
  const clientId = getGoogleCalendarClientId();
  const clientSecret = getGoogleCalendarClientSecret();
  if (!clientId || !clientSecret) throw new Error("Google Calendar OAuth not configured");

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getGoogleCalendarRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`token_exchange_failed:${res.status}:${err.slice(0, 200)}`);
  }

  return (await res.json()) as GoogleTokenResponse;
}

export async function refreshGoogleCalendarAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
  const clientId = getGoogleCalendarClientId();
  const clientSecret = getGoogleCalendarClientSecret();
  if (!clientId || !clientSecret) throw new Error("Google Calendar OAuth not configured");

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`token_refresh_failed:${res.status}:${err.slice(0, 200)}`);
  }

  return (await res.json()) as GoogleTokenResponse;
}

export async function revokeGoogleRefreshToken(refreshToken: string): Promise<void> {
  try {
    await fetch(`${GOOGLE_REVOKE_URL}?token=${encodeURIComponent(refreshToken)}`, { method: "POST" });
  } catch {
    /* ignore */
  }
}
