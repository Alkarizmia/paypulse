import type { AppLocale } from "@/lib/app-locale";
import { pickQuad } from "@/lib/messages/pick";

export function getLandingLossCopy(locale: AppLocale) {
  return {
    title: pickQuad(locale, {
      fr: "Combien d'argent traîne chez tes clients ?",
      en: "How much money is stuck with your clients?",
      nl: "Hoeveel geld blijft bij je klanten hangen?",
      es: "¿Cuánto dinero se queda en tus clientes?",
    }),
    subtitle: pickQuad(locale, {
      fr: "Bouge les curseurs. Pas besoin d'écrire.",
      en: "Move the sliders. No typing needed.",
      nl: "Beweeg de schuifregelaars. Geen typen nodig.",
      es: "Mueve los cursores. Sin escribir.",
    }),
    invoicesLabel: pickQuad(locale, {
      fr: "Factures en retard",
      en: "Overdue invoices",
      nl: "Achterstallige facturen",
      es: "Facturas atrasadas",
    }),
    amountLabel: pickQuad(locale, {
      fr: "Montant moyen par facture",
      en: "Average amount per invoice",
      nl: "Gemiddeld bedrag per factuur",
      es: "Importe medio por factura",
    }),
    minutesLabel: pickQuad(locale, {
      fr: "Temps pour relancer UNE facture",
      en: "Time to chase ONE invoice",
      nl: "Tijd om ÉÉN factuur op te volgen",
      es: "Tiempo para reclamar UNA factura",
    }),
    assumption: pickQuad(locale, {
      fr: "Estimation : 3 relances par facture",
      en: "Estimate: 3 follow-ups per invoice",
      nl: "Schatting: 3 herinneringen per factuur",
      es: "Estimación: 3 recordatorios por factura",
    }),
    blockedSuffix: pickQuad(locale, {
      fr: "bloqués chez tes clients",
      en: "stuck with your clients",
      nl: "blijft bij je klanten",
      es: "bloqueados en tus clientes",
    }),
    timePrefix: pickQuad(locale, {
      fr: "≈",
      en: "≈",
      nl: "≈",
      es: "≈",
    }),
    timeSuffix: pickQuad(locale, {
      fr: "par mois passées à relancer",
      en: "per month spent chasing",
      nl: "per maand kwijt aan opvolgen",
      es: "al mes dedicados a reclamar",
    }),
    disclaimer: pickQuad(locale, {
      fr: "Estimation basée sur tes réponses, pas sur des statistiques.",
      en: "Estimate based on your answers, not on statistics.",
      nl: "Schatting op basis van jouw antwoorden, geen statistieken.",
      es: "Estimación según tus respuestas, no estadísticas.",
    }),
    seeDifference: pickQuad(locale, {
      fr: "Voir la différence",
      en: "See the difference",
      nl: "Zie het verschil",
      es: "Ver la diferencia",
    }),
    finalMessage: pickQuad(locale, {
      fr: "Avec PayPulss, tu vois tout et tu relances en deux clics.",
      en: "With PayPulss, you see everything and follow up in two clicks.",
      nl: "Met PayPulss zie je alles en herinner je in twee klikken.",
      es: "Con PayPulss lo ves todo y reclamas en dos clics.",
    }),
    statusWait: pickQuad(locale, {
      fr: "En attente",
      en: "Pending",
      nl: "In afwachting",
      es: "Pendiente",
    }),
    statusRemind: pickQuad(locale, {
      fr: "Relancé",
      en: "Followed up",
      nl: "Herinnerd",
      es: "Reclamado",
    }),
    statusPaid: pickQuad(locale, {
      fr: "Payé",
      en: "Paid",
      nl: "Betaald",
      es: "Pagado",
    }),
    invoiceName: (n: number) =>
      pickQuad(locale, {
        fr: `Facture ${n}`,
        en: `Invoice ${n}`,
        nl: `Factuur ${n}`,
        es: `Factura ${n}`,
      }),
    hoursShort: pickQuad(locale, {
      fr: "h",
      en: "h",
      nl: "u",
      es: "h",
    }),
    minutesShort: pickQuad(locale, {
      fr: "min",
      en: "min",
      nl: "min",
      es: "min",
    }),
  };
}

export function getLandingMockHint(locale: AppLocale) {
  return pickQuad(locale, {
    fr: "Touche un dossier",
    en: "Tap a file",
    nl: "Tik op een dossier",
    es: "Toca un dossier",
  });
}
