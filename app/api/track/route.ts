import { NextResponse } from "next/server";
import { isAppLocale } from "@/lib/app-locale";
import { clientIpFromRequest } from "@/lib/client-ip";
import { isRateLimited } from "@/lib/route-rate-limit";
import { getSupabaseServerClient } from "@/lib/server-supabase";

const EVENTS = new Set([
  "cta_click",
  "modal_open",
  "email_focus",
  "signup_success",
  "signup_error",
] as const);

const LOCATIONS = new Set(["hero", "calculateur", "fin_de_page", "menu"] as const);

type TrackBody = {
  event?: unknown;
  location?: unknown;
  source?: unknown;
  lang?: unknown;
};

function noContent() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(request: Request) {
  // Rate limit mémoire uniquement (IP jamais persistée dans waitlist_events).
  const ip = clientIpFromRequest(request);
  if (isRateLimited(`track:ip:${ip}`, 60, 60_000)) {
    return noContent();
  }

  let body: TrackBody;
  try {
    body = (await request.json()) as TrackBody;
  } catch {
    return noContent();
  }

  const event = typeof body.event === "string" ? body.event.trim() : "";
  if (!EVENTS.has(event as never)) {
    return noContent();
  }

  let location: string | null = null;
  if (body.location !== undefined && body.location !== null) {
    const loc = typeof body.location === "string" ? body.location.trim() : "";
    if (!LOCATIONS.has(loc as never)) {
      return noContent();
    }
    location = loc;
  }

  let lang: string | null = null;
  if (typeof body.lang === "string") {
    const l = body.lang.trim().toLowerCase().slice(0, 8);
    if (isAppLocale(l)) lang = l;
  }

  let source: string | null = null;
  if (typeof body.source === "string") {
    const s = body.source.trim().slice(0, 50);
    if (s) source = s;
  }

  const supabase = getSupabaseServerClient();
  if (!supabase.ok) {
    return noContent();
  }

  try {
    await supabase.client.from("waitlist_events").insert({
      event,
      location,
      source,
      lang,
    });
  } catch {
    // never surface errors to client
  }

  return noContent();
}
