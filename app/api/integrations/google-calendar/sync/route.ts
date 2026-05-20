import { NextResponse } from "next/server";
import { fetchClients } from "@/lib/clients";
import type { CustomCalendarEvent } from "@/lib/organization-calendar";
import { syncUserCalendarToGoogle } from "@/lib/google-calendar-sync";
import { buildCalendarLabelsForLocale } from "@/lib/google-calendar-labels";
import { isGoogleCalendarConfigured } from "@/lib/google-calendar-config";
import { requireGoogleCalendarRouteAuth } from "@/lib/google-calendar-route-auth";
import type { AppLocale } from "@/lib/app-locale";

export const runtime = "nodejs";

function parseLocale(value: unknown): AppLocale {
  if (value === "en" || value === "nl" || value === "es") return value;
  return "fr";
}

function parseCustomEvents(raw: unknown): CustomCalendarEvent[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (e): e is CustomCalendarEvent =>
      typeof e === "object" &&
      e !== null &&
      typeof (e as CustomCalendarEvent).id === "string" &&
      typeof (e as CustomCalendarEvent).date === "string" &&
      typeof (e as CustomCalendarEvent).title === "string",
  );
}

export async function POST(request: Request) {
  if (!isGoogleCalendarConfigured()) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const auth = await requireGoogleCalendarRouteAuth(request);
  if ("error" in auth) return auth.error;

  let body: { workspaceId?: string; locale?: string; customEvents?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId.trim() : "";
  if (!workspaceId) {
    return NextResponse.json({ ok: false, error: "workspace_required" }, { status: 400 });
  }

  const { data: workspace, error: wsErr } = await auth.admin
    .from("workspaces")
    .select("user_id")
    .eq("id", workspaceId)
    .maybeSingle();

  if (wsErr || !workspace) {
    return NextResponse.json({ ok: false, error: "workspace_not_found" }, { status: 404 });
  }

  const ownerId = workspace.user_id as string;
  const allowed =
    ownerId === auth.userId ||
    (await auth.admin
      .from("account_members")
      .select("member_user_id")
      .eq("owner_user_id", ownerId)
      .eq("member_user_id", auth.userId)
      .maybeSingle()).data;

  if (!allowed) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const locale = parseLocale(body.locale);
  const customEvents = parseCustomEvents(body.customEvents);

  try {
    const clients = await fetchClients(auth.admin, workspaceId);
    const result = await syncUserCalendarToGoogle(auth.admin, {
      userId: auth.userId,
      clients,
      customEvents,
      labels: buildCalendarLabelsForLocale(locale),
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: result.code === "NOT_CONNECTED" ? 400 : 502 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ ok: false, error: "sync_failed" }, { status: 500 });
  }
}
