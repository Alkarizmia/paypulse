/**
 * Hardcoded English copy for the public landing dashboard mock.
 * Does not use app i18n / locale cookie / language switcher.
 *
 * Demo amounts use fixed USD for marketing. Later this should follow
 * the pricing/currency system (visitor currency + pricing-config).
 */

export const LANDING_DEMO_COPY = {
  windowTitle: "PayPulss · Home",
  toCollect: "TO COLLECT",
  openInvoicesOne: "1 open invoice",
  openInvoicesMany: (n: number) => `${n} open invoices`,
  daysLate: "12 days late",
  reminderSent: "Reminder sent",
  paidToday: "Paid today",
  statusPending: "Pending",
  statusFollowedUp: "Followed up",
  statusPaid: "Paid",
  themeToLight: "Switch mock to light mode",
  themeToDark: "Switch mock to dark mode",
  /** Pulse / timeline labels (uppercase). */
  timelinePending: "PENDING",
  timelineFollowedUp: "FOLLOWED UP",
  timelinePaid: "PAID",
} as const;

export function formatLandingDemoUsd(amount: number): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${Math.round(amount)}`;
  }
}
