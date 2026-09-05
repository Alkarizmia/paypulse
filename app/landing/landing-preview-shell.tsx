"use client";

import type { ReactNode } from "react";
import type { UiResolvedAppearance } from "@/lib/ui-theme";
import { pickQuad } from "@/lib/messages/pick";
import type { AppLocale } from "@/lib/app-locale";

/** Hauteur fixe du cadre produit (tous les onglets). */

export const LANDING_PREVIEW_FRAME_CLASS = "h-[34rem]";

type LandingPreviewShellProps = {
  locale: AppLocale;
  windowTitle: string;
  appearance: UiResolvedAppearance;
  onToggleAppearance: () => void;
  children: ReactNode;
  frameClassName?: string;
};

export function LandingPreviewShell({
  locale,
  windowTitle,
  appearance,
  onToggleAppearance,
  children,
  frameClassName,
}: LandingPreviewShellProps) {
  const light = appearance === "light";
  const toggleLabel = pickQuad(locale, {
    fr: appearance === "dark" ? "Mode clair" : "Mode sombre",
    en: appearance === "dark" ? "Light mode" : "Dark mode",
    nl: appearance === "dark" ? "Lichte modus" : "Donkere modus",
    es: appearance === "dark" ? "Modo claro" : "Modo oscuro",
  });

  return (
    <div
      className={`flex ${frameClassName ?? LANDING_PREVIEW_FRAME_CLASS} flex-col overflow-hidden ${
        light ? "bg-slate-100" : "bg-[#08080c]"
      }`}
    >
      <div
        className={`flex shrink-0 items-center justify-between gap-3 border-b px-3 py-2.5 sm:px-4 ${
          light ? "border-slate-200 bg-white" : "border-white/[0.08] bg-[#0c0c12]"
        }`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-red-400/90" aria-hidden />
          <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400/90" aria-hidden />
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400/90" aria-hidden />
          <span className={`ml-1 truncate text-[11px] font-medium sm:text-xs ${light ? "text-slate-500" : "text-slate-500"}`}>
            {windowTitle}
          </span>
        </div>
        <button
          type="button"
          onClick={onToggleAppearance}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold transition sm:text-xs ${
            light
              ? "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              : "border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
          }`}
          aria-label={toggleLabel}
        >
          {appearance === "dark" ? (
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1.5M12 19.5V21M4.22 4.22l1.06 1.06M18.72 18.72l1.06 1.06M3 12h1.5M19.5 12H21M4.22 19.78l1.06-1.06M18.72 5.28l1.06-1.06M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          )}
          <span className="hidden sm:inline">{toggleLabel}</span>
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">{children}</div>
    </div>
  );
}
