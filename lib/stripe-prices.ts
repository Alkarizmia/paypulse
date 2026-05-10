import type { PlanId } from "@/lib/plans";

export type StripeBillingCycle = "monthly" | "annual";

const PRICE_ENV_KEYS: Record<Exclude<PlanId, "free">, Record<StripeBillingCycle, string>> = {
  starter: {
    monthly: "STRIPE_PRICE_STARTER_MONTHLY",
    annual: "STRIPE_PRICE_STARTER_ANNUAL",
  },
  pro: {
    monthly: "STRIPE_PRICE_PRO_MONTHLY",
    annual: "STRIPE_PRICE_PRO_ANNUAL",
  },
  agency: {
    monthly: "STRIPE_PRICE_AGENCY_MONTHLY",
    annual: "STRIPE_PRICE_AGENCY_ANNUAL",
  },
};

function trimEnv(name: string): string {
  return typeof process.env[name] === "string" ? process.env[name]!.trim() : "";
}

/** Price ID Stripe (`price_…`) pour un plan payant et un cycle de facturation. */
export function getStripePriceId(planId: Exclude<PlanId, "free">, billing: StripeBillingCycle): string | null {
  const key = PRICE_ENV_KEYS[planId][billing];
  const v = trimEnv(key);
  return v.length > 0 ? v : null;
}

/** True si les 6 variables `STRIPE_PRICE_*` sont renseignées (Checkout prêt). */
export function isStripeCheckoutFullyConfigured(): boolean {
  for (const planId of ["starter", "pro", "agency"] as const) {
    for (const billing of ["monthly", "annual"] as const) {
      if (!getStripePriceId(planId, billing)) return false;
    }
  }
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}
