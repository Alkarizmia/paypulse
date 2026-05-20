import { NextResponse } from "next/server";
import { buildGoogleCalendarAuthorizeUrl } from "@/lib/google-calendar-oauth";
import { isGoogleCalendarConfigured } from "@/lib/google-calendar-config";
import { requireGoogleCalendarRouteAuth } from "@/lib/google-calendar-route-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isGoogleCalendarConfigured()) {
    return NextResponse.json({ ok: false, error: "Google Calendar is not available yet." }, { status: 503 });
  }

  const auth = await requireGoogleCalendarRouteAuth(request);
  if ("error" in auth) return auth.error;

  try {
    const url = buildGoogleCalendarAuthorizeUrl(auth.userId);
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "connect_failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
