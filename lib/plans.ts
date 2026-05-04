/** Préparation billing : plan courant simulé (Free) jusqu’à intégration Stripe. */
export const FREE_TIER_MAX_CLIENTS = 3;
/** Nombre max de lignes facture / dossier en plan Free (indépendamment des e-mails déjà connus). */
export const FREE_TIER_MAX_INVOICES = 5;

export type PlanId = "free" | "starter" | "pro" | "agency";

export type MarketingPlan = {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
};

export const MARKETING_PLANS: MarketingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: "0€",
    period: "forever",
    description: "Try the workflow: a few clients, a few invoices, basic nudges.",
    features: ["Up to 3 clients", "Up to 5 invoices", "Basic email reminders"],
  },
  {
    id: "starter",
    name: "Starter",
    price: "9€",
    period: "/month",
    description: "The plan most freelancers pick once money actually moves.",
    features: [
      "Unlimited clients",
      "Full dashboard: pending, paid, avg. delay",
      "Evolution & breakdown charts (cash-in trend, paid vs pending)",
    ],
    highlighted: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "19€",
    period: "/month",
    description: "When you want sharper follow-ups without writing every email.",
    features: [
      "Automatic reminders",
      "AI-assisted reminder drafts (later)",
      "Advanced payment stats",
      "Email templates you can reuse",
    ],
  },
  {
    id: "agency",
    name: "Agency",
    price: "39€",
    period: "/month",
    description: "Several brands, several people — still one calm ledger.",
    features: [
      "Up to 2 workspaces to separate brands or business lines",
      "Multi-client / multi-brand setup",
      "Team-friendly roles",
    ],
  },
];

export type PlanCapabilities = {
  maxDistinctClients: number | null;
  maxInvoices: number | null;
  basicRemindersOnly: boolean;
  autoReminders: boolean;
  fullDashboardCharts: boolean;
  aiReminderDrafts: boolean;
  advancedStats: boolean;
  emailTemplates: boolean;
  multiWorkspace: boolean;
  teamManagement: boolean;
  advancedAutomation: boolean;
};

export function getPlanCapabilities(planId: PlanId): PlanCapabilities {
  const base: PlanCapabilities = {
    maxDistinctClients: null,
    maxInvoices: null,
    basicRemindersOnly: false,
    autoReminders: false,
    fullDashboardCharts: false,
    aiReminderDrafts: false,
    advancedStats: false,
    emailTemplates: false,
    multiWorkspace: false,
    teamManagement: false,
    advancedAutomation: false,
  };
  if (planId === "free") {
    return {
      ...base,
      maxDistinctClients: FREE_TIER_MAX_CLIENTS,
      maxInvoices: FREE_TIER_MAX_INVOICES,
      basicRemindersOnly: true,
    };
  }
  if (planId === "starter") {
    return {
      ...base,
      autoReminders: true,
      fullDashboardCharts: true,
    };
  }
  if (planId === "pro") {
    return {
      ...base,
      autoReminders: true,
      fullDashboardCharts: true,
      aiReminderDrafts: true,
      advancedStats: true,
      emailTemplates: true,
    };
  }
  return {
    ...base,
    autoReminders: true,
    fullDashboardCharts: true,
    aiReminderDrafts: true,
    advancedStats: true,
    emailTemplates: true,
    multiWorkspace: true,
    teamManagement: true,
    advancedAutomation: true,
  };
}

export function countDistinctClientEmails(clients: { email: string }[]): number {
  return new Set(clients.map((c) => c.email.trim().toLowerCase())).size;
}

/** E-mails distincts actifs + corbeille (plan Free : la corbeille garde la place jusqu’à suppression définitive). */
export function countDistinctClientEmailsForQuota(active: { email: string }[], trashed: { email: string }[]): number {
  return countDistinctClientEmails([...active, ...trashed]);
}

/** Éditeur brouillon / modèles de relance (page dédiée + nav). */
export function hasProReminderEditor(planId: PlanId): boolean {
  return planId === "pro" || planId === "agency";
}

/** Nombre max de modèles d’e-mail enregistrés (Pro / Agency). J+1,3,7,21 = 4 créneaux. */
export function getMaxEmailTemplates(planId: PlanId): number {
  if (planId === "pro") return 4;
  if (planId === "agency") return 8;
  return 15;
}

/** Bilan : plage « 3 ans » réservée au plan Agency. */
export function canViewBilanThreeYears(planId: PlanId): boolean {
  return planId === "agency";
}

/** Brouillon mailto (Bcc) : plafond d’adresses e-mail par envoi, selon le plan. */
export const BULK_MAIL_RECIPIENTS_MAX_PRO = 9;
export const BULK_MAIL_RECIPIENTS_MAX_AGENCY = 14;

/**
 * Nombre max d’adresses e-mail distinctes dans un seul `mailto` (Bcc) ou équivalent.
 * free / starter alignés sur un seul plafond raisonnable côté produit.
 */
export function getMaxBulkMailRecipients(planId: PlanId): number {
  if (planId === "agency") return BULK_MAIL_RECIPIENTS_MAX_AGENCY;
  if (planId === "pro") return BULK_MAIL_RECIPIENTS_MAX_PRO;
  if (planId === "free") return FREE_TIER_MAX_CLIENTS;
  return BULK_MAIL_RECIPIENTS_MAX_PRO;
}

/** Nombre max de portefeuilles (workspaces) : 2 en Agency, 1 sinon. */
export const AGENCY_MAX_WORKSPACES = 2;

export function getMaxWorkspaces(planId: PlanId): number {
  return planId === "agency" ? AGENCY_MAX_WORKSPACES : 1;
}

export function usesAgencyWorkspaceUi(planId: PlanId): boolean {
  return planId === "agency";
}
