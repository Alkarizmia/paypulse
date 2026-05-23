"use client";

import { useMemo } from "react";
import { OrganisationCalendar } from "@/app/dashboard/organisation/organisation-calendar";
import { LandingPreviewShell } from "@/app/landing/landing-preview-shell";
import type { AppLocale } from "@/lib/app-locale";
import { intlLocaleFor } from "@/lib/app-locale";
import { buildCalendarEventsFromClients } from "@/lib/organization-calendar";
import { getOrganizationCopy } from "@/lib/messages/organization-copy";
import { LANDING_DEMO_CLIENTS } from "@/lib/landing-demo-clients";
import { pickQuad } from "@/lib/messages/pick";
import type { UiResolvedAppearance } from "@/lib/ui-theme";

export function LandingPreviewOrganisation({
  locale,
  appearance,
  onToggleAppearance,
}: {
  locale: AppLocale;
  appearance: UiResolvedAppearance;
  onToggleAppearance: () => void;
}) {
  const light = appearance === "light";
  const copy = getOrganizationCopy(locale);

  const events = useMemo(
    () =>
      buildCalendarEventsFromClients(LANDING_DEMO_CLIENTS, {
        due: copy.dueLabel,
        payment: copy.paymentLabel,
        reminderSent: copy.reminderSentLabel,
        reminderPlanned: copy.reminderPlannedLabel,
      }),
    [copy],
  );

  const monthLabel = useMemo(
    () => (year: number, month: number) =>
      new Intl.DateTimeFormat(intlLocaleFor(locale), { month: "long", year: "numeric" }).format(
        new Date(year, month, 1),
      ),
    [locale],
  );

  const panel = light
    ? "rounded-2xl border border-slate-200 bg-white p-3 sm:p-4"
    : "rounded-2xl border border-white/[0.08] bg-[#14141c] p-3 sm:p-4";
  const head = light ? "text-slate-900" : "text-white";
  const muted = light ? "text-slate-600" : "text-slate-400";
  const input = light
    ? "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
    : "mt-1 w-full rounded-lg border border-white/10 bg-[#0f0f14] px-3 py-2 text-sm text-white";

  const founder = pickQuad(locale, {
    fr: "El Fahmi Bilal",
    en: "El Fahmi Bilal",
    nl: "El Fahmi Bilal",
    es: "El Fahmi Bilal",
  });
  const orgLine = pickQuad(locale, {
    fr: "Trevi · Belgique",
    en: "Trevi · Belgium",
    nl: "Trevi · België",
    es: "Trevi · Bélgica",
  });

  return (
    <LandingPreviewShell
      locale={locale}
      appearance={appearance}
      onToggleAppearance={onToggleAppearance}
      windowTitle={`PayPulss · ${copy.title}`}
    >
      <div className="space-y-4 p-3 sm:p-4">
        <header>
          <h2 className={`text-sm font-bold tracking-tight ${head}`}>{copy.title}</h2>
          <p className={`mt-1 text-xs leading-relaxed ${muted}`}>{copy.subtitle}</p>
        </header>

        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_min(11rem,14rem)]">
          <OrganisationCalendar events={events} copy={copy} appearance={appearance} localeMonthLabel={monthLabel} />

          <aside className="flex min-w-0 flex-col gap-3">
            <div className={panel}>
              <h3 className={`text-xs font-semibold ${head}`}>{copy.profileTitle}</h3>
              <p className={`mt-2 text-xs leading-relaxed ${muted}`}>
                {founder}
                <br />
                <span>{orgLine}</span>
              </p>
              <p className={`mt-2 text-[10px] font-semibold ${light ? "text-violet-700" : "text-violet-300"}`}>
                {copy.editProfile}
              </p>
            </div>

            <div className={panel}>
              <h3 className={`text-xs font-semibold ${head}`}>{copy.workspacesTitle}</h3>
              <p className={`mt-1 text-[10px] ${muted}`}>{copy.workspacesHint}</p>
              <ul className="mt-2 space-y-1.5">
                <li
                  className={`rounded-lg px-2.5 py-2 text-xs font-semibold ${
                    light ? "bg-violet-100 text-violet-900" : "bg-violet-600/25 text-violet-100"
                  }`}
                >
                  Principal · {pickQuad(locale, { fr: "ACTIF", en: "ACTIVE", nl: "ACTIEF", es: "ACTIVA" })}
                </li>
              </ul>
            </div>

            <div className={panel}>
              <h3 className={`text-xs font-semibold ${head}`}>{copy.addEvent}</h3>
              <div className="mt-2 space-y-2 pointer-events-none opacity-90">
                <label className="block">
                  <span className={`text-[10px] font-semibold uppercase tracking-wide ${muted}`}>{copy.eventTitle}</span>
                  <input
                    type="text"
                    readOnly
                    value={pickQuad(locale, {
                      fr: "Réunion, relance téléphonique…",
                      en: "Meeting, follow-up call…",
                      nl: "Vergadering, telefonische opvolging…",
                      es: "Reunión, llamada de seguimiento…",
                    })}
                    className={input}
                  />
                </label>
                <label className="block">
                  <span className={`text-[10px] font-semibold uppercase tracking-wide ${muted}`}>{copy.eventDate}</span>
                  <input type="date" readOnly value="2026-05-23" className={input} />
                </label>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </LandingPreviewShell>
  );
}
