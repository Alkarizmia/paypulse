import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/server-supabase";
import { createNotificationServer } from "@/lib/notifications-server";
import { sendResendReminderEmail } from "@/lib/resend-reminder-send";

type ScanBody = {
  workspaceId?: string;
  ownerUserId?: string;
};

function trimEnv(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function isoDayUtcNow(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function invalid(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(request: Request) {
  const url = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!url || !anonKey) {
    return invalid("Missing Supabase public env.");
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";
  if (!token) return invalid("Unauthorized.", 401);

  const publicClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const {
    data: { user },
    error: userErr,
  } = await publicClient.auth.getUser(token);
  if (userErr || !user) return invalid("Unauthorized.", 401);

  let body: ScanBody;
  try {
    body = (await request.json()) as ScanBody;
  } catch {
    return invalid("Invalid JSON body.");
  }

  const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId.trim() : "";
  const ownerUserId = typeof body.ownerUserId === "string" ? body.ownerUserId.trim() : "";
  if (!workspaceId || !ownerUserId) return invalid("workspaceId and ownerUserId are required.");

  const server = getSupabaseServerClient();
  if (!server.ok) {
    return invalid("Server Supabase unavailable.", 500);
  }
  const supabase = server.client;

  const { data: workspaceRow, error: wsErr } = await supabase
    .from("workspaces")
    .select("id,user_id")
    .eq("id", workspaceId)
    .maybeSingle();
  if (wsErr) return invalid(wsErr.message, 500);
  if (!workspaceRow) return invalid("Workspace not found.", 404);
  if ((workspaceRow.user_id as string | null) !== ownerUserId) return invalid("Workspace owner mismatch.", 403);

  const requesterId = user.id;
  let allowed = requesterId === ownerUserId;
  if (!allowed) {
    const { data: member, error: memErr } = await supabase
      .from("account_members")
      .select("id")
      .eq("owner_user_id", ownerUserId)
      .eq("member_user_id", requesterId)
      .maybeSingle();
    if (memErr) return invalid(memErr.message, 500);
    allowed = Boolean(member);
  }
  if (!allowed) return invalid("Forbidden.", 403);

  const today = isoDayUtcNow();
  const { data: overdueRows, error: overdueErr } = await supabase
    .from("clients")
    .select("id,name,email,due_date,workspace_id,user_id")
    .eq("workspace_id", workspaceId)
    .eq("status", "unpaid")
    .is("deleted_at", null)
    .lte("due_date", today);
  if (overdueErr) return invalid(overdueErr.message, 500);

  if (!overdueRows || overdueRows.length === 0) {
    return NextResponse.json({ ok: true, scanned: 0, notified: 0, emailed: 0 });
  }

  const { data: ownerAuthUser, error: ownerErr } = await supabase.schema("auth").from("users").select("email").eq("id", ownerUserId).maybeSingle();
  if (ownerErr) return invalid(ownerErr.message, 500);
  const ownerEmail = (ownerAuthUser as { email?: string } | null)?.email?.trim().toLowerCase() ?? "";

  let notified = 0;
  let emailed = 0;
  for (const row of overdueRows as Array<{
    id: string;
    name: string;
    email: string;
    due_date: string;
    workspace_id: string | null;
    user_id: string | null;
  }>) {
    await createNotificationServer(supabase, {
      recipientUserId: ownerUserId,
      actorUserId: null,
      workspaceId,
      type: "overdue_detected",
      title: "overdue_detected",
      body: `${row.name} — ${row.due_date}`,
      payload: {
        clientId: row.id,
        dueDate: row.due_date,
        email: row.email,
        clientName: row.name,
      },
      notificationKey: `overdue:${row.id}:${today}:${ownerUserId}`,
    });
    notified += 1;

    const { data: insertedEmail, error: dedupErr } = await supabase
      .from("overdue_alert_dispatches")
      .insert({
        client_id: row.id,
        workspace_id: workspaceId,
        owner_user_id: ownerUserId,
        recipient_user_id: ownerUserId,
        alert_day: today,
        channel: "email",
      })
      .select("id")
      .maybeSingle();
    if (dedupErr) {
      const msg = String(dedupErr.message ?? "").toLowerCase();
      if (!msg.includes("duplicate")) return invalid(dedupErr.message, 500);
    }

    if (insertedEmail?.id && ownerEmail) {
      const send = await sendResendReminderEmail({
        to: ownerEmail,
        subject: `Alerte impaye - ${row.name}`,
        text: [
          "Bonjour,",
          "",
          `Un client est en retard de paiement dans PayPulss.`,
          `Client: ${row.name}`,
          `Email client: ${row.email}`,
          `Echeance: ${row.due_date}`,
          "",
          "Ouvrez votre dashboard pour agir rapidement.",
        ].join("\n"),
        html: [
          "<p>Bonjour,</p>",
          "<p>Un client est en retard de paiement dans <strong>PayPulss</strong>.</p>",
          `<ul><li><strong>Client:</strong> ${row.name}</li><li><strong>Email client:</strong> ${row.email}</li><li><strong>Echeance:</strong> ${row.due_date}</li></ul>`,
          "<p>Ouvrez votre dashboard pour agir rapidement.</p>",
        ].join(""),
      });
      if (send.ok) emailed += 1;
    }
  }

  return NextResponse.json({ ok: true, scanned: overdueRows.length, notified, emailed });
}
