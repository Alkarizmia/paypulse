import { NextResponse, type NextRequest } from "next/server";
import { getAdminUserFromRequest } from "@/lib/admin-auth";
import { isWaitlistMode } from "@/lib/waitlist-mode";

/**
 * Mode waitlist (NEXT_PUBLIC_WAITLIST_MODE=true) :
 * - pages produit / auth → redirect /
 * - /api/* bloqué sauf waitlist + track + admin + crons/webhooks
 * Pages légales, marketing, assets : laissées passer.
 * /admin et /api/admin/* : exemptés du redirect waitlist ; APIs admin → 404 si non autorisé.
 */

const ALLOWED_PAGE_PREFIXES = [
  "/",
  "/contact",
  "/a-propos",
  "/legal",
  "/mentions-legales",
  "/confidentialite",
  "/conditions-utilisation",
  "/droits-securite-donnees",
  "/free",
  "/gratuit",
  "/admin",
  "/login",
  "/auth",
] as const;

/** APIs autorisées en waitlist (collecte + automatismes secret-gated + admin). */
const ALLOWED_API_PREFIXES = [
  "/api/waitlist",
  "/api/track",
  "/api/admin",
  "/api/stripe/webhook",
  "/api/reminders/run",
] as const;

function isAllowedPage(pathname: string): boolean {
  if (pathname === "/") return true;
  return ALLOWED_PAGE_PREFIXES.some((p) => p !== "/" && (pathname === p || pathname.startsWith(`${p}/`)));
}

function isAllowedApi(pathname: string): boolean {
  return ALLOWED_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function notFoundResponse(): NextResponse {
  return new NextResponse("Not Found", { status: 404 });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes admin API : toujours vérifier côté serveur (même hors waitlist).
  if (pathname.startsWith("/api/admin")) {
    // /api/admin/session POST : vérifie le Bearer dans la route elle-même.
    if (pathname === "/api/admin/session") {
      return NextResponse.next();
    }
    const admin = await getAdminUserFromRequest(request);
    if (!admin) {
      return notFoundResponse();
    }
    return NextResponse.next();
  }

  if (!isWaitlistMode()) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    if (isAllowedApi(pathname)) {
      return NextResponse.next();
    }
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
  }

  if (isAllowedPage(pathname)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Exclure _next, images statiques, favicon, manifest.
     * Le reste passe par le middleware (pages + api).
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
