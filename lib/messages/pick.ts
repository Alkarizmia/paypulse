import type { AppLocale } from "@/lib/app-locale";

export type Quad<T = string> = { fr: T; en: T; nl: T; es: T };

export function pickQuad<T>(locale: AppLocale, q: Quad<T>): T {
  switch (locale) {
    case "fr":
      return q.fr;
    case "nl":
      return q.nl;
    case "es":
      return q.es;
    default:
      return q.en;
  }
}
