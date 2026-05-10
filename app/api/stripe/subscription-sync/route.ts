import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe-server";
import { getSupabaseServerClient } from "@/lib/server-supabase";
import {
  getBillingIntervalFromStripeSubscription,
  upsertSubscriptionRowFromStripe,
} from "@/lib/stripe-sync-subscription";
import { getUserIdFromAuthorizationHeader } from "@/lib/supabase-route-auth";

export const runtime = "nodejs";

/** Récupère la fin de période depuis Stripe et aligne la ligne `subscriptions` en base. */
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
  const admin = adminResult.client;

  const { data: row } = await admin
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("user_id", userId)
    .not("stripe_subscription_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const subId = row?.stripe_subscription_id as string | undefined;
  if (!subId) {
    return NextResponse.json({ currentPeriodEnd: null, billingInterval: null, cancelAtPeriodEnd: false });
  }

  const sub = await stripe.subscriptions.retrieve(subId, { expand: ["items.data.price"] });
  await upsertSubscriptionRowFromStripe(admin, sub);

  const currentPeriodEnd =
    typeof sub.current_period_end === "number" ? new Date(sub.current_period_end * 1000).toISOString() : null;

  return NextResponse.json({
    currentPeriodEnd,
    billingInterval: getBillingIntervalFromStripeSubscription(sub),
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
    status: sub.status,
  });
}
