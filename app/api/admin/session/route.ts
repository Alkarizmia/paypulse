import { NextResponse } from "next/server";
import {
  adminSessionCookieOptions,
  getUserFromAccessToken,
  isAdminEmail,
  ADMIN_ACCESS_COOKIE,
} from "@/lib/admin-auth";

/** Pose / retire le cookie httpOnly admin après vérif Bearer + ADMIN_EMAILS. */
export async function POST(request: Request) {
  const raw = request.headers.get("authorization");
  const bearer =
    typeof raw === "string" && raw.toLowerCase().startsWith("bearer ") ? raw.slice(7).trim() : "";
  if (!bearer) {
    return new NextResponse(null, { status: 404 });
  }

  const user = await getUserFromAccessToken(bearer);
  if (!user || !isAdminEmail(user.email)) {
    return new NextResponse(null, { status: 404 });
  }

  const res = new NextResponse(null, { status: 204 });
  const opts = adminSessionCookieOptions(bearer);
  res.cookies.set(opts.name, opts.value, {
    httpOnly: opts.httpOnly,
    secure: opts.secure,
    sameSite: opts.sameSite,
    path: opts.path,
    maxAge: opts.maxAge,
  });
  return res;
}

export async function DELETE() {
  const res = new NextResponse(null, { status: 204 });
  res.cookies.set(ADMIN_ACCESS_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
