import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import type { PlanId } from "@/lib/plans";
import type { SubscriptionStatus } from "@/lib/subscriptions";

/**
 * Stripe copie en principe `subscription_data.metadata` sur l’abonnement, mais selon
 * le moment du webhook ou la version d’API, on peut s’appuyer sur la session Checkout
 * (`metadata`, `client_reference_id`) pour retrouver user + plan.
 */
export function subscriptionWithCheckoutSessionFallback(
  sub: Stripe.Subscription,
  session: Stripe.Checkout.Session,
): Stripe.Subscription {
  const fromSubUser = sub.metadata?.supabase_user_id?.trim() ?? "";
  const fromSubPlan = sub.metadata?.plan_id?.trim() ?? "";
  const fromSessionUser =
    (typeof session.metadata?.supabase_user_id === "string" ? session.metadata.supabase_user_id : "")?.trim() ?? "";
  const fromSessionPlan =
    (typeof session.metadata?.plan_id === "string" ? session.metadata.plan_id : "")?.trim() ?? "";
  const fromClientRef = session.client_reference_id?.trim() ?? "";

  const supabase_user_id = fromSubUser || fromSessionUser || fromClientRef;
  const plan_id = fromSubPlan || fromSessionPlan;

  const nextMeta: Stripe.Metadata = { ...(sub.metadata ?? {}) };
  if (supabase_user_id) nextMeta.supabase_user_id = supabase_user_id;
  if (plan_id) nextMeta.plan_id = plan_id;

  return { ...sub, metadata: nextMeta } as Stripe.Subscription;
}

/** Enregistre un paiement Checkout (idempotent par `stripe_checkout_session_id`). */
export async function upsertBillingRecordFromCheckoutSession(
  admin: SupabaseClient,
  session: Stripe.Checkout.Session,
  userId: string,
): Promise<void> {
  if (session.mode !== "subscription" || !session.id) return;
  const total = typeof session.amount_total === "number" ? session.amount_total : 0;
  if (total <= 0 || !userId) return;
  const currency = (session.currency ?? "eur").toUpperCase();
  const paidAt =
    typeof session.created === "number" ? new Date(session.created * 1000).toISOString() : new Date().toISOString();

  const { data: existing } = await admin
    .from("billing_records")
    .select("id")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle();
  if (existing) return;

  const row = {
    user_id: userId,
    amount_cents: total,
    currency: currency.length > 0 ? currency : "EUR",
    status: "paid",
    paid_at: paidAt,
    provider: "stripe",
    stripe_checkout_session_id: session.id,
  };

  const { error } = await admin.from("billing_records").insert(row);
  if (error) {
    if ((error as { code?: string }).code === "23505") return;
    throw error;
  }
}

function parsePaidPlanId(raw: string | undefined | null): Exclude<PlanId, "free"> | null {
  const v = typeof raw === "string" ? raw.trim() : "";
  if (v === "starter" || v === "pro" || v === "agency") return v;
  return null;
}

export function mapStripeSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trial";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      return "canceled";
    case "incomplete":
    case "paused":
    default:
      return "trial";
  }
}

type UpsertRow = {
  user_id: string;
  plan_id: PlanId;
  status: SubscriptionStatus;
  amount_cents: number;
  currency: string;
  current_period_end: string | null;
  stripe_subscription_id: string;
};

function rowFromStripeSubscription(sub: Stripe.Subscription, paidPlan: Exclude<PlanId, "free">): UpsertRow {
  const userId = sub.metadata?.supabase_user_id?.trim() ?? "";
  const status = mapStripeSubscriptionStatus(sub.status);
  const canceledLike = status === "canceled";
  const amount = sub.items.data[0]?.price?.unit_amount ?? 0;
  const currency = (sub.currency ?? "eur").toUpperCase();
  const periodEnd =
    typeof sub.current_period_end === "number"
      ? new Date(sub.current_period_end * 1000).toISOString()
      : null;
  return {
    user_id: userId,
    plan_id: canceledLike ? "free" : paidPlan,
    status,
    amount_cents: typeof amount === "number" ? amount : 0,
    currency: currency.length > 0 ? currency : "EUR",
    current_period_end: periodEnd,
    stripe_subscription_id: sub.id,
  };
}

/**
 * Crée ou met à jour `public.subscriptions` à partir d’un abonnement Stripe (service role).
 */
export async function upsertSubscriptionRowFromStripe(
  admin: SupabaseClient,
  sub: Stripe.Subscription,
): Promise<{ ok: true } | { ok: false; reason: "missing_metadata" | "invalid_plan" | "missing_user" }> {
  const userId = sub.metadata?.supabase_user_id?.trim() ?? "";
  const paidPlan = parsePaidPlanId(sub.metadata?.plan_id);
  if (!userId) return { ok: false, reason: "missing_user" };
  if (!paidPlan) return { ok: false, reason: "invalid_plan" };

  const row = rowFromStripeSubscription(sub, paidPlan);
  if (!row.user_id) return { ok: false, reason: "missing_user" };

  const { data: existing } = await admin
    .from("subscriptions")
    .select("id")
    .eq("stripe_subscription_id", sub.id)
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from("subscriptions")
      .update({
        plan_id: row.plan_id,
        status: row.status,
        amount_cents: row.amount_cents,
        currency: row.currency,
        current_period_end: row.current_period_end,
      })
      .eq("stripe_subscription_id", sub.id);
    if (error) throw error;
  } else {
    const { error } = await admin.from("subscriptions").insert({
      user_id: row.user_id,
      plan_id: row.plan_id,
      status: row.status,
      amount_cents: row.amount_cents,
      currency: row.currency,
      current_period_end: row.current_period_end,
      stripe_subscription_id: row.stripe_subscription_id,
    });
    if (error) throw error;
  }
  return { ok: true };
}
