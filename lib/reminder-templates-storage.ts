/** Brouillon + modèles de relance — stockage navigateur (en attendant profil Supabase). */

import type { AppLocale } from "@/lib/app-locale";

export const SCHEDULE_DAY_OPTIONS = [1, 3, 7, 21] as const;
export type ScheduleDays = (typeof SCHEDULE_DAY_OPTIONS)[number];

/** Cible de statut pour la relance auto (quand la planification par modèle existera) et pour choisir le modèle sur le tableau de bord. */
export const REMINDER_STATUS_SCOPES = ["unpaid", "paid", "both"] as const;
export type ReminderStatusScope = (typeof REMINDER_STATUS_SCOPES)[number];

export type ReminderTemplateEntry = {
  id: string;
  title: string;
  body: string;
  daysAfterDue: ScheduleDays;
  /** factures impayées, payées, ou les deux */
  statusScope: ReminderStatusScope;
};

export function clientMatchesReminderScope(
  clientStatus: "paid" | "unpaid",
  scope: ReminderStatusScope,
): boolean {
  if (scope === "both") return true;
  if (scope === "unpaid") return clientStatus === "unpaid";
  return clientStatus === "paid";
}

/** Premier modèle dont le périmètre de statut correspond au client (ordre des modèles). */
export function pickFirstMatchingReminderTemplate(
  templates: ReminderTemplateEntry[],
  clientStatus: "paid" | "unpaid",
): ReminderTemplateEntry | null {
  return templates.find((t) => clientMatchesReminderScope(clientStatus, t.statusScope)) ?? null;
}

export type ReminderTemplatesData = {
  draftSubject: string;
  draftBody: string;
  templates: ReminderTemplateEntry[];
};

const STORAGE_PREFIX = "paypulse-reminder-templates-v1";

export function getReminderTemplatesStorageKey(workspaceId: string): string {
  return `${STORAGE_PREFIX}-${workspaceId}`;
}

function newTemplateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function coerceScheduleDays(v: unknown, fallback: ScheduleDays): ScheduleDays {
  const n = typeof v === "string" ? Number.parseInt(v, 10) : v;
  if (n === 1 || n === 3 || n === 7 || n === 21) return n;
  return fallback;
}

function coerceStatusScope(v: unknown, fallback: ReminderStatusScope): ReminderStatusScope {
  if (v === "unpaid" || v === "paid" || v === "both") return v;
  return fallback;
}

/** Modèle vide pour le bouton « + ». */
export function createEmptyTemplate(
  locale: AppLocale,
  daysAfterDue: ScheduleDays = 7,
  statusScope: ReminderStatusScope = "unpaid",
): ReminderTemplateEntry {
  return {
    id: newTemplateId(),
    title: locale === "fr" ? "Nouveau modèle" : "New template",
    body:
      locale === "fr"
        ? "Bonjour,\n\nMerci de votre attention.\n\nCordialement,"
        : "Hi,\n\nThanks for your attention.\n\nRegards,",
    daysAfterDue,
    statusScope,
  };
}

function defaultsFr(): ReminderTemplatesData {
  return {
    draftSubject: "Objet : suite à notre échange — facture en attente",
    draftBody:
      "Bonjour,\nPetit rappel amical : nous restons à votre disposition pour finaliser le règlement.",
    templates: [
      {
        id: newTemplateId(),
        title: "Relance douce J+7",
        body: "Bonjour,\nNous nous permettons un petit rappel concernant notre facture. N’hésitez pas à nous indiquer si vous avez besoin d’informations complémentaires.\nCordialement,",
        daysAfterDue: 7,
        statusScope: "unpaid",
      },
      {
        id: newTemplateId(),
        title: "Relance ferme J+21",
        body: "Bonjour,\nMalgré nos précédents messages, nous n’avons pas encore reçu de règlement. Merci de régulariser sous 8 jours ou de nous contacter pour convenir d’un échéancier.\nCordialement,",
        daysAfterDue: 21,
        statusScope: "unpaid",
      },
      {
        id: newTemplateId(),
        title: "Mise en demeure courte",
        body: "Madame, Monsieur,\nSans règlement sous 15 jours à compter de ce message, nous serons contraints d’engager les poursuites nécessaires au recouvrement de notre créance, sans autre avis.\nCordialement,",
        daysAfterDue: 21,
        statusScope: "unpaid",
      },
    ],
  };
}

