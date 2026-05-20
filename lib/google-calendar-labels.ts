import type { AppLocale } from "@/lib/app-locale";
import { getOrganizationCopy } from "@/lib/messages/organization-copy";
import type { BuildCalendarLabels } from "@/lib/organization-calendar";

export function buildCalendarLabelsForLocale(locale: AppLocale): BuildCalendarLabels {
  const copy = getOrganizationCopy(locale);
  return {
    due: copy.dueLabel,
    payment: copy.paymentLabel,
    reminderSent: copy.reminderSentLabel,
    reminderPlanned: copy.reminderPlannedLabel,
  };
}
