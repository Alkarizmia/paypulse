"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/app/auth-context";
import { useLocale } from "@/app/locale-context";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { getProfile } from "@/lib/profile";
import {
  createMoneyFormatter,
  type DisplayCurrency,
  isDisplayCurrency,
  readStoredDisplayCurrency,
  writeStoredDisplayCurrency,
  type MoneyFormatter,
} from "@/lib/display-currency";

type DisplayCurrencyContextValue = {
  displayCurrency: DisplayCurrency;
  setDisplayCurrency: (currency: DisplayCurrency) => void;
  money: MoneyFormatter;
};

const DisplayCurrencyContext = createContext<DisplayCurrencyContextValue | null>(null);

export function DisplayCurrencyProvider({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  const { user } = useAuth();
  const [displayCurrency, setDisplayCurrencyState] = useState<DisplayCurrency>("EUR");

  useEffect(() => {
    queueMicrotask(() => setDisplayCurrencyState(readStoredDisplayCurrency()));
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    let cancelled = false;
    void getProfile(supabase, user.id).then((p) => {
      if (cancelled || !p?.displayCurrency) return;
      if (isDisplayCurrency(p.displayCurrency)) {
        setDisplayCurrencyState(p.displayCurrency);
        writeStoredDisplayCurrency(p.displayCurrency);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const setDisplayCurrency = useCallback((currency: DisplayCurrency) => {
    setDisplayCurrencyState(currency);
    writeStoredDisplayCurrency(currency);
  }, []);

  const money = useMemo(() => createMoneyFormatter(locale, displayCurrency), [locale, displayCurrency]);

  const value = useMemo(
    () => ({ displayCurrency, setDisplayCurrency, money }),
    [displayCurrency, setDisplayCurrency, money],
  );

  return <DisplayCurrencyContext.Provider value={value}>{children}</DisplayCurrencyContext.Provider>;
}

export function useDisplayCurrency() {
  const ctx = useContext(DisplayCurrencyContext);
  if (!ctx) {
    throw new Error("useDisplayCurrency must be used inside DisplayCurrencyProvider");
  }
  return ctx;
}

/** Hook pratique pour les composants dashboard. */
export function useMoney() {
  return useDisplayCurrency().money;
}
