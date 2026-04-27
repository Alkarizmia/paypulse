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

export async function getCurrentSubscription(supabase: SupabaseClient, userId: string): Promise<UserSubscription> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("plan_id,status,amount_cents,currency,current_period_end")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    return {
      planId: "free",
      status: "trial",
      amountCents: 0,
      currency: "EUR",
      currentPeriodEnd: null,
    };
  }
  const row = data as SubscriptionRow;
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
