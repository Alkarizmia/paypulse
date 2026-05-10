import { NextResponse } from "next/server";
import type { PlanId } from "@/lib/plans";
import { getStripePriceId, isStripeCheckoutFullyConfigured, type StripeBillingCycle } from "@/lib/stripe-prices";
import { getAppOrigin, getStripe } from "@/lib/stripe-server";
import { getUserIdFromAuthorizationHeader } from "@/lib/supabase-route-auth";

type CheckoutBody = {
  planId?: string;
  billingCycle?: string;
};

function parseBilling(value: string | undefined): StripeBillingCycle {
  return value === "annual" ? "annual" : "monthly";
}

export async function POST(request: Request) {
  const userId = await getUserIdFromAuthorizationHeader(request);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const planId = body.planId;
  if (planId !== "starter" && planId !== "pro" && planId !== "agency") {
    return NextResponse.json({ error: "Invalid planId.", code: "INVALID_PLAN" }, { status: 400 });
  }

  const billing = parseBilling(body.billingCycle);

  if (!isStripeCheckoutFullyConfigured()) {
    return NextResponse.json(
      { error: "Stripe Checkout is not configured.", code: "STRIPE_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe secret key missing.", code: "STRIPE_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  const priceId = getStripePriceId(planId, billing);
  if (!priceId) {
    return NextResponse.json(
      { error: "Missing price ID for this plan.", code: "STRIPE_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  const origin = getAppOrigin();
  const planForMeta = planId as Exclude<PlanId, "free">;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?stripe=success`,
    cancel_url: `${origin}/dashboard?stripe=cancel`,
    client_reference_id: userId,
    metadata: {
      supabase_user_id: userId,
      plan_id: planForMeta,
    },
    subscription_data: {
      metadata: {
        supabase_user_id: userId,
        plan_id: planForMeta,
      },
    },
  });

  if (!session.url) {
    return NextResponse.json({ error: "Checkout session missing URL." }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
