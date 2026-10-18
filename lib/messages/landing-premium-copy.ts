import type { AppLocale } from "@/lib/app-locale";
import { pickQuad } from "@/lib/messages/pick";

/**
 * Copy landing premium (hero + 3 features + CTA final).
 *
 * TODO(relances-auto-plan): vérité produit actuelle = relances auto dès Starter
 * (`getPlanCapabilities` / lib/plans.ts). Si tu tranches « dès Pro », mets à jour
 * FAQ + features + cette note, et n’utilise jamais « automatique » pour le Free.
 */
export function getLandingPremiumCopy(locale: AppLocale) {
  return {
    badge: pickQuad(locale, {
      fr: "Pour freelances et petites agences",
      en: "For freelancers and small agencies",
      nl: "Voor freelancers en kleine agencies",
      es: "Para freelancers y pequeñas agencias",
    }),
    titleLine1: pickQuad(locale, {
      fr: "Sachez qui vous doit quoi,",
      en: "Know who owes you what,",
      nl: "Weet wie u wat verschuldigd is,",
      es: "Sabe quién te debe qué,",
    }),
    titleAccent: pickQuad(locale, {
      fr: "et relancez en deux clics.",
      en: "and follow up in two clicks.",
      nl: "en herinner in twee klikken.",
      es: "y reclama en dos clics.",
    }),
    subtitle: pickQuad(locale, {
      fr: "Une liste claire de vos impayés, des relances prêtes à envoyer, sans tableur éparpillé.",
      en: "A clear list of unpaid invoices and follow-ups ready to send. No scattered spreadsheets.",
      nl: "Een duidelijke lijst van openstaande facturen en herinneringen klaar om te versturen.",
      es: "Una lista clara de impagos y recordatorios listos para enviar. Sin hojas dispersas.",
    }),
    ctaPrimary: pickQuad(locale, {
      fr: "Commencer gratuitement",
      en: "Start for free",
      nl: "Gratis starten",
      es: "Empezar gratis",
    }),
    ctaSecondary: pickQuad(locale, {
      fr: "Comment ça marche",
      en: "How it works",
      nl: "Hoe het werkt",
      es: "Cómo funciona",
    }),
    trust1: pickQuad(locale, {
      fr: "Sans carte bancaire",
      en: "No credit card",
      nl: "Geen creditcard",
      es: "Sin tarjeta",
    }),
    trust2: pickQuad(locale, {
      fr: "Prêt en quelques minutes",
      en: "Ready in minutes",
      nl: "Klaar in enkele minuten",
      es: "Listo en minutos",
    }),
    trust3: pickQuad(locale, {
      fr: "Pensé pour les freelances",
      en: "Made for freelancers",
      nl: "Gemaakt voor freelancers",
      es: "Pensado para autónomos",
    }),
    trustLine: pickQuad(locale, {
      fr: "La vue réelle du plan Gratuit : totaux et liste, sans graphiques avancés.",
      en: "The real Free plan view: totals and list, without advanced charts.",
      nl: "De echte Gratis-weergave: totalen en lijst, zonder geavanceerde grafieken.",
      es: "La vista real del plan Gratis: totales y lista, sin gráficos avanzados.",
    }),
    feature1Title: pickQuad(locale, {
      fr: "Voyez tout ce qu'on vous doit",
      en: "See everything you're owed",
      nl: "Zie alles wat u nog tegoed heeft",
      es: "Ve todo lo que te deben",
    }),
    feature1Body: pickQuad(locale, {
      fr: "Clients, montants et retards sur une seule liste. Fini de chercher dans les mails.",
      en: "Clients, amounts and late invoices in one list. No more digging through email.",
      nl: "Klanten, bedragen en vertragingen in één lijst. Geen mailzoektocht meer.",
      es: "Clientes, importes y retrasos en una sola lista. Sin buscar en el correo.",
    }),
    feature2Title: pickQuad(locale, {
      fr: "Relancez sans perdre une heure",
      en: "Follow up without losing an hour",
      nl: "Herinner zonder een uur te verliezen",
      es: "Reclama sin perder una hora",
    }),
    feature2Body: pickQuad(locale, {
      // TODO(relances-auto-plan): Free = prévisualisation + messagerie. Auto dès Starter.
      fr: "Un message prêt à relire, envoyé depuis votre messagerie. Les relances planifiées arrivent dès Starter.",
      en: "A message ready to review, sent from your mailbox. Scheduled reminders from Starter.",
      nl: "Een bericht klaar om te herlezen, via uw mailbox. Geplande herinneringen vanaf Starter.",
      es: "Un mensaje listo para revisar, desde tu correo. Recordatorios programados desde Starter.",
    }),
    feature3Title: pickQuad(locale, {
      fr: "Sachez ce qui rentre ce mois-ci",
      en: "Know what comes in this month",
      nl: "Weet wat er deze maand binnenkomt",
      es: "Sabe qué entra este mes",
    }),
    feature3Body: pickQuad(locale, {
      fr: "Totaux à récupérer et dossiers prioritaires sous les yeux. Pas de tableau Excel à reconstruire.",
      en: "Amounts to collect and priority files at a glance. No spreadsheet to rebuild.",
      nl: "Te innen bedragen en prioriteiten in één oogopslag. Geen spreadsheet meer.",
      es: "Importes a cobrar y prioridades a la vista. Sin reconstruir una hoja de cálculo.",
    }),
    finalTitle: pickQuad(locale, {
      fr: "Arrêtez de courir après vos factures.",
      en: "Stop chasing your invoices.",
      nl: "Stop met achter uw facturen aan te rennen.",
      es: "Deja de perseguir tus facturas.",
    }),
  };
}
