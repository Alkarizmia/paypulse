import type { SupabaseClient } from "@supabase/supabase-js";
import { MARKETING_PLANS, paidPlanTier, type PlanId } from "./plans";

export type SubscriptionStatus = "trial" | "active" | "canceled" | "past_due";

export type SubscriptionBillingInterval = "month" | "year";

export type UserSubscription = {
  planId: PlanId;
  status: SubscriptionStatus;
  amountCents: number;
  currency: string;
  currentPeriodEnd: string | null;
  /** Intervalle Stripe (`price.recurring.interval`) ; null si inconnu ou ancienne ligne. */
  billingInterval: SubscriptionBillingInterval | null;
};

export type BillingRecord = {
  id: string;
  amountCents: number;
  currency: string;
  status: string;
  paidAt: string;
  provider: string;
};

type SubscriptionRow = {
  plan_id: PlanId;
  status: SubscriptionStatus;
  amount_cents: number | null;
  currency: string | null;
  current_period_end: string | null;
  billing_interval?: string | null;
  stripe_subscription_id?: string | null;
  created_at?: string;
};

function normalizeBillingInterval(v: string | null | undefined): SubscriptionBillingInterval | null {
  if (v === "month" || v === "year") return v;
  return null;
}

type BillingRow = {
  id: string;
  amount_cents: number;
  currency: string | null;
  status: string | null;
  paid_at: string;
  provider: string | null;
};

export function getPlanMeta(planId: PlanId) {
  return MARKETING_PLANS.find((p) => p.id === planId) ?? MARKETING_PLANS[0];
}

/** Période payante encore ouverte côté produit (inclut past_due : accès maintenu jusqu’à résolution Stripe). */
export function subscriptionEntitlesToPaidFeatures(sub: UserSubscription): boolean {
  if (sub.planId === "free") return false;
  if (sub.status === "canceled") return false;
  if (sub.status !== "active" && sub.status !== "trial" && sub.status !== "past_due") return false;
  if (!sub.currentPeriodEnd) return true;
  return new Date(sub.currentPeriodEnd).getTime() > Date.now();
}

/**
 * Fusionne la ligne Supabase « locale » et la vue `/api/stripe/active-subscription`
 * (évite d’écraser un plan payant réel par « free » quand Stripe n’a pas encore d’id en base).
 */
export function preferStrongerSubscriptionView(local: UserSubscription, stripe: UserSubscription): UserSubscription {
  const stripePaid = subscriptionEntitlesToPaidFeatures(stripe) && stripe.planId !== "free";
  const localPaid = subscriptionEntitlesToPaidFeatures(local) && local.planId !== "free";
  if (stripePaid && (!localPaid || paidPlanTier(stripe.planId) >= paidPlanTier(local.planId))) {
    return stripe;
  }
  if (localPaid) return local;
  return stripe;
}

/** True si l’utilisateur a déjà ce plan (ou mieux) avec une période encore valide — pas de nouveau Checkout inutile ni downgrade payant. */
export function shouldSkipStripeCheckoutForPlan(
  requestedPlan: Exclude<PlanId, "free">,
  sub: UserSubscription,
): boolean {
  if (!subscriptionEntitlesToPaidFeatures(sub)) return false;
  const req = paidPlanTier(requestedPlan);
  const cur = paidPlanTier(sub.planId);
  if (cur > req) return true;
  if (cur < req) return false;
  if (sub.planId !== requestedPlan) return false;
  if (sub.status !== "active" && sub.status !== "trial") return false;
  if (!sub.currentPeriodEnd) return true;
  return new Date(sub.currentPeriodEnd).getTime() > Date.now();
}

/** Si aucune ligne `billing_records`, afficher un aperçu depuis l’abonnement Stripe (ex. webhook pas encore passé). */
export function billingRecordsWithSubscriptionSnapshot(
  records: BillingRecord[],
  sub: UserSubscription | null,
): BillingRecord[] {
  if (records.length > 0) return records;
  // Même avec amount_cents = 0 (sync incomplète ou ancienne ligne), afficher un aperçu si le plan est payant.
  if (!sub || sub.planId === "free") return [];
  return [
    {
      id: "__stripe_subscription_snapshot",
      amountCents: sub.amountCents,
      currency: sub.currency,
      status: sub.status,
      paidAt: sub.currentPeriodEnd ?? new Date().toISOString(),
      provider: "stripe",
    },
  ];
}

