import { NextResponse } from "next/server";
import {
  deleteGoogleCalendarConnection,
  getDecryptedRefreshToken,
} from "@/lib/google-calendar-db";
import { revokeGoogleRefreshToken } from "@/lib/google-calendar-oauth";
import { requireGoogleCalendarRouteAuth } from "@/lib/google-calendar-route-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireGoogleCalendarRouteAuth(request);
  if ("error" in auth) return auth.error;

  try {
    const refresh = await getDecryptedRefreshToken(auth.admin, auth.userId);
    if (refresh) await revokeGoogleRefreshToken(refresh);
    await deleteGoogleCalendarConnection(auth.admin, auth.userId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "disconnect_failed" }, { status: 500 });
  }
}
