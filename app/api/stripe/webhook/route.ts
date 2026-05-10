import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getSupabaseServerClient } from "@/lib/server-supabase";
import { getStripe } from "@/lib/stripe-server";
import {
  subscriptionWithCheckoutSessionFallback,
  upsertBillingRecordFromCheckoutSession,
  upsertSubscriptionRowFromStripe,
} from "@/lib/stripe-sync-subscription";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripe();
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !whSecret) {
    return NextResponse.json({ error: "Stripe webhook not configured." }, { status: 503 });
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, whSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const adminResult = getSupabaseServerClient();
  if (!adminResult.ok) {
    return NextResponse.json({ error: "Supabase service role not configured." }, { status: 503 });
  }
  const admin = adminResult.client;

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;
        const subRef = session.subscription;
        const subId = typeof subRef === "string" ? subRef : subRef?.id;
        if (!subId) break;
        const sub = await stripe.subscriptions.retrieve(subId, { expand: ["items.data.price"] });
        const subForSync = subscriptionWithCheckoutSessionFallback(sub, session);
        const synced = await upsertSubscriptionRowFromStripe(admin, subForSync);
        if (!synced.ok) {
          break;
        }
        const billUserId = subForSync.metadata?.supabase_user_id?.trim() ?? "";
        if (billUserId) {
          await upsertBillingRecordFromCheckoutSession(admin, session, billUserId);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subPartial = event.data.object as Stripe.Subscription;
        const sub = await stripe.subscriptions.retrieve(subPartial.id, { expand: ["items.data.price"] });
        await upsertSubscriptionRowFromStripe(admin, sub);
        break;
      }
      default:
        break;
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
