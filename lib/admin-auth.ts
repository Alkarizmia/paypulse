import type { NextRequest } from "next/server";

export const ADMIN_ACCESS_COOKIE = "pp_admin_at";

const COOKIE_MAX_AGE_SEC = 60 * 60 * 8;

function trimEnv(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Emails autorisés (ADMIN_EMAILS, séparés par virgule). */
export function getAdminEmails(): Set<string> {
  const raw = trimEnv(process.env.ADMIN_EMAILS);
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().has(email.trim().toLowerCase());
}

export type AuthUser = { id: string; email: string };

export async function getUserFromAccessToken(accessToken: string): Promise<AuthUser | null> {
  const token = accessToken.trim();
  if (!token) return null;

  const url = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!url || !anonKey) return null;

  const base = url.replace(/\/$/, "");
  const res = await fetch(`${base}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anonKey,
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { id?: string; email?: string };
  if (typeof body.id !== "string" || !body.id) return null;
  if (typeof body.email !== "string" || !body.email) return null;
  return { id: body.id, email: body.email };
}

function bearerFromRequest(request: Request): string {
  const raw = request.headers.get("authorization");
  if (typeof raw === "string" && raw.toLowerCase().startsWith("bearer ")) {
    return raw.slice(7).trim();
  }
  return "";
}

function cookieTokenFromRequest(request: Request): string {
  const header = request.headers.get("cookie") ?? "";
  const parts = header.split("; ");
  for (const part of parts) {
    if (part.startsWith(`${ADMIN_ACCESS_COOKIE}=`)) {
      try {
        return decodeURIComponent(part.slice(ADMIN_ACCESS_COOKIE.length + 1));
      } catch {
        return "";
      }
    }
  }
  return "";
}

/** Vérifie Bearer ou cookie admin. Retourne l'utilisateur admin ou null. */
export async function getAdminUserFromRequest(request: Request): Promise<AuthUser | null> {
  const token = bearerFromRequest(request) || cookieTokenFromRequest(request);
  if (!token) return null;
  const user = await getUserFromAccessToken(token);
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}

/** Pour middleware Edge. */
export async function isAdminNextRequest(request: NextRequest): Promise<boolean> {
  const user = await getAdminUserFromRequest(request);
  return Boolean(user);
}

export function adminSessionCookieOptions(token: string) {
  return {
    name: ADMIN_ACCESS_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: COOKIE_MAX_AGE_SEC,
  };
}
