import { NextResponse } from "next/server";
import { getAppOrigin, getStripe } from "@/lib/stripe-server";
import { resolveLiveStripeSubscriptionForUser } from "@/lib/stripe-resolve-live-subscription";
import { getSupabaseServerClient } from "@/lib/server-supabase";
import { getUserIdFromAuthorizationHeader } from "@/lib/supabase-route-auth";

export const runtime = "nodejs";

/**
 * Portail client Stripe (annuler / modifier l’abonnement, moyen de paiement).
 * À activer une fois dans Stripe Dashboard → Paramètres → Portail client.
 */
export async function POST(request: Request) {
  const userId = await getUserIdFromAuthorizationHeader(request);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const stripe = getStripe();
  const adminResult = getSupabaseServerClient();
  if (!stripe || !adminResult.ok) {
    return NextResponse.json({ error: "Stripe or Supabase not configured." }, { status: 503 });
  }
  const admin = adminResult.client;

  let body: { returnUrl?: string } = {};
  try {
    body = (await request.json()) as { returnUrl?: string };
  } catch {
    body = {};
  }

  /** Même logique que `/api/stripe/active-subscription` (plusieurs lignes / ids en base). */
  let sub;
  try {
    const resolved = await resolveLiveStripeSubscriptionForUser(admin, stripe, userId, { upsertRow: false });
    sub = resolved.stripeSubscription;
  } catch {
    sub = null;
  }
  if (!sub) {
    return NextResponse.json(
      {
        error:
          "No active Stripe subscription found for this account, or Stripe key mode does not match the subscription IDs in the database.",
        code: "NO_ACTIVE_STRIPE_SUBSCRIPTION",
      },
      { status: 404 },
    );
  }

  const cust = sub.customer;
  const customerId = typeof cust === "string" ? cust : cust && "id" in cust ? cust.id : null;
  if (!customerId) {
    return NextResponse.json({ error: "Missing Stripe customer on subscription." }, { status: 500 });
  }

  const origin = getAppOrigin();
  const returnUrl =
    typeof body.returnUrl === "string" && (body.returnUrl.startsWith("http://") || body.returnUrl.startsWith("https://"))
      ? body.returnUrl
      : `${origin}/settings`;

  let session: { url: string | null };
  try {
    session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message, code: "PORTAL_FAILED" }, { status: 502 });
  }

  if (!session.url) {
    return NextResponse.json({ error: "Portal session missing URL." }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
