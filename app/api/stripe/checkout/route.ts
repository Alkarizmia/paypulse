import { NextResponse } from "next/server";
import { paidPlanTier, type PlanId } from "@/lib/plans";
import {
  getStripePriceId,
  isStripeCheckoutFullyConfigured,
  listMissingStripeCheckoutEnv,
  type StripeBillingCycle,
} from "@/lib/stripe-prices";
import { getAppOrigin, getStripe } from "@/lib/stripe-server";
import { resolveLiveStripeSubscriptionForUser } from "@/lib/stripe-resolve-live-subscription";
import { getSupabaseServerClient } from "@/lib/server-supabase";
import { subscriptionEntitlesToPaidFeatures } from "@/lib/subscriptions";
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
      {
        error: "Stripe Checkout is not configured.",
        code: "STRIPE_NOT_CONFIGURED",
        missingEnv: listMissingStripeCheckoutEnv(),
      },
      { status: 503 },
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      {
        error: "Stripe secret key missing.",
        code: "STRIPE_NOT_CONFIGURED",
        missingEnv: listMissingStripeCheckoutEnv(),
      },
      { status: 503 },
    );
  }

  const adminResult = getSupabaseServerClient();
  if (adminResult.ok) {
    const { view } = await resolveLiveStripeSubscriptionForUser(adminResult.client, stripe, userId, {
      upsertRow: false,
    });
    if (
      subscriptionEntitlesToPaidFeatures(view) &&
      view.planId !== "free" &&
      paidPlanTier(view.planId) > paidPlanTier(planId as PlanId)
    ) {
      return NextResponse.json(
        {
          error:
            "You already have a higher-tier subscription for the current period. Use the Stripe customer portal to change or cancel before choosing a lower plan.",
          code: "STRIPE_DOWNGRADE_BLOCKED",
        },
        { status: 409 },
      );
    }
  }

  const priceId = getStripePriceId(planId, billing);
  if (!priceId) {
    return NextResponse.json(
      {
        error: "Missing price ID for this plan.",
        code: "STRIPE_NOT_CONFIGURED",
        missingEnv: listMissingStripeCheckoutEnv(),
      },
      { status: 503 },
    );
  }

  const origin = getAppOrigin();
  const planForMeta = planId as Exclude<PlanId, "free">;

  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.create>>;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      /** Si activé dans le Dashboard, le prix adaptatif peut modifier l’UI Checkout (lien promo moins évident). */
      adaptive_pricing: { enabled: false },
      custom_text: {
        submit: {
          message:
            "Code promo : cherchez le lien « Ajouter un code promotionnel » sous le sous-total, dans la colonne de gauche (récapitulatif du panier), puis saisissez votre code avant de payer.",
        },
      },
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
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message, code: "STRIPE_SESSION_FAILED" }, { status: 502 });
  }

  if (!session.url) {
    return NextResponse.json({ error: "Checkout session missing URL." }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
