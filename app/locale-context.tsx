"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { type AppLocale, isAppLocale } from "@/lib/app-locale";

export type Locale = AppLocale;

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") return "fr";
    try {
      const stored = window.localStorage.getItem("paypulse_locale");
      return isAppLocale(stored) ? stored : "fr";
    } catch {
      return "fr";
    }
  });

  function setAndPersist(next: Locale) {
    setLocale(next);
    try {
      window.localStorage.setItem("paypulse_locale", next);
    } catch {
      // ignore
    }
  }

  const value = useMemo(() => ({ locale, setLocale: setAndPersist }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used inside LocaleProvider");
  }
  return ctx;
}

export type { AppLocale } from "@/lib/app-locale";
