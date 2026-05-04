/**
 * Validation du JWT utilisateur depuis un route handler Next (sans cookies SSR).
 * Appelle l’endpoint GoTrue utilisé par Supabase — évite d’expéder des fonctions externes sans contrôle auth.
 */

function trimEnv(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function getUserIdFromAuthorizationHeader(request: Request): Promise<string | null> {
  const raw = request.headers.get("authorization");
  const bearer = typeof raw === "string" && raw.toLowerCase().startsWith("bearer ") ? raw.slice(7).trim() : "";
  if (!bearer) return null;

  const url = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!url || !anonKey) return null;

  const base = url.replace(/\/$/, "");
  const res = await fetch(`${base}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${bearer}`,
      apikey: anonKey,
    },
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { id?: string };
  return typeof body.id === "string" && body.id.length > 0 ? body.id : null;
}
