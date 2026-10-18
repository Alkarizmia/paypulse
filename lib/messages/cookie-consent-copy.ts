import type { AppLocale } from "@/lib/app-locale";
import { pickQuad } from "@/lib/messages/pick";

export function getCookieConsentCopy(locale: AppLocale) {
  return {
    title: pickQuad(locale, {
      fr: "Cookies et mesure d'audience",
      en: "Cookies and analytics",
      nl: "Cookies en statistieken",
      es: "Cookies y analítica",
    }),
    body: pickQuad(locale, {
      fr: "Nous utilisons Google Analytics uniquement si vous acceptez. Cela nous aide à comprendre l'usage du site, sans publicité ciblée.",
      en: "We use Google Analytics only if you accept. It helps us understand how the site is used, with no targeted ads.",
      nl: "We gebruiken Google Analytics alleen als je akkoord gaat. Zo begrijpen we het gebruik van de site, zonder gerichte advertenties.",
      es: "Usamos Google Analytics solo si aceptas. Nos ayuda a entender el uso del sitio, sin publicidad dirigida.",
    }),
    accept: pickQuad(locale, {
      fr: "Accepter",
      en: "Accept",
      nl: "Accepteren",
      es: "Aceptar",
    }),
    refuse: pickQuad(locale, {
      fr: "Refuser",
      en: "Refuse",
      nl: "Weigeren",
      es: "Rechazar",
    }),
    privacy: pickQuad(locale, {
      fr: "Politique de confidentialité",
      en: "Privacy policy",
      nl: "Privacybeleid",
      es: "Política de privacidad",
    }),
  };
}
