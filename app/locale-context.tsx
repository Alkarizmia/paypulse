"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { type AppLocale, isAppLocale } from "@/lib/app-locale";

export type Locale = AppLocale;

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  /** Toujours « fr » au premier rendu (serveur + hydratation), puis locale stockée après montage. */
  const [locale, setLocale] = useState<Locale>("fr");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("paypulse_locale");
      if (isAppLocale(stored) && stored !== "fr") {
        setLocale(stored);
      }
    } catch {
      // ignore
    }
  }, []);

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
