/**
 * Affiche la grille de tarifs sur la landing.
 * Défaut : false (liste d'attente, prix non décidés).
 * Réactiver au lancement : NEXT_PUBLIC_SHOW_PRICING=true
 */
export function isShowPricing(): boolean {
  return process.env.NEXT_PUBLIC_SHOW_PRICING === "true";
}
