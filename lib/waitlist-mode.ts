/**
 * Mode liste d'attente : produit fermé (landing + collecte d'emails).
 * Prod : NEXT_PUBLIC_WAITLIST_MODE=true
 * Local : absente ou false
 */
export function isWaitlistMode(): boolean {
  return process.env.NEXT_PUBLIC_WAITLIST_MODE === "true";
}
