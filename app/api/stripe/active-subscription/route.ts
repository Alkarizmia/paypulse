import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe-server";
import { getSupabaseServerClient } from "@/lib/server-supabase";
import { resolveLiveStripeSubscriptionForUser } from "@/lib/stripe-resolve-live-subscription";
import { getUserIdFromAuthorizationHeader } from "@/lib/supabase-route-auth";

export const runtime = "nodejs";

/** Choisit l’abonnement Stripe « courant » (plusieurs lignes / anciens tests en base). */
export async function GET(request: Request) {
  const userId = await getUserIdFromAuthorizationHeader(request);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const stripe = getStripe();
  const adminResult = getSupabaseServerClient();
  if (!stripe || !adminResult.ok) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const { view } = await resolveLiveStripeSubscriptionForUser(adminResult.client, stripe, userId, {
    upsertRow: true,
  });
  return NextResponse.json({ subscription: view });
}
