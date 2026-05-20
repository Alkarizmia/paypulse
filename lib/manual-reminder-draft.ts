import type { Client } from "@/app/dashboard/types";
import type { AppLocale } from "@/lib/app-locale";
import { getMaxEmailTemplates, type PlanId } from "@/lib/plans";
import { loadReminderTemplates } from "@/lib/reminder-templates-storage";

export function buildManualReminderDraftFields(
  client: Client,
  options: {
    locale: AppLocale;
    aiReminderDrafts: boolean;
    currentPlanId: PlanId;
    templateWorkspaceKey: string;
    /** Montant formaté selon la devise d’affichage (montant stocké en EUR). */
    formatAmount: (amountEur: number) => string;
  },
): { subject: string; body: string } {
  const { locale, aiReminderDrafts, currentPlanId, templateWorkspaceKey, formatAmount } = options;
  const amountLabel = formatAmount(client.amountDue);
  if (aiReminderDrafts) {
    const st = loadReminderTemplates(locale, getMaxEmailTemplates(currentPlanId), templateWorkspaceKey);
    return { subject: st.draftSubject, body: st.draftBody };
  }
  if (locale === "fr") {
    return {
      subject: `Rappel : facture en attente, ${client.name}`,
      body: [
        `Bonjour,`,
        ``,
        `Nous vous contactons concernant un montant de ${amountLabel} dû pour le ${client.dueDate}.`,
        `Merci de régulariser la situation ou de nous indiquer un délai.`,
        ``,
        `Cordialement,`,
        `PayPulss`,
      ].join("\n"),
    };
  }
  if (locale === "nl") {
    return {
      subject: `Herinnering: openstaande factuur, ${client.name}`,
      body: [
        `Beste,`,
        ``,
        `We nemen contact op over een openstaand bedrag van ${amountLabel} met vervaldatum ${client.dueDate}.`,
        `Gelieve te betalen of een termijn voor te stellen.`,
        ``,
        `Met vriendelijke groet,`,
        `PayPulss`,
      ].join("\n"),
    };
  }
  if (locale === "es") {
    return {
      subject: `Recordatorio: factura pendiente, ${client.name}`,
      body: [
        `Hola,`,
        ``,
        `Te escribimos por un importe pendiente de ${amountLabel} con vencimiento el ${client.dueDate}.`,
        `Por favor, regulariza el pago o indícanos un plazo.`,
        ``,
        `Saludos,`,
        `PayPulss`,
      ].join("\n"),
    };
  }
  return {
    subject: `Reminder: pending invoice, ${client.name}`,
    body: [
      `Hello,`,
      ``,
      `We're reaching out about an amount of ${amountLabel} due on ${client.dueDate}.`,
      `Please settle when you can or let us know a timeline.`,
      ``,
      `Regards,`,
      `PayPulss`,
    ].join("\n"),
  };
}