function defaultsEn(): ReminderTemplatesData {
  return {
    draftSubject: "Subject: Following up on our invoice",
    draftBody:
      "Hi,\nFriendly nudge — happy to help wrap up payment whenever works for you.",
    templates: [
      {
        id: newTemplateId(),
        title: "Soft nudge D+7",
        body: "Hi,\nJust a gentle reminder about our invoice. Let us know if you need anything from our side.\nThanks,",
        daysAfterDue: 7,
        statusScope: "unpaid",
      },
      {
        id: newTemplateId(),
        title: "Firm follow-up D+21",
        body: "Hi,\nWe still haven’t received payment. Please settle within 8 days or reach out to agree on a timeline.\nThanks,",
        daysAfterDue: 21,
        statusScope: "unpaid",
      },
      {
        id: newTemplateId(),
        title: "Short formal notice",
        body: "Dear Sir/Madam,\nUnless payment is received within 15 days of this message, we will pursue all appropriate remedies to recover the outstanding amount.\nRegards,",
        daysAfterDue: 21,
        statusScope: "unpaid",
      },
    ],
  };
}

export function getDefaultReminderTemplates(locale: AppLocale): ReminderTemplatesData {
  return locale === "fr" ? defaultsFr() : defaultsEn();
}

/** Ancien format (tuple de 3 entrées sans id ni daysAfterDue). */
function isLegacyTemplateEntry(x: unknown): x is { title: string; body: string } {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return typeof o.title === "string" && typeof o.body === "string" && !("daysAfterDue" in o) && !("id" in o);
}

function migrateTemplateRow(raw: unknown, index: number, fallback: ReminderTemplateEntry): ReminderTemplateEntry {
  if (typeof raw !== "object" || raw === null) {
    return { ...fallback, id: newTemplateId() };
  }
  const o = raw as Record<string, unknown>;
  const title = typeof o.title === "string" ? o.title : fallback.title;
  const body = typeof o.body === "string" ? o.body : fallback.body;

  let daysAfterDue: ScheduleDays = fallback.daysAfterDue;
  if (isLegacyTemplateEntry(raw)) {
    daysAfterDue = index === 0 ? 7 : index === 1 ? 21 : 21;
  } else {
    daysAfterDue = coerceScheduleDays(o.daysAfterDue, fallback.daysAfterDue);
  }

  const id = typeof o.id === "string" && o.id.length > 0 ? o.id : newTemplateId();
  const statusScope = coerceStatusScope(o.statusScope, fallback.statusScope);
  return { id, title, body, daysAfterDue, statusScope };
}

function migrateTemplatesArray(tpl: unknown, base: ReminderTemplatesData, locale: AppLocale): ReminderTemplateEntry[] {
  if (!Array.isArray(tpl) || tpl.length === 0) {
    return base.templates;
  }

  const fallbacks = base.templates;
  return tpl.map((row, index) =>
    migrateTemplateRow(row, index, fallbacks[Math.min(index, fallbacks.length - 1)] ?? createEmptyTemplate(locale)),
  );
}

/**
 * @param maxTemplates borne supérieure du nombre de modèles (ex. 4 Pro, 5 Agency). Défaut 15 = compat anciennes données.
 */
export function loadReminderTemplates(
  locale: AppLocale,
  maxTemplates = 15,
  workspaceId = "default",
): ReminderTemplatesData {
  const storageKey = getReminderTemplatesStorageKey(workspaceId);
  const base = getDefaultReminderTemplates(locale);
  const cap = Math.max(1, maxTemplates);
  if (typeof window === "undefined") {
    return {
      ...base,
      templates: base.templates.slice(0, cap),
    };
  }
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return {
        ...base,
        templates: base.templates.slice(0, cap),
      };
    }
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) {
      return { ...base, templates: base.templates.slice(0, cap) };
    }
    const o = parsed as Record<string, unknown>;
    const draftSubject = typeof o.draftSubject === "string" ? o.draftSubject : base.draftSubject;
    const draftBody = typeof o.draftBody === "string" ? o.draftBody : base.draftBody;
    let templates = migrateTemplatesArray(o.templates, base, locale);
    if (templates.length === 0) {
      templates = base.templates;
    }
    if (templates.length > cap) {
      templates = templates.slice(0, cap);
    }
    return { draftSubject, draftBody, templates };
  } catch {
    return { ...base, templates: base.templates.slice(0, cap) };
  }
}

export function saveReminderTemplates(data: ReminderTemplatesData, workspaceId = "default"): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getReminderTemplatesStorageKey(workspaceId), JSON.stringify(data));
  } catch {
    /* quota / private mode */
  }
}

export function clearReminderTemplates(workspaceId = "default"): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(getReminderTemplatesStorageKey(workspaceId));
  } catch {
    /* ignore */
  }
}
