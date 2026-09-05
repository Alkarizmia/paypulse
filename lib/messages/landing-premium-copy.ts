import type { AppLocale } from "@/lib/app-locale";
import { pickQuad } from "@/lib/messages/pick";

export function getLandingPremiumCopy(locale: AppLocale) {
  return {
    badge: pickQuad(locale, {
      fr: "Conçu pour les freelances",
      en: "Built for freelancers",
      nl: "Gemaakt voor freelancers",
      es: "Hecho para autonomos",
    }),
    titleLine1: pickQuad(locale, {
      fr: "Votre travail mérite",
      en: "Your work deserves",
      nl: "Uw werk verdient",
      es: "Tu trabajo merece",
    }),
    titleAccent: pickQuad(locale, {
      fr: "d’être payé à temps.",
      en: "to be paid on time.",
      nl: "om op tijd betaald te worden.",
      es: "cobrarse a tiempo.",
    }),
    subtitle: pickQuad(locale, {
      fr: "Suivez vos paiements, automatisez vos relances et gardez une vision claire de votre activité. Sans tableurs dispersés.",
      en: "Track payments, automate follow-ups, and keep a clear view of your activity. No scattered spreadsheets.",
      nl: "Volg betalingen, automatiseer herinneringen en houd uw activiteit overzichtelijk. Zonder verspreide spreadsheets.",
      es: "Sigue tus pagos, automatiza los recordatorios y ten una visión clara de tu actividad. Sin hojas de cálculo dispersas.",
    }),
    ctaPrimary: pickQuad(locale, {
      fr: "Commencer gratuitement",
      en: "Start for free",
      nl: "Gratis starten",
      es: "Empezar gratis",
    }),
    ctaSecondary: pickQuad(locale, {
      fr: "Voir comment ça marche",
      en: "See how it works",
      nl: "Bekijk hoe het werkt",
      es: "Ver cómo funciona",
    }),
    trust1: pickQuad(locale, {
      fr: "Sans carte bancaire",
      en: "No credit card",
      nl: "Geen creditcard",
      es: "Sin tarjeta",
    }),
    trust2: pickQuad(locale, {
      fr: "Configuration rapide",
      en: "Quick setup",
      nl: "Snelle setup",
      es: "Configuracion rapida",
    }),
    trust3: pickQuad(locale, {
      fr: "Pensé pour les freelances",
      en: "Made for freelancers",
      nl: "Gemaakt voor freelancers",
      es: "Pensado para autónomos",
    }),
    trustLine: pickQuad(locale, {
      fr: "Pensé pour simplifier la gestion quotidienne des freelances",
      en: "Designed to simplify a freelancer's daily admin",
      nl: "Ontworpen om het dagelijkse beheer van freelancers te vereenvoudigen",
      es: "Pensado para simplificar la gestión diaria de los autónomos",
    }),
    feature1Title: pickQuad(locale, {
      fr: "Ne laissez plus aucun paiement vous échapper",
      en: "Never miss another payment",
      nl: "Mis geen enkele betaling meer",
      es: "No dejes escapar ningún pago",
    }),
    feature1Body: pickQuad(locale, {
      fr: "Suivez les factures et paiements en attente dans une seule liste lisible.",
      en: "Track outstanding invoices and payments in one clear list.",
      nl: "Volg openstaande facturen en betalingen in een duidelijke lijst.",
      es: "Sigue facturas y pagos pendientes en una sola lista clara.",
    }),
    feature2Title: pickQuad(locale, {
      fr: "Relancez sans y penser",
      en: "Follow up without thinking about it",
      nl: "Herinner zonder eraan te denken",
      es: "Reclama sin pensarlo",
    }),
    feature2Body: pickQuad(locale, {
      fr: "Automatisez les rappels auprès de vos clients, au bon rythme, avec une image pro.",
      en: "Automate client reminders at the right pace, while staying professional.",
      nl: "Automatiseer herinneringen op het juiste ritme, professioneel.",
      es: "Automatiza los recordatorios a tus clientes, con el ritmo adecuado.",
    }),
    feature3Title: pickQuad(locale, {
      fr: "Gardez le contrôle",
      en: "Stay in control",
      nl: "Blijf in control",
      es: "Mantén el control",
    }),
    feature3Body: pickQuad(locale, {
      fr: "Visualisez clairement votre activité et vos revenus, sans tableau éparpillé.",
      en: "See your activity and income clearly, without a scattered spreadsheet.",
      nl: "Zie uw activiteit en inkomsten helder, zonder verspreide tabellen.",
      es: "Visualiza tu actividad e ingresos con claridad, sin hojas dispersas.",
    }),
    finalTitle: pickQuad(locale, {
      fr: "Reprenez le fil de vos paiements.",
      en: "Get back on top of your payments.",
      nl: "Krijg weer grip op uw betalingen.",
      es: "Retoma el control de tus pagos.",
    }),
  };
}
