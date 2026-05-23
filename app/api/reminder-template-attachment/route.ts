import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  attachmentPathOwnedByUser,
  buildAttachmentStoragePath,
  displayAttachmentFileName,
  formatAttachmentBytes,
  isAllowedReminderAttachment,
  REMINDER_ATTACHMENT_BUCKET,
} from "@/lib/reminder-template-attachment";
import { getReminderAttachmentMaxBytes } from "@/lib/plans";
import { getCurrentSubscription } from "@/lib/subscriptions";
import { getSupabaseServerClient } from "@/lib/server-supabase";
import { getUserIdFromAuthorizationHeader } from "@/lib/supabase-route-auth";

function trimEnv(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

async function userCanAccessWorkspace(userId: string, bearer: string, workspaceId: string): Promise<boolean> {
  const url = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!url || !anonKey) return false;
  const userClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${bearer}` } },
  });
  const { data, error } = await userClient.from("workspaces").select("id").eq("id", workspaceId).maybeSingle();
  return !error && Boolean(data?.id);
}

export async function POST(request: Request) {
  const userId = await getUserIdFromAuthorizationHeader(request);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const rawAuth = request.headers.get("authorization") ?? "";
  const bearer = rawAuth.toLowerCase().startsWith("bearer ") ? rawAuth.slice(7).trim() : "";

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid form data." }, { status: 400 });
  }

  const file = form.get("file");
  const workspaceId = typeof form.get("workspaceId") === "string" ? String(form.get("workspaceId")).trim() : "";
  const daysRaw = form.get("daysAfterDue");
  const daysAfterDue = Number.parseInt(String(daysRaw ?? ""), 10);

  if (!(file instanceof File) || !workspaceId || !Number.isInteger(daysAfterDue) || daysAfterDue < 0 || daysAfterDue > 120) {
    return NextResponse.json({ ok: false, error: "Required: file, workspaceId, daysAfterDue." }, { status: 400 });
  }

  if (!(await userCanAccessWorkspace(userId, bearer, workspaceId))) {
    return NextResponse.json({ ok: false, error: "Workspace not found." }, { status: 403 });
  }

  if (!isAllowedReminderAttachment(file)) {
    return NextResponse.json(
      { ok: false, error: "Type non autorisé. Utilisez un PDF ou une image (JPEG, PNG, WebP, GIF)." },
      { status: 400 },
    );
  }

  const server = getSupabaseServerClient();
  if (!server.ok) {
    return NextResponse.json({ ok: false, error: "Server storage unavailable." }, { status: 500 });
  }

  const sub = await getCurrentSubscription(server.client, userId);
  const maxBytes = getReminderAttachmentMaxBytes(sub.planId);
  if (maxBytes <= 0) {
    return NextResponse.json({ ok: false, error: "Plan without attachment support." }, { status: 403 });
  }
  if (file.size > maxBytes) {
    return NextResponse.json(
      {
        ok: false,
        error: `Fichier trop volumineux (max. ${formatAttachmentBytes(maxBytes, "fr")} sur votre plan).`,
        maxBytes,
      },
      { status: 413 },
    );
  }

  const storagePath = buildAttachmentStoragePath(userId, workspaceId, daysAfterDue, file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = file.type.trim() || "application/octet-stream";

  const { error: upErr } = await server.client.storage.from(REMINDER_ATTACHMENT_BUCKET).upload(storagePath, buffer, {
    contentType,
    upsert: true,
  });
  if (upErr) {
    return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    storagePath,
    fileName: displayAttachmentFileName(file.name),
    contentType,
    sizeBytes: file.size,
  });
}

export async function DELETE(request: Request) {
  const userId = await getUserIdFromAuthorizationHeader(request);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  let body: { storagePath?: string };
  try {
    body = (await request.json()) as { storagePath?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const storagePath = typeof body.storagePath === "string" ? body.storagePath.trim() : "";
  if (!storagePath || !attachmentPathOwnedByUser(storagePath, userId)) {
    return NextResponse.json({ ok: false, error: "Invalid path." }, { status: 400 });
  }

  const server = getSupabaseServerClient();
  if (!server.ok) {
    return NextResponse.json({ ok: false, error: "Server storage unavailable." }, { status: 500 });
  }

  const { error } = await server.client.storage.from(REMINDER_ATTACHMENT_BUCKET).remove([storagePath]);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
