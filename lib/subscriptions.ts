import type { SupabaseClient } from "@supabase/supabase-js";
import { MARKETING_PLANS, type PlanId } from "./plans";

export type SubscriptionStatus = "trial" | "active" | "canceled" | "past_due";

export type UserSubscription = {
  planId: PlanId;
  status: SubscriptionStatus;
  amountCents: number;
  currency: string;
  currentPeriodEnd: string | null;
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
  stripe_subscription_id?: string | null;
  created_at?: string;
};

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

/** True si l’utilisateur a déjà ce plan payant avec une période Stripe encore valide (pas de nouveau Checkout). */
export function shouldSkipStripeCheckoutForPlan(
  requestedPlan: Exclude<PlanId, "free">,
  sub: UserSubscription,
): boolean {
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
  if (!sub || sub.planId === "free" || sub.amountCents <= 0) return [];
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
    .select("plan_id,status,amount_cents,currency,current_period_end,stripe_subscription_id,created_at")
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
    };
  }

  const nonFree = list.filter((r) => r.plan_id && r.plan_id !== "free");
  let row: SubscriptionRow;
  if (nonFree.length > 0) {
    nonFree.sort((a, b) => {
      const ta = new Date(a.created_at ?? 0).getTime();
      const tb = new Date(b.created_at ?? 0).getTime();
      return tb - ta;
    });
    row = nonFree[0]!;
  } else {
    const withStripe = list.filter((r) => r.stripe_subscription_id && String(r.stripe_subscription_id).length > 0);
    if (withStripe.length > 0) {
      withStripe.sort((a, b) => {
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
    .select("plan_id,status,amount_cents,currency,current_period_end")
    .single();

  if (error) throw error;

  const row = data as SubscriptionRow;
  return {
    planId: row.plan_id ?? "free",
    status: row.status ?? "trial",
    amountCents: row.amount_cents ?? 0,
    currency: row.currency ?? "EUR",
    currentPeriodEnd: row.current_period_end,
  };
}
