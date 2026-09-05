/** Langues supportées (interface + profil). */
export type AppLocale = "fr" | "en" | "nl" | "es";

export const APP_LOCALES: readonly AppLocale[] = ["en", "fr", "nl", "es"] as const;

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return value === "fr" || value === "en" || value === "nl" || value === "es";
}

export function intlLocaleFor(app: AppLocale): string {
  switch (app) {
    case "fr":
      return "fr-FR";
    case "nl":
      return "nl-NL";
    case "es":
      return "es-ES";
    default:
      return "en-US";
  }
}
