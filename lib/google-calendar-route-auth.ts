import type { SupabaseClient } from "@supabase/supabase-js";
import { getUserIdFromAuthorizationHeader } from "@/lib/supabase-route-auth";
import { getSupabaseServerClient } from "@/lib/server-supabase";

export async function requireGoogleCalendarRouteAuth(
  request: Request,
): Promise<{ userId: string; admin: SupabaseClient } | { error: Response }> {
  const userId = await getUserIdFromAuthorizationHeader(request);
  if (!userId) {
    return {
      error: new Response(JSON.stringify({ ok: false, error: "Authentication required." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  const adminResult = getSupabaseServerClient();
  if (!adminResult.ok) {
    return {
      error: new Response(JSON.stringify({ ok: false, error: "Server configuration incomplete." }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  return { userId, admin: adminResult.client };
}
