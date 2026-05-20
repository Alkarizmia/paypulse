import type { AppLocale } from "@/lib/app-locale";
import { intlLocaleFor } from "@/lib/app-locale";

export type DisplayCurrency = "EUR" | "USD";

const STORAGE_KEY = "paypulss_display_currency_v1";

/** Taux indicatif EUR → USD (1 EUR ≠ 1 USD). Surcharge via NEXT_PUBLIC_EUR_USD_RATE. */
export function readEurUsdRate(): number {
  const raw = process.env.NEXT_PUBLIC_EUR_USD_RATE;
  const n = raw ? Number.parseFloat(raw) : 1.16;
  return Number.isFinite(n) && n > 0 ? n : 1.16;
}

/** Précision stockage / saisie (alignée sur numeric(12,2) en base). */
const STORAGE_DECIMALS = 2;

function roundToDecimals(n: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

export function isDisplayCurrency(v: string | null | undefined): v is DisplayCurrency {
  return v === "EUR" || v === "USD";
}

export function readStoredDisplayCurrency(): DisplayCurrency {
  if (typeof window === "undefined") return "EUR";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return isDisplayCurrency(v) ? v : "EUR";
  } catch {
    return "EUR";
  }
}

export function writeStoredDisplayCurrency(currency: DisplayCurrency): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, currency);
  } catch {
    /* ignore */
  }
}

/** Montants dossiers stockés en EUR ; affichage selon la devise choisie. */
export function convertEurToDisplay(amountEur: number, currency: DisplayCurrency): number {
  if (!Number.isFinite(amountEur)) return 0;
  if (currency === "EUR") return amountEur;
  return roundToDecimals(amountEur * readEurUsdRate(), STORAGE_DECIMALS);
}

export function convertDisplayToEur(amount: number, currency: DisplayCurrency): number {
  if (!Number.isFinite(amount)) return 0;
  if (currency === "EUR") return roundToDecimals(amount, STORAGE_DECIMALS);
  return roundToDecimals(amount / readEurUsdRate(), STORAGE_DECIMALS);
}

/** Valeur pour champs texte (évite 453 au lieu de 452,9 après conversion). */
export function formatAmountForInput(amountEur: number, currency: DisplayCurrency): string {
  const v = convertEurToDisplay(amountEur, currency);
  const fixed = roundToDecimals(v, STORAGE_DECIMALS).toFixed(STORAGE_DECIMALS);
  return fixed.replace(/\.?0+$/, "").replace(".", ",");
}

export type MoneyFormatter = {
  displayCurrency: DisplayCurrency;
  eurUsdRate: number;
  /** Formate un montant stocké en EUR. */
  format: (
    amountEur: number,
    options?: { compact?: boolean; maxFractionDigits?: number; minFractionDigits?: number },
  ) => string;
  /** Libellé champ saisie, ex. « Montant dû (USD) » */
  amountFieldLabel: (baseLabel: string) => string;
};

export function createMoneyFormatter(locale: AppLocale, displayCurrency: DisplayCurrency): MoneyFormatter {
  const intlLocale = intlLocaleFor(locale);
  const eurUsdRate = readEurUsdRate();

  function format(
    amountEur: number,
    options?: { compact?: boolean; maxFractionDigits?: number; minFractionDigits?: number },
  ) {
    const display = convertEurToDisplay(amountEur, displayCurrency);
    const maxFd = options?.maxFractionDigits ?? (options?.compact ? 1 : STORAGE_DECIMALS);
    const minFd = options?.minFractionDigits ?? 0;
    return new Intl.NumberFormat(intlLocale, {
      style: "currency",
      currency: displayCurrency,
      minimumFractionDigits: minFd,
      maximumFractionDigits: maxFd,
      notation: options?.compact ? "compact" : "standard",
    }).format(display);
  }

  return {
    displayCurrency,
    eurUsdRate,
    format,
    amountFieldLabel: (baseLabel: string) => {
      const code = displayCurrency === "USD" ? "USD" : "EUR";
      if (baseLabel.includes("€") || baseLabel.includes("$") || /\((EUR|USD)\)/i.test(baseLabel)) {
        return baseLabel.replace(/\(€\)|\(EUR\)/gi, `(${code})`).replace(/\$/g, "");
      }
      return `${baseLabel} (${code})`;
    },
  };
}

export function formatRateHint(locale: AppLocale, rate: number): string {
  const r = rate.toLocaleString(intlLocaleFor(locale), { maximumFractionDigits: 4 });
  if (locale === "fr") {
    return `Taux indicatif : 1 EUR = ${r} USD. Les montants en base de données restent en EUR ; l’affichage et la saisie utilisent la conversion.`;
  }
  if (locale === "nl") {
    return `Indicatieve koers: 1 EUR = ${r} USD. Bedragen worden in EUR bewaard ; weergave en invoer volgen de conversie.`;
  }
  if (locale === "es") {
    return `Tipo orientativo: 1 EUR = ${r} USD. Los importes se guardan en EUR ; la visualización y la entrada usan la conversión.`;
  }
  return `Indicative rate: 1 EUR = ${r} USD. Amounts are stored in EUR; display and entry use conversion.`;
}
