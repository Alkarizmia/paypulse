import type { SupabaseClient } from "@supabase/supabase-js";
import type { Client } from "@/app/dashboard/types";
import type { CalendarEvent, CustomCalendarEvent } from "@/lib/organization-calendar";
import {
  buildCalendarEventsFromClients,
  mergeCalendarEvents,
} from "@/lib/organization-calendar";
import {
  getDecryptedRefreshToken,
  getGoogleEventIdMap,
  touchGoogleCalendarLastSync,
  upsertGoogleEventIdMap,
} from "@/lib/google-calendar-db";
import { refreshGoogleCalendarAccessToken } from "@/lib/google-calendar-oauth";
import type { BuildCalendarLabels } from "@/lib/organization-calendar";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

type GoogleCalendarEventBody = {
  summary: string;
  description?: string;
  start: { date: string };
  end: { date: string };
  extendedProperties?: { private?: Record<string, string> };
};

function nextDayYmd(ymd: string): string {
  const d = new Date(ymd + "T12:00:00");
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toGoogleBody(ev: CalendarEvent): GoogleCalendarEventBody {
  const lines: string[] = [];
  if (ev.subtitle) lines.push(ev.subtitle);
  if (ev.amountEur != null) lines.push(`${ev.amountEur} EUR`);
  lines.push("PayPulss");
  return {
    summary: ev.title,
    description: lines.join("\n"),
    start: { date: ev.date },
    end: { date: nextDayYmd(ev.date) },
    extendedProperties: { private: { paypulss_id: ev.id } },
  };
}

async function calendarFetch(
  accessToken: string,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(`${CALENDAR_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

async function insertEvent(
  accessToken: string,
  calendarId: string,
  body: GoogleCalendarEventBody,
): Promise<string> {
  const res = await calendarFetch(
    accessToken,
    `/calendars/${encodeURIComponent(calendarId)}/events`,
    { method: "POST", body: JSON.stringify(body) },
  );
  if (!res.ok) throw new Error(`google_insert_failed:${res.status}`);
  const json = (await res.json()) as { id?: string };
  if (!json.id) throw new Error("google_insert_no_id");
  return json.id;
}

async function patchEvent(
  accessToken: string,
  calendarId: string,
  googleEventId: string,
  body: GoogleCalendarEventBody,
): Promise<void> {
  const res = await calendarFetch(
    accessToken,
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`,
    { method: "PATCH", body: JSON.stringify(body) },
  );
  if (!res.ok) throw new Error(`google_patch_failed:${res.status}`);
}

export type SyncGoogleCalendarInput = {
  userId: string;
  clients: Client[];
  customEvents: CustomCalendarEvent[];
  labels: BuildCalendarLabels;
};

export type SyncGoogleCalendarResult =
  | { ok: true; synced: number; errors: number }
  | { ok: false; error: string; code?: string };

export async function syncUserCalendarToGoogle(
  admin: SupabaseClient,
  input: SyncGoogleCalendarInput,
): Promise<SyncGoogleCalendarResult> {
  const refreshToken = await getDecryptedRefreshToken(admin, input.userId);
  if (!refreshToken) {
    return { ok: false, error: "not_connected", code: "NOT_CONNECTED" };
  }

  let accessToken: string;
  try {
    const tokens = await refreshGoogleCalendarAccessToken(refreshToken);
    accessToken = tokens.access_token;
  } catch {
    return { ok: false, error: "token_refresh_failed", code: "TOKEN_REFRESH" };
  }

  const { data: conn } = await admin
    .from("google_calendar_connections")
    .select("calendar_id")
    .eq("user_id", input.userId)
    .maybeSingle();

  const calendarId = (conn?.calendar_id as string | undefined) ?? "primary";
  const fromClients = buildCalendarEventsFromClients(input.clients, input.labels);
  const events = mergeCalendarEvents(fromClients, input.customEvents);
  const idMap = await getGoogleEventIdMap(admin, input.userId);

  let synced = 0;
  let errors = 0;

  for (const ev of events) {
    const body = toGoogleBody(ev);
    try {
      const existing = idMap.get(ev.id);
      if (existing) {
        await patchEvent(accessToken, calendarId, existing, body);
      } else {
        const googleId = await insertEvent(accessToken, calendarId, body);
        await upsertGoogleEventIdMap(admin, input.userId, ev.id, googleId);
        idMap.set(ev.id, googleId);
      }
      synced += 1;
    } catch {
      errors += 1;
    }
  }

  await touchGoogleCalendarLastSync(admin, input.userId);
  return { ok: true, synced, errors };
}
