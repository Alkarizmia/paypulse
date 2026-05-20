import { NextResponse } from "next/server";
import { getGoogleCalendarConnection } from "@/lib/google-calendar-db";
import { isGoogleCalendarConfigured } from "@/lib/google-calendar-config";
import { requireGoogleCalendarRouteAuth } from "@/lib/google-calendar-route-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const configured = isGoogleCalendarConfigured();
  const auth = await requireGoogleCalendarRouteAuth(request);
  if ("error" in auth) return auth.error;

  const row = await getGoogleCalendarConnection(auth.admin, auth.userId);
  return NextResponse.json({
    ok: true,
    configured,
    connected: Boolean(row),
    lastSyncAt: row?.last_sync_at ?? null,
    calendarId: row?.calendar_id ?? null,
  });
}
