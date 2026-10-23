"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { type AppLocale, isAppLocale } from "@/lib/app-locale";

export type Locale = AppLocale;

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

const STORAGE_KEY = "paypulss_locale";
const LEGACY_STORAGE_KEY = "paypulse_locale";

export function LocaleProvider({ children }: { children: ReactNode }) {
  /** Always "en" on first render (server + hydration), then stored locale after mount (app use). */
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (isAppLocale(stored)) {
        setLocale(stored);
        if (!window.localStorage.getItem(STORAGE_KEY)) {
          window.localStorage.setItem(STORAGE_KEY, stored);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "en" ? "en" : locale;
  }, [locale]);

  function setAndPersist(next: Locale) {
    setLocale(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
      window.localStorage.setItem(LEGACY_STORAGE_KEY, next);
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
