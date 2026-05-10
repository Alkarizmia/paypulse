import type { SupabaseClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import {
  upsertSubscriptionRowFromStripe,
  userSubscriptionViewFromStripe,
} from "@/lib/stripe-sync-subscription";
import type { UserSubscription } from "@/lib/subscriptions";

const STRIPE_LIVE: Stripe.Subscription.Status[] = ["active", "trialing", "past_due"];

function planRank(planId: string): number {
  if (planId === "agency") return 3;
  if (planId === "pro") return 2;
  if (planId === "starter") return 1;
  return 0;
}

const FREE_SNAPSHOT: UserSubscription = {
  planId: "free",
  status: "trial",
  amountCents: 0,
  currency: "EUR",
  currentPeriodEnd: null,
  billingInterval: null,
};

/**
 * Abonnement Stripe « vivant » le plus pertinent pour l’utilisateur (plusieurs ids en base possibles).
 * Optionnellement réaligne `public.subscriptions` pour cet abonnement.
 */
export async function resolveLiveStripeSubscriptionForUser(
  admin: SupabaseClient,
  stripe: Stripe,
  userId: string,
  options?: { upsertRow?: boolean },
): Promise<{ stripeSubscription: Stripe.Subscription | null; view: UserSubscription }> {
  const upsertRow = options?.upsertRow !== false;

  const { data: rows, error } = await admin
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("user_id", userId)
    .not("stripe_subscription_id", "is", null);
  if (error) throw error;

  const ids = [
    ...new Set(
      (rows ?? [])
        .map((r) => r.stripe_subscription_id as string | null)
        .filter((x): x is string => typeof x === "string" && x.length > 0),
    ),
  ];

  if (ids.length === 0) {
    return { stripeSubscription: null, view: FREE_SNAPSHOT };
  }

  let best: Stripe.Subscription | null = null;
  let bestEnd = -1;
  let bestRank = -1;

  for (const id of ids) {
    try {
      const sub = await stripe.subscriptions.retrieve(id, { expand: ["items.data.price"] });
      if (!STRIPE_LIVE.includes(sub.status)) continue;
      const end = typeof sub.current_period_end === "number" ? sub.current_period_end : 0;
      const view = userSubscriptionViewFromStripe(sub);
      const rank = planRank(view.planId);
      if (!best || end > bestEnd || (end === bestEnd && rank > bestRank)) {
        best = sub;
        bestEnd = end;
        bestRank = rank;
      }
    } catch {
      /* supprimé côté Stripe */
    }
  }

  if (!best) {
    return { stripeSubscription: null, view: FREE_SNAPSHOT };
  }

  if (upsertRow) {
    await upsertSubscriptionRowFromStripe(admin, best);
  }
  return { stripeSubscription: best, view: userSubscriptionViewFromStripe(best) };
}