export async function getCurrentSubscription(supabase: SupabaseClient, userId: string): Promise<UserSubscription> {
  const { data: rows, error } = await supabase
    .from("subscriptions")
    .select(
      "plan_id,status,amount_cents,currency,current_period_end,billing_interval,stripe_subscription_id,created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(24);
  if (error) throw error;
  const list = (rows ?? []) as SubscriptionRow[];
  if (list.length === 0) {
    return {
      planId: "free",
      status: "trial",
      amountCents: 0,
      currency: "EUR",
      currentPeriodEnd: null,
      billingInterval: null,
    };
  }

  const nonFree = list.filter((r) => r.plan_id && r.plan_id !== "free");
  let row: SubscriptionRow;
  const planRank = (pid: string | null | undefined): number => {
    if (pid === "agency") return 3;
    if (pid === "pro") return 2;
    if (pid === "starter") return 1;
    return 0;
  };

  if (nonFree.length > 0) {
    nonFree.sort((a, b) => {
      const aStripe = a.stripe_subscription_id && String(a.stripe_subscription_id).length > 0 ? 1 : 0;
      const bStripe = b.stripe_subscription_id && String(b.stripe_subscription_id).length > 0 ? 1 : 0;
      if (bStripe !== aStripe) return bStripe - aStripe;
      const endA = a.current_period_end ? new Date(a.current_period_end).getTime() : 0;
      const endB = b.current_period_end ? new Date(b.current_period_end).getTime() : 0;
      if (endB !== endA) return endB - endA;
      const ra = planRank(a.plan_id);
      const rb = planRank(b.plan_id);
      if (rb !== ra) return rb - ra;
      const ta = new Date(a.created_at ?? 0).getTime();
      const tb = new Date(b.created_at ?? 0).getTime();
      return tb - ta;
    });
    row = nonFree[0]!;
  } else {
    const withStripe = list.filter((r) => r.stripe_subscription_id && String(r.stripe_subscription_id).length > 0);
    if (withStripe.length > 0) {
      withStripe.sort((a, b) => {
        const endA = a.current_period_end ? new Date(a.current_period_end).getTime() : 0;
        const endB = b.current_period_end ? new Date(b.current_period_end).getTime() : 0;
        if (endB !== endA) return endB - endA;
        const ra = planRank(a.plan_id);
        const rb = planRank(b.plan_id);
        if (rb !== ra) return rb - ra;
        const ta = new Date(a.created_at ?? 0).getTime();
        const tb = new Date(b.created_at ?? 0).getTime();
        return tb - ta;
      });
      row = withStripe[0]!;
    } else {
      row = list[0]!;
    }
  }

  return {
    planId: row.plan_id ?? "free",
    status: row.status ?? "trial",
    amountCents: row.amount_cents ?? 0,
    currency: row.currency ?? "EUR",
    currentPeriodEnd: row.current_period_end,
    billingInterval: normalizeBillingInterval(row.billing_interval),
  };
}

export async function getBillingRecords(supabase: SupabaseClient, userId: string): Promise<BillingRecord[]> {
  const { data, error } = await supabase
    .from("billing_records")
    .select("id,amount_cents,currency,status,paid_at,provider")
    .eq("user_id", userId)
    .order("paid_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  return ((data ?? []) as BillingRow[]).map((row) => ({
    id: row.id,
    amountCents: row.amount_cents,
    currency: row.currency ?? "EUR",
    status: row.status ?? "paid",
    paidAt: row.paid_at,
    provider: row.provider ?? "mock",
  }));
}

export function getBillingTotalCents(records: BillingRecord[]): number {
  return records.reduce((sum, rec) => sum + rec.amountCents, 0);
}

export async function setCurrentSubscriptionPlan(
  supabase: SupabaseClient,
  userId: string,
  planId: PlanId,
): Promise<UserSubscription> {
  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      user_id: userId,
      plan_id: planId,
      status: "active",
      amount_cents: 0,
      currency: "EUR",
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select("plan_id,status,amount_cents,currency,current_period_end,billing_interval")
    .single();

  if (error) throw error;

  const row = data as SubscriptionRow;
  return {
    planId: row.plan_id ?? "free",
    status: row.status ?? "trial",
    amountCents: row.amount_cents ?? 0,
    currency: row.currency ?? "EUR",
    currentPeriodEnd: row.current_period_end,
    billingInterval: normalizeBillingInterval(row.billing_interval),
  };
}
