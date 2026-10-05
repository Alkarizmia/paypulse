import type { AppLocale } from "@/lib/app-locale";
import { pickQuad } from "@/lib/messages/pick";

export function getWaitlistCopy(locale: AppLocale) {
  return {
    cta: pickQuad(locale, {
      fr: "Rejoindre la liste d'attente",
      en: "Join the waitlist",
      nl: "Schrijf je in op de wachtlijst",
      es: "Unirse a la lista de espera",
    }),
    modalTitle: pickQuad(locale, {
      fr: "Soyez prévenu au lancement",
      en: "Get notified at launch",
      nl: "Word op de hoogte gebracht bij de lancering",
      es: "Recibe un aviso en el lanzamiento",
    }),
    modalSub: pickQuad(locale, {
      fr: "PayPulss arrive bientôt. Laissez votre email, on vous prévient dès que c'est ouvert.",
      en: "PayPulss is coming soon. Leave your email and we'll notify you when it opens.",
      nl: "PayPulss komt eraan. Laat je e-mail achter, we verwittigen je zodra het open is.",
      es: "PayPulss llega pronto. Deja tu email y te avisamos cuando abra.",
    }),
    emailLabel: pickQuad(locale, {
      fr: "Adresse email",
      en: "Email address",
      nl: "E-mailadres",
      es: "Correo electrónico",
    }),
    emailPlaceholder: pickQuad(locale, {
      fr: "vous@exemple.com",
      en: "you@example.com",
      nl: "jij@voorbeeld.com",
      es: "tu@ejemplo.com",
    }),
    submit: pickQuad(locale, {
      fr: "Me prévenir",
      en: "Notify me",
      nl: "Houd me op de hoogte",
      es: "Avisarme",
    }),
    submitting: pickQuad(locale, {
      fr: "Envoi…",
      en: "Sending…",
      nl: "Verzenden…",
      es: "Enviando…",
    }),
    hint: pickQuad(locale, {
      fr: "Un seul email au lancement. Pas de spam.",
      en: "One email at launch. No spam.",
      nl: "Eén e-mail bij de lancering. Geen spam.",
      es: "Un solo email en el lanzamiento. Sin spam.",
    }),
    consent: pickQuad(locale, {
      fr: "Votre email sert uniquement à vous prévenir du lancement (via Resend, stocké dans notre base).",
      en: "Your email is only used to notify you at launch (via Resend, stored in our database).",
      nl: "Je e-mail gebruiken we alleen om je te verwittigen bij de lancering (via Resend, opgeslagen in onze database).",
      es: "Tu email solo se usa para avisarte del lanzamiento (vía Resend, guardado en nuestra base).",
    }),
    privacyLink: pickQuad(locale, {
      fr: "Politique de confidentialité",
      en: "Privacy policy",
      nl: "Privacybeleid",
      es: "Política de privacidad",
    }),
    unsubscribe: pickQuad(locale, {
      fr: "Pour vous désinscrire : contact@paypulss.com, ou répondez à l'email de lancement.",
      en: "To unsubscribe: contact@paypulss.com, or reply to the launch email.",
      nl: "Uitschrijven: contact@paypulss.com, of beantwoord de lanceer-e-mail.",
      es: "Para darte de baja: contact@paypulss.com, o responde al email de lanzamiento.",
    }),
    success: pickQuad(locale, {
      fr: "C'est noté. On vous écrit dès l'ouverture.",
      en: "Got it. We'll email you when we open.",
      nl: "Genoteerd. We mailen je zodra we openen.",
      es: "Anotado. Te escribimos en cuanto abramos.",
    }),
    errorInvalid: pickQuad(locale, {
      fr: "Adresse email invalide.",
      en: "Invalid email address.",
      nl: "Ongeldig e-mailadres.",
      es: "Correo electrónico no válido.",
    }),
    errorServer: pickQuad(locale, {
      fr: "Une erreur est survenue. Réessayez dans un instant.",
      en: "Something went wrong. Please try again shortly.",
      nl: "Er ging iets mis. Probeer het zo opnieuw.",
      es: "Ha ocurrido un error. Inténtalo de nuevo en un momento.",
    }),
    errorRateLimit: pickQuad(locale, {
      fr: "Trop de tentatives. Réessayez dans une minute.",
      en: "Too many attempts. Try again in a minute.",
      nl: "Te veel pogingen. Probeer het over een minuut opnieuw.",
      es: "Demasiados intentos. Vuelve a intentarlo en un minuto.",
    }),
    close: pickQuad(locale, {
      fr: "Fermer",
      en: "Close",
      nl: "Sluiten",
      es: "Cerrar",
    }),
    pricingNote: pickQuad(locale, {
      fr: "Tarifs prévus au lancement",
      en: "Pricing planned for launch",
      nl: "Prijzen gepland bij lancering",
      es: "Tarifas previstas para el lanzamiento",
    }),
    trustEarly: pickQuad(locale, {
      fr: "Accès anticipé · Lancement prochain",
      en: "Early access · Launching soon",
      nl: "Vroege toegang · Binnenkort live",
      es: "Acceso anticipado · Lanzamiento próximo",
    }),
  };
}
