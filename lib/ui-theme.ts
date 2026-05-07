import { useEffect, useMemo, useState } from "react";

export type UiThemePreference = "dark" | "light" | "system";
/** Thème après résolution (`system` + préférence stockée). */
export type UiResolvedAppearance = "light" | "dark";
const THEME_STORAGE_KEY = "paypulss_ui_theme_pref_v1";
const THEME_EVENT_NAME = "paypulss:ui-theme-changed";

export function resolveUiTheme(pref: UiThemePreference, systemIsDark: boolean): "dark" | "light" {
  if (pref === "system") return systemIsDark ? "dark" : "light";
  return pref === "light" ? "light" : "dark";
}

export function usePrefersColorSchemeDark(): boolean {
  const [v, setV] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const u = () => setV(mq.matches);
    u();
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
  }, []);
  return v;
}

export function readStoredUiThemePreference(): UiThemePreference | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (raw === "dark" || raw === "light" || raw === "system") return raw;
  return null;
}

export function writeStoredUiThemePreference(pref: UiThemePreference): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_STORAGE_KEY, pref);
  window.dispatchEvent(new CustomEvent<UiThemePreference>(THEME_EVENT_NAME, { detail: pref }));
}

export function subscribeUiThemePreferenceChange(onChange: (pref: UiThemePreference) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (ev: Event) => {
    const pref = (ev as CustomEvent<UiThemePreference>).detail;
    if (pref === "dark" || pref === "light" || pref === "system") onChange(pref);
  };
  window.addEventListener(THEME_EVENT_NAME, handler as EventListener);
  return () => window.removeEventListener(THEME_EVENT_NAME, handler as EventListener);
}

/** Même logique que `DashboardShell` / `DashboardView` quand `appearance` n’est pas forcé — pour styler le contenu des sous-pages. */
export function useResolvedUiAppearance(): UiResolvedAppearance {
  const systemDark = usePrefersColorSchemeDark();
  const [pref, setPref] = useState<UiThemePreference>(() => readStoredUiThemePreference() ?? "light");
  useEffect(() => {
    return subscribeUiThemePreferenceChange(setPref);
  }, []);
  return useMemo(() => (resolveUiTheme(pref, systemDark) === "light" ? "light" : "dark"), [pref, systemDark]);
}
