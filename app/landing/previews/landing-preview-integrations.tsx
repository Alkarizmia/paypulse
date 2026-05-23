"use client";

import { IntegrationBrandIcon } from "@/app/dashboard/integrations/integration-brand-icon";
import { LandingPreviewShell } from "@/app/landing/landing-preview-shell";
import type { AppLocale } from "@/lib/app-locale";
import { getDashboardHomeCopy } from "@/lib/messages/dashboard-home-copy";
import { pickQuad } from "@/lib/messages/pick";
import type { UiResolvedAppearance } from "@/lib/ui-theme";

export function LandingPreviewIntegrations({
  locale,
  appearance,
  onToggleAppearance,
}: {
  locale: AppLocale;
  appearance: UiResolvedAppearance;
  onToggleAppearance: () => void;
}) {
  const light = appearance === "light";
  const t = getDashboardHomeCopy(locale);

  const panel = light
    ? "rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
    : "rounded-2xl border border-white/[0.08] bg-[#14141c] p-4 sm:p-5";
  const head = light ? "text-slate-900" : "text-white";
  const muted = light ? "text-slate-600" : "text-slate-400";

  const teamTitle = pickQuad(locale, {
    fr: "Équipe",
    en: "Team",
    nl: "Team",
    es: "Equipo",
  });
  const teamSub = pickQuad(locale, {
    fr: "Plans Pro et Agence : invitez des collaborateurs avec un rôle adapté.",
    en: "Pro and Agency plans: invite colleagues with the right role.",
    nl: "Pro- en Agency-abonnement: nodig collega’s uit met de juiste rol.",
    es: "Planes Pro y Agency: invite colaboradores con el rol adecuado.",
  });
  const invitePlaceholder = pickQuad(locale, {
    fr: "collaborateur@exemple.com",
    en: "colleague@example.com",
    nl: "collega@voorbeeld.nl",
    es: "colaborador@ejemplo.com",
  });
  const inviteBtn = pickQuad(locale, {
    fr: "Inviter",
    en: "Invite",
    nl: "Uitnodigen",
    es: "Invitar",
  });

  return (
    <LandingPreviewShell
      locale={locale}
      appearance={appearance}
      onToggleAppearance={onToggleAppearance}
      windowTitle={`PayPulss · ${t.integrationsPageTitle}`}
    >
      <div className="space-y-4 p-3 sm:p-4">
        <header>
          <h2 className={`text-sm font-bold tracking-tight ${head}`}>{t.integrationsPageTitle}</h2>
          <p className={`mt-1 text-xs leading-relaxed ${muted}`}>{t.integrationsPageIntro}</p>
        </header>

        <article className={panel}>
          <div className="flex items-start gap-3">
            <IntegrationBrandIcon className="h-12 w-12 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className={`text-sm font-semibold ${head}`}>{t.integrationsCalendarTitle}</h3>
                <span
                  className={
                    light
                      ? "rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800"
                      : "rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200"
                  }
                >
                  {t.calendarStatusConnected}
                </span>
              </div>
              <p className={`mt-2 text-xs leading-relaxed ${muted}`}>{t.integrationsCalendarBody}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 pointer-events-none">
            <span
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                light ? "bg-violet-600 text-white" : "bg-violet-600 text-white"
              }`}
            >
              {t.calendarSyncNow}
            </span>
            <span
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                light ? "border-slate-200 text-slate-700" : "border-white/10 text-slate-300"
              }`}
            >
              {t.calendarDisconnect}
            </span>
          </div>
        </article>

        <article className={panel}>
          <h3 className={`text-sm font-semibold ${head}`}>{teamTitle}</h3>
          <p className={`mt-1 text-xs ${muted}`}>{teamSub}</p>
          <div className="mt-3 flex gap-2 pointer-events-none">
            <input
              type="email"
              readOnly
              value={invitePlaceholder}
              className={`min-w-0 flex-1 rounded-lg border px-3 py-2 text-xs ${
                light ? "border-slate-200 bg-slate-50 text-slate-600" : "border-white/10 bg-[#0f0f14] text-slate-400"
              }`}
            />
            <span
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold ${
                light ? "bg-slate-900 text-white" : "bg-violet-600 text-white"
              }`}
            >
              {inviteBtn}
            </span>
          </div>
          <p className={`mt-3 text-[10px] ${muted}`}>
            {pickQuad(locale, {
              fr: "Mode local ou Supabase : vous choisissez où vit la base.",
              en: "Local or Supabase: you choose where data lives.",
              nl: "Lokaal of Supabase: jij kiest waar gegevens staan.",
              es: "Local o Supabase: tú eliges dónde viven los datos.",
            })}
          </p>
        </article>
      </div>
    </LandingPreviewShell>
  );
}
