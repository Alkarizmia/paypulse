/**
 * Tons prédéfinis pour le brouillon de relance (IA + secours sans API).
 * Le corps du mail ne doit jamais reprendre d’étiquette de ton — seulement le style appliqué.
 */
export type ReminderDraftTone = "neutral" | "gentle" | "firm" | "urgent";

const TONE_SET = new Set<ReminderDraftTone>(["neutral", "gentle", "firm", "urgent"]);

export function parseReminderDraftTone(value: unknown): ReminderDraftTone {
  if (typeof value === "string" && TONE_SET.has(value as ReminderDraftTone)) {
    return value as ReminderDraftTone;
  }
  return "neutral";
}

export const REMINDER_DRAFT_TONE_IDS: readonly ReminderDraftTone[] = ["neutral", "gentle", "firm", "urgent"] as const;
