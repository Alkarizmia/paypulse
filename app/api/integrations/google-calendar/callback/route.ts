import { NextResponse } from "next/server";
import { getAppOrigin } from "@/lib/stripe-server";
import { exchangeGoogleCalendarCode } from "@/lib/google-calendar-oauth";
import { verifyGoogleCalendarOAuthState } from "@/lib/google-calendar-oauth-state";
import { upsertGoogleCalendarConnection, getGoogleCalendarConnection } from "@/lib/google-calendar-db";
import { getSupabaseServerClient } from "@/lib/server-supabase";
import { isGoogleCalendarConfigured } from "@/lib/google-calendar-config";

export const runtime = "nodejs";

function integrationsRedirect(query: string): NextResponse {
  const base = `${getAppOrigin()}/dashboard/integrations`;
  return NextResponse.redirect(`${base}${query}`);
}

export async function GET(request: Request) {
  if (!isGoogleCalendarConfigured()) {
    return integrationsRedirect("?calendar=error&reason=not_configured");
  }

  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  if (error) {
    return integrationsRedirect(`?calendar=error&reason=${encodeURIComponent(error)}`);
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return integrationsRedirect("?calendar=error&reason=missing_code");
  }

  const verified = verifyGoogleCalendarOAuthState(state);
  if (!verified) {
    return integrationsRedirect("?calendar=error&reason=invalid_state");
  }

  const adminResult = getSupabaseServerClient();
  if (!adminResult.ok) {
    return integrationsRedirect("?calendar=error&reason=server");
  }

  try {
    const tokens = await exchangeGoogleCalendarCode(code);
    const refresh = tokens.refresh_token;
    if (!refresh) {
      const existing = await getGoogleCalendarConnection(adminResult.client, verified.userId);
      if (!existing) {
        return integrationsRedirect("?calendar=error&reason=no_refresh_token");
      }
      return integrationsRedirect("?calendar=connected");
    }

    await upsertGoogleCalendarConnection(adminResult.client, verified.userId, refresh);
    return integrationsRedirect("?calendar=connected");
  } catch {
    return integrationsRedirect("?calendar=error&reason=exchange_failed");
  }
}
