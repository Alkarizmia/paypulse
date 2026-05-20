"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AppLocale } from "@/lib/app-locale";
import { getMaxWorkspaces } from "@/lib/plans";
import type { UiResolvedAppearance } from "@/lib/ui-theme";
import { useWorkspace } from "@/app/workspace-context";

type WorkspacesPanelProps = {
  locale: AppLocale;
  appearance: UiResolvedAppearance;
  /** compact = liste cliquable ; full = avec encart plan */
  variant?: "compact" | "full";
  /** Après changement de portefeuille (ex. retour accueil). */
  onAfterSwitch?: () => void;
};

function copyFor(locale: AppLocale, max: number, isMulti: boolean) {
  if (locale === "fr") {
    return {
      title: "Portefeuilles",
      hint: isMulti
        ? `Jusqu’à ${max} portefeuilles. Cliquez pour activer celui affiché sur le dashboard.`
        : "Un portefeuille actif. Cliquez pour le sélectionner.",
      manage: "Gérer les portefeuilles (paramètres)",
      active: "Actif",
    };
  }
  if (locale === "nl") {
    return {
      title: "Portefeuilles",
      hint: isMulti
        ? `Tot ${max} portefeuilles. Klik om het actieve portefeuille te wijzigen.`
        : "Eén actief portefeuille. Klik om te selecteren.",
      manage: "Portefeuilles beheren (instellingen)",
      active: "Actief",
    };
  }
  if (locale === "es") {
    return {
      title: "Carteras",
      hint: isMulti
        ? `Hasta ${max} carteras. Pulse para activar la del dashboard.`
        : "Una cartera activa. Pulse para seleccionar.",
      manage: "Gestionar carteras (ajustes)",
      active: "Activa",
    };
  }
  return {
    title: "Wallets",
    hint: isMulti
      ? `Up to ${max} wallets. Click to switch the active dashboard wallet.`
      : "One active wallet. Click to select it.",
    manage: "Manage wallets (settings)",
    active: "Active",
  };
}

export function WorkspacesPanel({
  locale,
  appearance,
  variant = "compact",
  onAfterSwitch,
}: WorkspacesPanelProps) {
  const ws = useWorkspace();
  const router = useRouter();
  const light = appearance === "light";
  const max = getMaxWorkspaces(ws.planId);
  const t = copyFor(locale, max, max > 1);

  if (!ws.supabaseMode || !ws.ready || ws.workspaces.length === 0) {
    return null;
  }

  const panel =
    variant === "full"
      ? light
        ? "rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
        : "rounded-2xl border border-white/[0.08] bg-[#14141c] p-4 sm:p-5"
      : "";

  const head = light ? "text-slate-900" : "text-white";
  const muted = light ? "text-slate-600" : "text-slate-400";

  async function selectWorkspace(id: string) {
    if (id === ws.activeWorkspaceId) return;
    await ws.setActiveWorkspaceId(id);
    if (onAfterSwitch) {
      onAfterSwitch();
    } else {
      router.push("/dashboard");
    }
  }

  const list = (
    <ul className="mt-3 space-y-1.5">
      {ws.workspaces.map((w) => {
        const active = w.id === ws.activeWorkspaceId;
        return (
          <li key={w.id}>
            <button
              type="button"
              onClick={() => void selectWorkspace(w.id)}
              className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                active
                  ? light
                    ? "bg-violet-50 font-semibold text-violet-900 ring-1 ring-violet-200"
                    : "bg-violet-500/15 font-semibold text-violet-100 ring-1 ring-violet-500/35"
                  : light
                    ? "text-slate-700 hover:bg-slate-50"
                    : "text-slate-300 hover:bg-white/[0.06]"
              }`}
            >
              <span className="truncate">{w.name}</span>
              {active ? (
                <span
                  className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide ${
                    light ? "text-violet-600" : "text-violet-300"
                  }`}
                >
                  {t.active}
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );

  const manageLink = (
    <Link
      href="/settings#workspaces"
      className={`mt-3 inline-flex text-xs font-semibold ${
        light ? "text-violet-700 hover:underline" : "text-violet-300 hover:underline"
      }`}
    >
      {t.manage}
    </Link>
  );

  if (variant === "compact") {
    return (
      <div>
        <h2 className={`text-sm font-semibold ${head}`}>{t.title}</h2>
        <p className={`mt-1 text-xs ${muted}`}>{t.hint}</p>
        {list}
        {manageLink}
      </div>
    );
  }

  return (
    <div className={panel}>
      <h2 className={`text-sm font-semibold ${head}`}>{t.title}</h2>
      <p className={`mt-1 text-xs ${muted}`}>{t.hint}</p>
      {list}
      {manageLink}
    </div>
  );
}
