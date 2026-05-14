import { NextResponse } from "next/server";
import { buildAuthUserMetadataFromProfile, type UserProfile } from "@/lib/profile";
import { getSupabaseServerClient } from "@/lib/server-supabase";
import { getUserIdFromAuthorizationHeader } from "@/lib/supabase-route-auth";

export const runtime = "nodejs";

/**
 * Synchronise nom / téléphone / adresse vers `auth.users` (dashboard Supabase → Authentication → Users).
 * Nécessite `SUPABASE_SERVICE_ROLE_KEY` côté serveur : `auth.admin.updateUserById` remplit mieux
 * les colonnes « Display name » / « Phone » que le seul `updateUser` navigateur.
 */
function clip(s: unknown, max: number): string {
  if (typeof s !== "string") return "";
  return s.trim().slice(0, max);
}

export async function POST(request: Request) {
  const userId = await getUserIdFromAuthorizationHeader(request);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const profile: Pick<UserProfile, "fullName" | "companyName" | "phone" | "address" | "country"> = {
    fullName: clip(body.fullName, 200),
    companyName: clip(body.companyName, 200),
    phone: clip(body.phone, 40),
    address: clip(body.address, 400),
    country: clip(body.country, 120),
  };

  const adminResult = getSupabaseServerClient();
  if (!adminResult.ok) {
    return NextResponse.json(
      { error: "Missing SUPABASE_SERVICE_ROLE_KEY on server.", code: "NO_SERVICE_ROLE" },
      { status: 503 },
    );
  }

  const admin = adminResult.client;
  const { metadata, e164 } = buildAuthUserMetadataFromProfile(profile);

  if (Object.keys(metadata).length === 0 && !e164) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  if (Object.keys(metadata).length > 0) {
    const { error } = await admin.auth.admin.updateUserById(userId, { user_metadata: metadata });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  if (e164) {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      phone: e164,
      phone_confirm: true,
    });
    if (error) {
      const m = error.message.toLowerCase();
      const dup =
        m.includes("duplicate") ||
        m.includes("users_phone") ||
        m.includes("23505") ||
        m.includes("unique constraint");
      return NextResponse.json({
        ok: true,
        phoneSkipped: true,
        phoneError: error.message,
        phoneDuplicate: dup,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
