/** Préparation billing : plan courant simulé (Free) jusqu’à intégration Stripe. */
export const FREE_TIER_MAX_CLIENTS = 3;
/** Nombre max de lignes facture / dossier en plan Free (indépendamment des e-mails déjà connus). */
export const FREE_TIER_MAX_INVOICES = 5;

export type PlanId = "free" | "starter" | "pro" | "agency";

/** 0 = gratuit ; sert à bloquer checkout / plan gratuit vers un niveau inférieur à l’entitlement réel. */
export function paidPlanTier(planId: PlanId): number {
  if (planId === "free") return 0;
  if (planId === "starter") return 1;
  if (planId === "pro") return 2;
  if (planId === "agency") return 3;
  return 0;
}

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
      "Automatic reminders + 1 custom email template (no payment link)",
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
      "Up to 2 workspaces to separate brands or activities",
    ],
  },
  {
    id: "agency",
    name: "Agency",
    price: "39€",
    period: "/month",
    description: "Several brands, several people, still one calm ledger.",
    features: [
      "Up to 3 workspaces to separate brands or business lines",
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
      multiWorkspace: true,
      teamManagement: true,
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

/**
 * Accès à l’éditeur de modèles de relance (page dédiée + nav).
 * Starter : éditeur limité (1 modèle, sans lien). Pro / Agency : éditeur complet.
 * Free : pas d’accès.
 */
export function hasReminderTemplatesEditor(planId: PlanId): boolean {
  return planId === "starter" || planId === "pro" || planId === "agency";
}

/** Alias rétro-compatible (ancien nom). À retirer une fois les call-sites migrés. */
export function hasProReminderEditor(planId: PlanId): boolean {
  return hasReminderTemplatesEditor(planId);
}

/** Accès à l’éditeur "complet" : IA + brouillon + envoi du brouillon. Pro / Agency. */
export function hasFullReminderEditor(planId: PlanId): boolean {
  return planId === "pro" || planId === "agency";
}

/** Lien de paiement dans les modèles d’e-mails : Pro / Agency uniquement. */
export function canUseTemplatePaymentLink(planId: PlanId): boolean {
  return planId === "pro" || planId === "agency";
}

/**
 * Starter : pas de multipart HTML pour les relances automatiques — limites les boutons bleus et liens
 * cliquables générés par le corps HTML ; une URL mise dans le texte peut toujours être copiée-collée par le destinataire.
 * Pro et Agence : HTML classique (+ lien de paiement optionnel).
 */
export function autoReminderSendHtmlAllowed(planId: PlanId): boolean {
  return planId !== "starter";
}

/** Défaut à l’inscription si aucune règle encore en base. */
export const REMINDER_JOBS_PER_RUN_DEFAULT = 50;

/**
 * Maximum autorisé pour « plafond d’envois par passage » selon le plan (Starter 60 · Pro 85 · Agency 100).
 * Valeur utilisateur défaut : {@link REMINDER_JOBS_PER_RUN_DEFAULT}.
 */
export function getMaxReminderJobsPerRun(planId: PlanId): number {
  if (planId === "agency") return 100;
  if (planId === "pro") return 85;
  /* starter + free fallback */
  return 60;
}

/** Pièce jointe par modèle de relance (PDF / image). Starter 1 Mo, Pro 10 Mo, Agency 50 Mo. */
export function getReminderAttachmentMaxBytes(planId: PlanId): number {
  if (planId === "agency") return 50 * 1024 * 1024;
  if (planId === "pro") return 10 * 1024 * 1024;
  if (planId === "starter") return 1024 * 1024;
  return 0;
}

/** Nombre max de modèles d’e-mail enregistrés. Starter : 1, Pro : 4, Agency : 8. */
export function getMaxEmailTemplates(planId: PlanId): number {
  if (planId === "starter") return 1;
  if (planId === "pro") return 4;
  if (planId === "agency") return 8;
  return 0;
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

/** Nombre max de portefeuilles (workspaces) par plan. */
export const PRO_MAX_WORKSPACES = 2;
export const AGENCY_MAX_WORKSPACES = 3;

export function getMaxWorkspaces(planId: PlanId): number {
  if (planId === "agency") return AGENCY_MAX_WORKSPACES;
  if (planId === "pro") return PRO_MAX_WORKSPACES;
  return 1;
}

/** Plusieurs portefeuilles (sélecteur dashboard, formulaire client). */
export function usesAgencyWorkspaceUi(planId: PlanId): boolean {
  return getMaxWorkspaces(planId) > 1;
}

/** Pro : 1 collaborateur ; Agency : 2. Free / Starter : pas d’accès page Équipe. */
export const PRO_MAX_TEAM_MEMBERS = 1;
export const AGENCY_MAX_TEAM_MEMBERS = 2;

export function canAccessTeamPage(planId: PlanId): boolean {
  return planId === "pro" || planId === "agency";
}

export function getMaxTeamMembers(planId: PlanId): number {
  if (planId === "agency") return AGENCY_MAX_TEAM_MEMBERS;
  if (planId === "pro") return PRO_MAX_TEAM_MEMBERS;
  return 0;
}
