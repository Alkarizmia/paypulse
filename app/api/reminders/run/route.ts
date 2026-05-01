import { NextResponse } from "next/server";
import { enqueueDueReminderJobs, processDueReminderJobs } from "@/lib/reminder-automation";
import { getSupabaseServerClient } from "@/lib/server-supabase";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET missing" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${secret}`;
  if (authHeader !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabaseRes = getSupabaseServerClient();
  if (!supabaseRes.ok) {
    return NextResponse.json(
      {
        ok: false,
        error:
          supabaseRes.error === "MISSING_SUPABASE_SERVICE_ROLE_KEY"
            ? "Missing SUPABASE_SERVICE_ROLE_KEY."
            : supabaseRes.error === "MISSING_SUPABASE_URL"
              ? "Missing NEXT_PUBLIC_SUPABASE_URL."
              : "Invalid NEXT_PUBLIC_SUPABASE_URL.",
      },
      { status: 500 },
    );
  }

  try {
    const queue = await enqueueDueReminderJobs(supabaseRes.client);
    const processed = await processDueReminderJobs(supabaseRes.client);
    return NextResponse.json({
      ok: true,
      message: "Cron executed",
      queue,
      processed,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cron processing failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
